
const srcDir = './web';
const destDir = './codegen';
const theme = '';

(function() {

	var walk = require('walk'),
		mkpath = require('./mkpath'),
		fs = require('fs'),	
		compiler = require('./LessEngine'),
		helper = require('./SyntaxHelper'),
		S = require('string'),
		files = [],
		imports = [],
		targets = [],
		current = '',
		walker = walk.walk(srcDir, {followLinks: false});

	walker.on('file', function(root, stat, next) {
		if (S(stat.name).endsWith('.less'))
			files.push(root + '/' + stat.name);
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
		encodeImports(function() {
			lessCompile();
		});
	});

	function encodeImports(callback) {
		for (var i = 0; i < imports.length; i++) {
			var cf = imports[i],
				data = fs.readFileSync(cf, 'utf-8');

			if (data) {
				data = helper.encodeDsp(data, '');
				fs.writeFileSync(cf, data);
			}
		}

		if (callback)
			callback();
	}

	function lessCompile() {
		var last = targets[targets.length -1];
		for (var i = 0; i < targets.length; i++) {
			console.log(targets[i]);
			var cp = targets[i];	
			compiler.compile(cp, '', '', function(css, path) {
				//replace folder name
				var newPath = path.replace('/less', '/css');
				// replace theme foder name
				if(theme) {
					newPath = newPath.replace('/web', '/web/' + theme);
				}
				//replace file sub-name for source file
				var dspSrcPath = newPath.replace('.less', '.css.dsp.src');
				mkpath.sync(dspSrcPath.substring(0, dspSrcPath.lastIndexOf('/')), 0700);
				fs.writeFileSync(dspSrcPath, css);
				if (path === last) {
					decodeImports();
				}
			});
		}
	}

	function decodeImports() {
		for (var i = 0; i < imports.length; i++) {
			var cf = imports[i],
				data = fs.readFileSync(cf, 'utf-8');

			if (data) {
				data = helper.decodeDsp(data);
				fs.writeFile(cf, data, function(err) {
					if (err)
						throw err;
					console.log('saved!');
				});
			}
		}
	}

})();