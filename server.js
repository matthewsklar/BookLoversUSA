// SET UP =================================================================
var express = require("express");
var app = express();
var o2x = require("object-to-xml");
var fs = require("fs");
var http = require("http");
var queryString = require("querystring");
var mws14 = require('mws-js-2014'),
	client = new mws14.Client('AKIAJGREBSMHBMKOVIJA', process.argv[2], 'A1G3C0ZGNICMNG', {});
//var mws = require('mws-js-2014/lib/mws.js'), client = mws.AmazonMwsClient('AKIAJGREBSMHBMKOVIJA', 'iXa9XSVUhxYoN9u/wsCjUEtLGXJawKhD7NC/Qb0z', 'A1G3C0ZGNICMNG', {});
var mwsFeedsAPI = require('mws-js-2014/lib/feeds.js');   
var mysql = require('mysql'); 

var inputFile = process.argv[3];

// CONFIGURATION ==========================================================
app.set("view engine", "jade");
app.use(require('stylus').middleware({ src: __dirname + '/public' }));

var connection = mysql.createConnection({
	host     : 'tsunami2014.cwj0cl8a8xkt.us-west-2.rds.amazonaws.com',
	user     : 'admin',
	password : 'ioi3JFI3lsne42'
});

var header = '<?xml version="1.0" encoding="utf-8" ?>\n<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">\n';
var closer = '</AmazonEnvelope>';

// RUN ====================================================================
function createProductFeedXml(data) {
	var parsed = JSON.parse(JSON.stringify(data.toString('utf-8')));
	var newLine = parsed.split("\n");
	var objHeader = o2x({
		Header : {
			'#' : {
				DocumentVersion : 1.01,
				MerchantIdentifier : "A1G3C0ZGNICMNG"
			}
		},
		MessageType : "Product",
		PurgeAndReplace : "false"
	});

	var objProductArray = [];
	var objBodyProduct;
	
	for (var i = 1; i < newLine.length - 1; i++) {
		objProductArray[i - 1] = {
			Message : {
				'#' : {
					MessageID : i,
					OperationType : "Update",
					Product : {
						'#' : {
							SKU : newLine[i].split("\t")[0],
							StandardProductID : {
								'#' : {
									Type : "UPC",
									Value : newLine[i].split("\t")[7]
								}
							},
							DescriptionData : {
								'#' : {
									Title : newLine[i].split("\t")[1]
								}
							}
						}
					}
				}
			}
		};
		objBodyProduct += o2x(objProductArray[i - 1]);
	}

	return (header + objHeader + objBodyProduct + closer).replace("undefined", '');
}

function createPriceFeedXml(data) {
	var parsed = JSON.parse(JSON.stringify(data.toString('utf-8')));
	var newLine = parsed.split("\n");	
	var objPriceArray = [];
	var objBodyPrice;

	var priceHeader = o2x({
		Header : {
			'#' : {
				DocumentVersion : 1.01,
				MerchantIdentifier : "A1G3C0ZGNICMNG"
			}
		},
		MessageType : "Price",
		PurgeAndReplace : "false"		
	});

	for (var i = 1; i < newLine.length - 1; i++) {
		objPriceArray[i - 1] = {
			Message : {
				'#' : {
					MessageID : i,
					OperationType : "Update",
					Price : {
						'#' : {
							SKU : newLine[i].split("\t")[0],
							'StandardPrice currency=\"USD\"' : newLine[i].split("\t")[8]
						}
					}
				}
			}
		};
		objBodyPrice += o2x(objPriceArray[i - 1]);
	}
	return (header + priceHeader + objBodyPrice + closer).replace("undefined", '');
}

function createInventoryFeedXml(data) {
	var parsed = JSON.parse(JSON.stringify(data.toString('utf-8')));
	var newLine = parsed.split("\n");	
	var objQuantityArray = [];
	var objBodyQuantity;

	var quantityHeader = o2x({
		Header : {
			'#' : {
				DocumentVersion : 1.01,
				MerchantIdentifier : "A1G3C0ZGNICMNG"
			}
		},
		MessageType : "Inventory",
		PurgeAndReplace : "false"		
	});

	for (var i = 1; i < newLine.length - 1; i++) {
		objQuantityArray[i - 1] = {
			Message : {
				'#' : {
					MessageID : i,
					OperationType : "Update",
					Inventory : {
						'#' : {
							SKU : newLine[i].split("\t")[0],
							Quantity : newLine[i].split("\t")[15]
						}
					}
				}
			}
		};
		objBodyQuantity += o2x(objQuantityArray[i - 1]);
	}
	return (header + quantityHeader + objBodyQuantity + closer).replace("undefined", '');
}

var xmlGeneratorFactory = {
	_POST_PRODUCT_DATA_ : createProductFeedXml,
	_POST_PRODUCT_PRICING_DATA_ : createPriceFeedXml,
	_POST_INVENTORY_AVAILABILITY_DATA_ : createInventoryFeedXml
};

function submitFeed(feedType, filepath) {
	fs.readFile(filepath, function (err, data) {
		if (err) throw err;
		var xml = xmlGeneratorFactory[feedType](data);
		var sf = new mwsFeedsAPI.requests.SubmitFeed();
		sf.params.FeedContents.value = xml;
		sf.params.FeedType.value = feedType;
		client.invoke(sf, function(RESULT) {
			console.log(JSON.stringify(RESULT));
			console.log("--------");
			var submitId = RESULT.SubmitFeedResponse.SubmitFeedResult[0].FeedSubmissionInfo[0].FeedSubmissionId[0];
			fs.writeFile("XMLFeedFiles/" + submitId + feedType + ".txt", xml, function(err) {
				if (err) return console.log(err);
				var sf = new mwsFeedsAPI.requests.GetFeedSubmissionResult();
				sf.params.FeedSubmissionId.value = submitId;
				client.invoke(sf, function(RESULT2){

				});			
			});
		});
	});
}

function start() {
	var inventoryUpdateType = "";
	
	if (inputFile.indexOf("modp") > -1) inventoryUpdateType = "modp";
	else if (inputFile.indexOf("mod") > -1) inventoryUpdateType = "mod";
	else if (inputFile.indexOf("add") > -1) inventoryUpdateType = "add";

	switch(inventoryUpdateType) {
		case 'add' : 
			submitFeed("_POST_PRODUCT_DATA_", inputFile);
			submitFeed("_POST_PRODUCT_PRICING_DATA_", inputFile);
			submitFeed("_POST_INVENTORY_AVAILABILITY_DATA_", inputFile);
			break;
		case 'mod' :
			submitFeed("_POST_INVENTORY_AVAILABILITY_DATA_", inputFile);
			break;
		case 'modp' :
			submitFeed("_POST_PRODUCT_PRICING_DATA_", inputFile);
			submitFeed("_POST_INVENTORY_AVAILABILITY_DATA_", inputFile);
			break;
	}
}

start();