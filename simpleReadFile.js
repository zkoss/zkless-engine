
var inputStr,
	outputStr,


fs = require('fs')

fs.readFile('less/simple.less', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }

  inputStr = data;
  compileLess();
});

console.log(inputStr);

function compileLess() {
	console.log(inputStr);
	console.log('******************');
	
	var less = require('less');
	less.render(inputStr, function (e, css) {
  		console.log(css);
	  	outputStr = css;

	  	fs.writeFile('simple.css', inputStr, function (err) {
			if (err) return console.log(err);
			  console.log('successed');
			});

	});
}

fs.writeFile('simple.css', outputStr, function (err) {
  if (err) return console.log(err);
  console.log('successed');
});
