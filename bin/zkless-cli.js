#!/usr/bin/env node

const parseArgs = require('minimist');
const path = require('path');
const zklessCompile = require('../src/index.js');

const argv = parseArgs(process.argv.slice(2), {
    alias: { source: 's', output: 'o', imports: 'i', watch: 'w', compress: 'c'},
    default: {
        'source': 'src/main/resources/web',
        'output': 'target/classes/web',
        'imports': [],
        'watch': false,
        'compress': false,
        'less-opts': '{}'
    }
});
delete argv.s;
delete argv.o;
delete argv.i;
delete argv.w;
delete argv.c;

console.log('Executing zkless-engine with params:');
console.table(argv);

const sourceDir = path.resolve(argv.source);
const outputDir = path.resolve(argv.output);
const importDirs = [].concat(argv.imports).map(imp => path.resolve(imp));
const watch = argv.watch;
const lessOptions = {
    paths: [sourceDir, ...importDirs],
    compress: argv.compress,
    ...(JSON.parse(argv['less-opts']))
};

zklessCompile(sourceDir, outputDir, { importDirs, watch, lessOptions })
    .then(results => {
        if (!watch) console.log("zkless finished");
    })
    .catch(error => {
        console.log("zkless failed:", error.message);
        process.exitCode = 1;
    });
