(function() {

	const srcDir = './web';
	const destDir = './codegen';
	const theme = '';
	var start = Date.now();
	var walk = require('walk'),
		mkpath = require('./mkpath'),
		fs = require('fs'),	
		compiler = require('./LessEngine'),
		S = require('string'),
		files = [],
		current = '',
		walker = walk.walk(srcDir, {followLinks: false});

	walker.on('file', function(root, stat, next) {
		if (S(stat.name).endsWith('.less'))
			files.push(root + '/' + stat.name);
		next();
	});

	walker.on('end', function() {
		for (var i = 0; i < files.length; i++) {
			
			fp = fn = files[i];
			fn = fn.substring(fn.lastIndexOf('/') + 1);

			if(S(fn).startsWith('_'))
				continue;
			else {
				compiler.compile(fp, '', '', function(css, path) {
					
					//replace folder name
					path = path.replace('/less', '/css');

					// replace theme foder name
					if(theme) {
						path = path.replace('/web', '/web/' + theme);
					}

					//replace file sub-name for source file
					var dspSrcPath = path.replace('.less', '.css.dsp.src');
					mkpath.sync(dspSrcPath.substring(0, dspSrcPath.lastIndexOf('/')), 0700);
					fs.writeFile(dspSrcPath, css, function(err) {
						if (err)
							throw err;
						// console.log('saved');
						console.log('end: ' + (Date.now() - start));
					});
				});
			}
		}
		
	});

})();