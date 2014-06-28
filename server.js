// SET UP =================================================================
var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var aws = require("aws-sdk");

// CONFIGURATION ==========================================================
aws.config.loadFromPath('./config.json');

app.set("view engine", "jade");
app.use(require('stylus').middleware({ src: __dirname + '/public' }));

// RUN ====================================================================
var s3 = new aws.S3();
s3.createBucket({Bucket: 'myBucket'}, function() {
	var params = {Bucket: "myBucket", Key: "myKey", Body: "Hello!"};

	s3.putObject(params, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			console.log("Successfully uploaded data to myBucket/myKey");
		}
	});
});

// LAUNCH =================================================================
app.listen(port);
console.log("Listening to port " + port);