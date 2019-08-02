'use strict';

const path = require('path');
const fse = require('fs-extra');
const chokidar = require('chokidar');
const less = require('less');

const cwdRelative = p => path.relative(process.cwd(), p);
const filterEmpty = array => array.filter(Boolean);

function ignoreNonLessFiles(path, stats) {
    if (!stats) { return false; }
    return !(stats.isDirectory() || path.endsWith('.less'));
}

function compileFile(sourcePath, sourceDir, outputDir, options) {
    const relativeSourcePath = path.relative(sourceDir, sourcePath);
    if (path.basename(sourcePath)[0] === '_') {
        console.log('skip file...', cwdRelative(sourcePath));
        return Promise.resolve();
    }
    const outputPath = path.resolve(
        outputDir,
        relativeSourcePath
            .replace('.less', '.css.dsp')
            .replace(/([\/\\\\])less([\/\\\\])/, '$1css$2'));

    console.log('compiling...', cwdRelative(sourcePath), '->', cwdRelative(outputPath));
    return fse.readFile(sourcePath, 'utf8')
        .then(lessInput => lessInput.replace(/(@import\s+['"])~\.\//g, '$1/'))
        .then(lessInput => less.render(lessInput, { ...options, filename: sourcePath }))
        .then(output => {
            fse.ensureFileSync(outputPath);
            fse.writeFile(outputPath, output.css);
            return { sourcePath, output, outputPath };
        });
}

function build(sourceDir, outputDir, lessOptions) {
    const tasks = [];
    const errors = [];
    return new Promise((resolve, reject) => {
        const watcher = chokidar.watch((sourceDir),
            { ignored: ignoreNonLessFiles, ignoreInitial: false, persistent: false })
            .on('add', path => {
                tasks.push(compileFile(path, sourceDir, outputDir, lessOptions)
                    .catch(err => errors.push(err)));
            })
            .on('ready', () => {
                watcher.close();
                Promise.all(tasks)
                    .then(results => errors.length === 0
                        ? resolve(results)
                        : reject(errors));
            });
    });
}

function buildContinuous(sourceDir, importDirs, outputDir, lessOptions, compileResults) {
    console.log('watching source dir for changes')
    console.log(' ', cwdRelative(sourceDir));
    if (importDirs && importDirs.length > 0) {
        console.log('watching import dirs');
        importDirs.forEach(imp => console.log(' ', cwdRelative(imp)));
    }

    console.log('press CTRL-C to exit')

    const lessImports = {};
    const updateLessImports = res => {
        if (res) lessImports[res.sourcePath] = res.output.imports;
        return res;
    };
    const clearLessImports = sourcePath => delete lessImports[sourcePath];
    const importingLessFilesFor = sourcePath => {
        const importing = [];
        for (const key in lessImports) {
            if (lessImports[key].includes(sourcePath)) {
                importing.push(key);
            }
        }
        return importing;
    };
    compileResults.forEach(updateLessImports);

    const handleFileUpdate = function (sourcePath) {

        const start = process.uptime();
        const errors = [];

        const compileAndUpdate = srcPath => {
            if (srcPath.startsWith(sourceDir)) {
                return compileFile(srcPath, sourceDir, outputDir, lessOptions)
                    .then(updateLessImports)
                    .catch(err => errors.push(err));
            }
        };

        console.log('handleFileUpdate', path.relative(process.cwd(), sourcePath));
        Promise.all([compileAndUpdate(sourcePath), ...importingLessFilesFor(sourcePath).map(compileAndUpdate)])
            .then(results => {
                const duration = (process.uptime() - start).toFixed(2);
                if (errors.length === 0) {
                    console.log(`success: compiled ${filterEmpty(results).length} file(s) (${duration} sec)`);
                } else {
                    reportErrors(errors);
                }
            });
    }

    const handleFileDelete = function (sourcePath) {
        console.log('deleted', sourcePath);
        clearLessImports(sourcePath);
        importingLessFilesFor(sourcePath).forEach(handleFileUpdate);
    }

    const watcher = chokidar.watch(sourceDir,
        { ignoreInitial: true, persistent: true, ignored: ignoreNonLessFiles })
        .on('add', path => handleFileUpdate(path))
        .on('change', path => handleFileUpdate(path))
        .on('unlink', path => handleFileDelete(path));

    importDirs && importDirs.forEach(importDir => watcher.add(importDir));
}

function reportErrors(errors) {
    console.error(errors);
    if(Array.isArray(errors)) {
        errors.forEach(err => {
            console.error(`${err.filename}: ${err.line}`);
            console.error(err.toString({stylize: less.lesscHelper.stylize}));
        });
        console.error(`failed with ${errors.length}: errors`);
    }
}

module.exports = function(sourceDir, outputDir, options) {
    const {importDirs, watch, lessOptions} = options;
    console.log({sourceDir, outputDir, importDirs, watch, lessOptions});


    return build(sourceDir, outputDir, lessOptions)
        .then(results => {
            const compileResults = filterEmpty(results);
            console.log(`success: compiled ${compileResults.length} file(s) (${process.uptime().toFixed(3)} sec)`);
            return compileResults;
        })
        .then(compileResults => {
            if (watch) {
                buildContinuous(sourceDir, importDirs, outputDir, lessOptions, compileResults);
            } else {
                return compileResults;
            }
        })
        .catch(errors => {
            reportErrors(errors);
            throw {message: 'zkless compliation failed', details: errors};
        });
};
