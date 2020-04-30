const router = require('express').Router();
const fs = require('fs');

router.get('/:filename*', function(req, res, next) {
	var options = {
		root: '../'
	};

	if (path == "D3js/prc/inputs") {//Change this to check if is dir, and read files recursively.
		fs.readdir(options.root+path, function(err, files1) {
			fs.readdir(options.root+path+"/tests", function(err, files2) {
				var files = [];
				files2.forEach(function(file) {
					files.push("tests/"+file);
				});
				files1.forEach(function(file) {
					if (file != "tests") {
						files.push(file);
					}
				});
				res.send(JSON.stringify(files));
			});
		});
	} else {
		res.sendFile(path, options, function (err) {
			if (err) {
				console.error(err);
				res.status(err.status).end();
			}
		});
	}
});


module.exports = router;
