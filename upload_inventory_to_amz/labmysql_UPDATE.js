var mysql = require('mysql'); 

var connection = mysql.createConnection({
    host: 'tsunami2014.cwj0cl8a8xkt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'ioi3JFI3lsne42',
    database: "tsu2014"
});


function visitRows(statusToFind) {
    connection.query('SELECT * FROM MWSFeedUpload WHERE Status = ' + connection.escape(statusToFind),
		     function(err, rows, fields){
			 if (err) {
			     throw(err);
			 }else{
			     for (var i=0; i<rows.length; i++) {
				 // Processing one row: grab its submission ID
				 var submissionID = rows[i].SubmissionID;
				 var rowid = rows[i].rowid;
				 // Invoke MWS FeedSubmissionResults()
				 // client.invoke with callback that does this if the result is now OK:
				 connection.query('UPDATE MWSFeedUpload SET Status = "PENDING" WHERE rowid = ' + rowid,
						  function(err, result) {
						      console.log("err is" + err);
						  })
			     }
			 }
		     }
		    );
}


connection.connect(function(err){
    if (err) {
	throw(err);
    }else{
	visitRows("OK");
    }
});

