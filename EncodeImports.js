(function() {

	const srcDir = './web';
	const distDir = './codegen';

	fs = require('fs');
	var walk = require('walk'),
		less = require('less'),
		helper = require('./SyntaxHelper'),
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

				if(S(fn).startsWith('_')) {
					var data = fs.readFileSync(fp, 'utf-8');
					if (data) {
						data = helper.encodeDsp(data, '');
						fs.writeFile(fp, data, function(err) {
							if (err)
								throw err;
						});
					}
				}
			}
		});
})();