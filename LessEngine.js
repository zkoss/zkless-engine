var less = require('less'),
	helper = require('./SyntaxHelper'),
	fs = require('fs');

module.exports = {

	compile: function(path, classpath, theme, callback) {
		// options.rootpath = root;
		fs.readFile(path, 'utf-8', function (err, data) {
			if (err) 
		        throw err;
		    var data = helper.encodeDsp(data, theme, classpath),
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
	},
}

