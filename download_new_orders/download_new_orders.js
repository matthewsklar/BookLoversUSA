var mws14 = require('mws-js-2014'),
	client = new mws14.Client('AKIAJGREBSMHBMKOVIJA', process.argv[1], 'A1G3C0ZGNICMNG', {});
var mwsOrderAPI = require('mws-js-2014/lib/orders.js');
var o2x = require("object-to-xml");
var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'tsunami2014.cwj0cl8a8xkt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'ioi3JFI3lsne42',
    database: "tsu2014"
});

var marketplaceId = "ATVPDKIKX0DER";

var date = new Date(+new Date - 12096e5);
var month;
if (date.getMonth() + 1 < 10) month = "0" + (date.getMonth() + 1);
else month = date.getMonth() + 1;
if (date.getDay() - 1 < 10) day = "0" + (date.getDay() - 1);
else day = date.getDay - 1;
var formattedDate = date.getFullYear() + "-" + month + "-" + day;
console.log(formattedDate);
var sf = new mwsOrderAPI.requests.ListOrders({"marketplaceId": marketplaceId});
sf.params.MarketplaceId.value = marketplaceId;
sf.params.CreatedAfter.value = formattedDate;
client.invoke(sf, function(RESULT) {
	console.log("--------");
	console.log(JSON.stringify(RESULT));
	console.log("--------");
	var uuid = RESULT.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order[0].AmazonOrderId[0];
	var birthdate = RESULT.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order[0].PurchaseDate[0];
	var shippingAddress = RESULT.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order[0].ShippingAddress[0];
	var order = RESULT.ListOrdersResponse.ListOrdersResult[0].Orders[0].Order[0];
	connection.query('SELECT * FROM orders WHERE UUID = ' + uuid, function(err, rows, fields) {
		if (rows.length == 0) {
			connection.query('INSERT INTO orders SET ?', {"UUID" : uuid, "birthdate" : birthdate, "ExpirationTime" : "N/A"});
			connection.query('INSERT INTO addresses SET ?', {"REForder" : uuid, "name" : shippingAddress.Name, "addr1" : shippingAddress.AddressLine1, "addr2" : shippingAddress.AddressLine2, "addr3" : shippingAddress.AddressLine3, "addr4" : shippingAddress.AddressLine4, "city" : shippingAddress.City, "stateprovince" : shippingAddress.StateOrRegion, "postalcode" : shippingAddress.PostalCode, "country" : shippingAddress.CountryCode, "email" : order.BuyerEmail, "phone" : shippingAddress.Phone});
			var fs = new mwsOrderAPI.requests.ListOrderItems();
			fs.params.AmazonOrderId.value = uuid;
			client.invoke(fs, function(RESULT) {
				console.log("--------");
				console.log(JSON.stringify(RESULT));
				console.log("--------");
				console.log(RESULT.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem[0]);
				console.log("--------");
				var orderitems = RESULT.ListOrderItemsResponse.ListOrderItemsResult[0].OrderItems[0].OrderItem[0];
				connection.query('INSERT INTO orderitems SET ?', {"UUID" : uuid, "REForder" : uuid, "REFsku" : orderitems.SellerSKU[0], "productid" : orderitems.ASIN[0], "qty" : orderitems.QuantityShipped[0], "status" : "N/A", "purchaseprice" : orderitems.ItemPrice[0].Amount[0], "shippingfee" : orderitems.ShippingPrice[0].Amount[0], "shippingfeeEXTRA" : orderitems.ShippingTax[0].Amount[0]});
			});
		} else {
			console.log("Skipped");
		}
	});
});