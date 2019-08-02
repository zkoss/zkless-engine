'use strict';
const path = require('path');
const assert = require('assert');
const fse = require('fs-extra');

const zklessCompile = require('../src/index.js');

const theme1Dir = path.resolve(__dirname, 'testFiles/theme1/');
const tempOutputDir = path.resolve(__dirname, 'tempOutput/');
const ext1Dir = path.resolve(__dirname, 'testFiles/ext1');
const ext2Dir = path.resolve(__dirname, 'testFiles/ext2');
const importDirs = [ext1Dir, ext2Dir];
const lessOptions =  {paths: [theme1Dir, ...importDirs]};

describe('src/index.js', function() {
  describe('zklessCompile', function() {
    it('should compile 2 files', function(done) {
      zklessCompile(theme1Dir, tempOutputDir, {importDirs, lessOptions})
        .then(results => {
          assert(results.length == 2);
          const resultsByOutputPath = {};
          results.forEach(result => {
            resultsByOutputPath[path.relative(tempOutputDir, result.outputPath)] = result.output;
          });
          
          const mainResult = resultsByOutputPath['main.css.dsp'];
          const subSubResult = resultsByOutputPath['sub/sub.css.dsp'];

          assert.equal(mainResult.css, ".mainstyle {\n  content: 'mainstylecontent';\n  color: red;\n}\n.ext1 {\n  content: 'ext1-content';\n}\n.ext2 {\n  content: 'ext2-content';\n}\n");
          assert.equal(subSubResult.css, '');
          fse.remove(tempOutputDir)
          done();
        })
        .catch(done);
    });
  });
});
