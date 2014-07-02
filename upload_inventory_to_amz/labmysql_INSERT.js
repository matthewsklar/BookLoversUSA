var mysql = require('mysql'); 

var connection = mysql.createConnection({
    host: 'tsunami2014.cwj0cl8a8xkt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'ioi3JFI3lsne42',
    database: "tsu2014"
});


function recordResultOfUploadToAmazon(feedtype, submissionID, callbackOK) {
    connection.query('INSERT INTO MWSFeedUpload SET ?', {"FeedType": feedtype, "SubmissionID": submissionID}, function(err, result){
	if (err) {
	    throw(err);
	}else{
	    console.log(result.insertId);
	    if (callbackOK) {
		callbackOK(result.insertId);
	    }
	}
    });
}

connection.connect(function(err){
    if (err) {
	throw(err);
    }else{
	recordResultOfUploadToAmazon("_POST_PRODUCT_DATA_", 3428932);
    }
});
