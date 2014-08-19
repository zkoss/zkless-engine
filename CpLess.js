
const srcDir = process.argv[2];
const destDir = process.argv[3];
const theme = process.argv[4] ? process.argv[4] : '';
const genDir = 'codegen/archive/';

(function() {
	var walk = require('walk'),
		mkpath = require('./mkpath'),
		fs = require('fs'),
		ncp = require('ncp').ncp;
		compiler = require('./LessEngine'),
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

	copyImports();

	walker.on('file', function(root, stat, next) {
		if (S(stat.name).endsWith('.less')) {
			files.push(root + '/' + stat.name);
		}
		next();
	});

	walker.on('end', function() {
		var fp, fn;

		for (var i = 0; i < files.length; i++) {

			fp = fn = files[i];
			fn = fn.substring(fn.lastIndexOf('/') + 1);

			if(S(fn).startsWith('_'))
				imports.push(fp);
			else {
				targets.push(fp);
			}
		}
		encodeImports();
	});

	function encodeImports() {
		if (imports.length > 0)
			var last = imports[imports.length - 1];

		for (var i = 0; i < imports.length; i++) {
			var cf = imports[i],
				data = fs.readFileSync(cf, 'utf-8');
			if (data) {
				data = helper.encodeDsp(data, '', genDir);
				if (S(cf).contains('web')) {
					var tempPath = genDir + cf.substring(cf.indexOf('web'));
				}
				mkpath.sync(tempPath.substring(0, tempPath.lastIndexOf('/')), 0700);
				fs.writeFileSync(tempPath, data);
			}
		}
		lessCompile();
	}

	function lessCompile() {
		var last = targets[targets.length -1];
		for (var i = 0; i < targets.length; i++) {
			var cp = targets[i];
			console.log('compiling: ' + cp);
			compiler.compile(cp, genDir, theme, function(css, path) {
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
})();