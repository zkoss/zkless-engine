(function() {
	var walk = require('walk'),
		mkpath = require('./mkpath'),
		fs = require('fs'),
		S = require('string'),
		helper = require('./SyntaxHelper'),
		walker = walk.walk('imports/web', {followLinks: false}),
		path = require('path'),
		fs = require('fs'),	
		mkpath = require('./mkpath'),
		appDir = path.dirname(require.main.filename);
	
	walker.on('file', function(root, stat, next) {
		if (S(stat.name).endsWith('.less') && S(stat.name).contains('_')) {
			var cf = root + '/' + stat.name;
			var data = fs.readFileSync(cf, 'utf-8');
			var dest = cf.replace('imports', 'encoded');
			console.log(dest);
			var importpath = appDir + '/encoded';
			data = helper.encodeDsp(data, '', importpath);
			mkpath.sync(dest.substring(0, dest.lastIndexOf('/')), 0700);
			fs.writeFileSync(dest, data);
		}
		next();
	});

})();