var less = require('less'),
	helper = require('./SyntaxHelper'),
	fs = require('fs');

var options = {
    depends: false,
    compress: false,
    cleancss: false,
    max_line_len: -1,
    optimization: 1,
    silent: false,
    verbose: false,
    lint: false,
    paths: [],
    color: true,
    strictImports: false,
    insecure: false,
    rootpath: '',
    relativeUrls: false,
    ieCompat: true,
    strictMath: false,
    strictUnits: false,
    globalVariables: '',
    modifyVariables: '',
    urlArgs: ''
};

module.exports = {

	compile: function(path, theme, root, callback) {

		options.rootpath = root;
		fs.readFile(path, 'utf-8', function (err, data) {
			if (err) 
		        throw err;
		  
		    var data = helper.encodeDsp(data, theme),
		  	    parser = new(less.Parser)(options);

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

