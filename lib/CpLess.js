
const srcDir = process.argv[2];
const destDir = process.argv[3];
const theme = process.argv[4] ? process.argv[4] : '';
const genDir = 'codegen/archive/';

(function() {
	var walk = require('walk'),
		mkpath = require('./mkpath'),
		fs = require('fs'),
		less = require('less'),
		ncp = require('ncp').ncp,
		helper = require('./SyntaxHelper'),
		S = require('string'),
		files = [],
		imports = [],
		targets = [],
		current = '',
		path = require('path'),
		appDir = path.dirname(require.main.filename),
		walker = walk.walk(srcDir, {followLinks: false}),
		importloc = appDir + '/encoded/web';


	//copy the imports from package to the root directory
	copyImports();

	//walk through the root directory and find every .less files and grounds them into imports and targets
	walker.on('file', function(root, stat, next) {
		var fn = stat.name
		if (S(fn).endsWith('.less')) {
			// files.push(root + '/' + stat.name);
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

	function copyImports() {
		ncp.limit = 16;

		mkpath.sync(genDir, 0700);
		ncp(importloc, genDir + 'web', function(err) {
			if (err) {
				throw err
			}
		});
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

})();