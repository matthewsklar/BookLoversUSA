var mws14 = require('mws-js-2014'),
	client = new mws14.Client('AKIAJGREBSMHBMKOVIJA', process.argv[2], 'A1G3C0ZGNICMNG', {});
var mwsFeedsAPI = require('mws-js-2014/lib/feeds.js');   
var mysql = require('mysql'); 

var connection = mysql.createConnection({
    host: 'tsunami2014.cwj0cl8a8xkt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'ioi3JFI3lsne42',
    database: "tsu2014"
});

function update(rows, rowLength, i) {
	var submissionId = rows[i].SubmissionID;
	var rowid = rows[i].rowid;
	var sf = new mwsFeedsAPI.requests.GetFeedSubmissionResult();
	sf.params.FeedSubmissionId.value = submissionId;
	client.invoke(sf, function(RESULT) {
		console.log(JSON.stringify(RESULT));
		console.log("--------------------");
		if (JSON.stringify(RESULT).charAt(2) == 'A') {
			var result = RESULT.AmazonEnvelope.Message[0].ProcessingReport[0].StatusCode[0];			
			if (result == "Complete") {
				connection.query('UPDATE MWSFeedUpload SET Status = "OK" WHERE rowid = ' + rowid, function(err, result) {
					if (err) throw err;
					if (i < rowLength - 1) update(rows, rowLength, i + 1);
				});
			} else {
				if (i < rowLength - 1) update(rows, rowLength, i + 1);
			}
		} else if (JSON.stringify(RESULT).charAt(2) == 'E') {
			connection.query('UPDATE MWSFeedUpload SET Status = "ERROR" WHERE rowid = ' + rowid, function(err, result) {
				if (err) throw err;
				if (i < rowLength - 1) update(rows, rowLength, i + 1);
			});
		}
    });
}

function visitRows() {
    connection.query('SELECT * FROM MWSFeedUpload WHERE Status = "PENDING"', function(err, rows, fields) {
		if (err) {
		    throw(err);
		} else {
			if (rows.length != 0) update(rows, rows.length, 0);
		}
    });
}

connection.connect(function(err) {
	if (err) throw err;
	else visitRows();
});