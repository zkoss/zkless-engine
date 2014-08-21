
const srcDir = process.argv[2];
const destDir = process.argv[3];
const zulPath = process.argv[4];
const zkmaxPath = process.argv[5];
const theme = process.argv[6] ? process.argv[6] : '';
const genDir = 'codegen/archive/';

(function() {
	var fs = require('fs'),
		walk = require('walk'),
		dir = require('node-dir'),
		unzip = require('unzip'),
		less = require('less'),
		ncp = require('ncp').ncp,
		S = require('string'),
		mkpath = require('./mkpath'),
		helper = require('./SyntaxHelper'),
		files = [],
		imports = [],
		targets = [],
		current = '',
		imcFlag = zkmaxPath ? 2 : 1; //use for checking of copy of imports is done
		// path = require('path'),
		// appDir = path.dirname(require.main.filename),

	//copy the imports from package to the root directory if haven't done it
	if (!fs.existsSync(genDir)) {
		if (zulPath && fs.existsSync(zulPath)) {
			copyImports(zulPath, walkOn);
		}

		if (zkmaxPath && fs.existsSync(zkmaxPath)) {
			copyImports(zkmaxPath, walkOn);
		}
	}

	function copyImports(path, callback) {
		if (fs.lstatSync(path).isDirectory()) {
			dir.subdirs(path, function(err, subdirs) {
				if (err) {
					throw err;
				}

				subdirs.forEach(function(value) {
					if (S(value).endsWith('web')) {
						moveImportsToGen(value);
					}
				});
			});
		} else if (fs.lstatSync(path).isFile()) {
			fs.createReadStream(path).pipe(unzip.Extract({ path: 'temp' }))
			  .on('close', function() {
			  	copyImports('temp', callback);
			});
		}
	}

	function moveImportsToGen(path) {
		var targetImports = [];
		dir.files(path, function(err, files) {
			if (err) {
				throw err;
			}

			files.forEach(function(value) {
				var filename = value.replace(/^.*[\\\/]/, '');
				var data = '';
				if (S(filename).endsWith('.less') && S(filename).startsWith('_')) {
					var genpath = genDir + value.substring(value.indexOf('web'));
					mkpath.sync(genpath.replace(filename, ''), 0700);
					log('copying.....' + value);
					data = fs.readFileSync(value, 'utf-8');
					data = helper.encodeDsp(data, theme, genDir);
					fs.writeFileSync(genpath, data);
				}
			});
			importCheck();
		});
	}

	function importCheck() {
		if ( --imcFlag == 0) {
			walkOn();
		}
	}
	
	function walkOn() {
		var walker = walk.walk(srcDir, {followLinks: false});
		//walk through the root directory and find every .less files and grounds them into imports and targets
		walker.on('file', function(root, stat, next) {
			var fn = stat.name
			if (S(fn).endsWith('.less')) {
				if (S(fn).startsWith('_')) {
					imports.push(root + '/' + fn);
				} else {
					targets.push(root + '/' + fn);
				}
			}
			next();
		});

		//encode the founded imports and save them in codegen folder
		walker.on('end', function() {
			encodeImports();
		});
	}

	function encodeImports() {
		if (imports.length > 0)
			var last = imports[imports.length - 1];

		for (var i = 0; i < imports.length; i++) {
			var cf = imports[i],
				data = fs.readFileSync(cf, 'utf-8');
			if (data) {
				data = helper.encodeDsp(data, theme, genDir);
				if (S(cf).contains('web')) {
					var tempPath = genDir + cf.substring(cf.indexOf('web'));
				}
				mkpath.sync(tempPath.substring(0, tempPath.lastIndexOf('/')), 0700);
				fs.writeFileSync(tempPath, data);
			}
		}

		// compile the targets
		lessCompile();
	}

	function lessCompile() {
		var last = targets[targets.length -1];
		for (var i = 0; i < targets.length; i++) {
			var cp = targets[i];
			console.log('compiling: ' + cp);
			compile(cp, function(css, path) {
				//replace path from src to dest
				var newPath = path.replace(srcDir, destDir).replace('/less', '/css').replace('.less', '.css.dsp.src');
				if(theme) {
					newPath = newPath.replace('/web', '/web/' + theme);
				}
				mkpath.sync(newPath.substring(0, newPath.lastIndexOf('/')), 0700);
				fs.writeFileSync(newPath, css);
			});	
		}
	}

	function compile(path, callback) {
		fs.readFile(path, 'utf-8', function (err, data) {
			if (err) 
		        throw err;
		    var data = helper.encodeDsp(data, theme, genDir),
		  	    parser = new(less.Parser);
		    parser.parse(data, function(err, tree) {
				if (err)
					throw err;					
				var css = tree.toCSS();
				css = helper.decodeDsp(css);
				if (callback) {
					callback(css, path);
				}
			});
		});
	}

	function log(str) {
		console.log(str);
	}

})();