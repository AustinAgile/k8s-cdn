const router = require('express').Router();
//var fs = require('fs');
//var K8s = require('k8s');

//var docker = require('docker-remote-api')
//var request = docker({
//	host: '/var/run/docker.sock'
//});

router.get('/', function(req, res, next) {
	getImageTagFromKubernetes(function(err, tag) {
		res.send(tag);
	});
});

function getImageTagFromKubernetes(cb) {
	var fs = require('fs');
	var K8s = require('k8s');
	fs.readFile("/var/run/secrets/kubernetes.io/serviceaccount/token", function(err, token) {
		var kubeapi = K8s.api({
			endpoint: 'https://'+process.env.KUBERNETES_SERVICE_HOST+':'+process.env.KUBERNETES_SERVICE_PORT_HTTPS,
			version: '/api/v1',
			auth: {
				token: token.toString()
			},
			strictSSL: false
		});
		kubeapi.get('namespaces/'+process.env.MY_POD_NAMESPACE+'/pods/'+process.env.MY_POD_NAME)
			.then(function(data) {
				cb(null, /:([^:]+$)/.exec(data.spec.containers.filter(function(container) {
					return container.name = "d3js";
				})[0].image)[1]);
			})
			.catch(function(err) {
				cb(err, null);
			})
		;
	});
}

function getImageTagFromDocker(cb) {
	var docker = require('docker-remote-api')
	var request = docker({
		host: '/var/run/docker.sock'
	});
	request.get('/v1.24/containers/json', {json: true}, function (err, containers) {
		if (err) {return res.send(err);}
		if (containers.length < 1) {return res.send(null);}
		var re = new RegExp("\/k8s_(?!POD).+?_"+process.env.HOSTNAME+"_");
		var me = containers
				.filter(function (container) {
					return container.Names[0].match(re) != null;
				})
				.map(function (container) {
					return container;
				})
			;
		if (me.length != 1) {return res.send(null);}
		var myImageId = me[0].ImageID;
		request.get('/v1.24/images/' + me[0].ImageID + '/json', {json: true}, function (err, image) {
			if (err) {return cb(err, null);}
			if (image == null) {return cb(null, null);}
			if (!image.hasOwnProperty("RepoTags")) {return cb(null, null);}
			if (image.RepoTags.length != 1) {return cb(null, null);}
			var repoTag = image.RepoTags[0];
			var result = /:([^:]+$)/.exec(repoTag);
			if (result.length < 2) {return cb(null, null);}
			cb(null, result[1]);
		});
	});
}

module.exports = router;
