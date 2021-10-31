const router = require('express').Router();
const fs = require('fs');

	router.get('/:filename*', function(req, res, next) {
		console.log("cdn");
		var options = {
			root: '../'
		};

	var path = req.params.filename;
	console.log(path);
	if (req.params.hasOwnProperty("0")) {
		path += req.params[0];
	}
	console.log(path);
	res.sendFile(path, options, function(err) {
		if (err) {
			console.error(err);
			res.status(err.status).end();
		}
		else {
			console.log('Sent:', path);
		}
	});
});

module.exports = router;
