#!/usr/bin/env node

const parseArgs = require('minimist');
const path = require('path');
const zklessCompile = require('../src/index.js');

const argv = parseArgs(process.argv.slice(2), {
    alias: { source: 's', output: 'o', imports: 'i', watch: 'w', compress: 'c', extension: 'e' },
    default: {
        'source': 'src/main/resources/web',
        'output': 'target/classes/web',
        'imports': [],
        'compress': false,
        'extension': '.css.dsp',
        'less-opts': '{}',
        'watch': false,
        'live-reload-port': 50000
    }
});
delete argv.s;
delete argv.o;
delete argv.i;
delete argv.w;
delete argv.c;
delete argv.e;

console.log('Executing zkless-engine with params:');
console.log(argv);

const sourceDir = path.resolve(argv.source);
const outputDir = path.resolve(argv.output);
const importDirs = [].concat(argv.imports).map(imp => path.resolve(imp));
const extension = argv.extension;
const lessOptions = {
    paths: [sourceDir, ...importDirs],
    compress: argv.compress,
    ...(JSON.parse(argv['less-opts']))
};
const watch = argv.watch;
const liveReloadPort = argv['live-reload-port']

zklessCompile(sourceDir, outputDir, { importDirs, extension, lessOptions, watch, liveReloadPort })
    .then(results => {
        if (!watch) console.log("zkless finished");
    })
    .catch(error => {
        console.log("zkless failed:", error.message);
        process.exitCode = 1;
    });
