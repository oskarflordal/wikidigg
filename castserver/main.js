var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});




// Websocket server to deliver questions

// return indidivdual question nbased on category
function generateQuestion(type) {
    console.log("type");
    switch (type) {
    case "classic" : return {"type" : type, "q" : "Whats the capital of Sweden?", "ans" : ["Estockholmo", "Bollywood", "Tokyo", "Sumpan"]};
    case "map" : return {"type" : type, "q" : "Vart på kartan ligger Sverige?", "ans" : {"type" : "region", "location" : "sfv"}};
    }
}

function generateQuestions(options) {
    var response = {};
    response.type = "questions";

    // sanity checking
    if (options.types.length > 10) {
	response.type = "error";
	return response;
    }

    // generate a question for each input
    response.q = options.types.map(generateQuestion);
    console.log(response);
    return response;
}

var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
	try {
	    var json = JSON.parse(message);
	    // Do some sort of sanity checking
	    switch (json.type) {
	    case "req" : ws.send(JSON.stringify(generateQuestions(json.options))); break;
	    }
	} catch (ex) {
	    // close the connection
	    ws.close();
	}
    });
});

