var express = require('express');
var app = express();

//require('simple-blog').start();

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


var liveServers = {};

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    do {
	for( var i=0; i < 5; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
    } while (liveServers[text] != undefined);

    //    return text;
    return "12345";
}


// This server is used for connection from the Chromcast
var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    // give this server a special ID and save it for later
    
    var id = makeid();

    liveServers[id] = {socket : ws, created : new Date(), clients : []};
    console.log(liveServers);
    
    // make sure the client is aware of its id
    ws.send(JSON.stringify({type : "setid", id : id}));

    ws.on('message', function(message) {
	try {
	    var json = JSON.parse(message);
	    // TODO: Do some sort of sanity checking
	    switch (json.type) {
	    case "req" : ws.send(JSON.stringify(generateQuestions(json.options))); break;
	    }
	} catch (ex) {
	    // close the connection
	    ws.close();
	}
    });
});

// This socket server is used for connection from a js-client
var WebSocketServer = require('ws').Server
, wss = new WebSocketServer({port: 8081});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
	try {
	    var json = JSON.parse(message);

	    // if the message has no valid playerid
	    if (json.playerid == null) {
		// to be able to pass messages the other way we need to keep track
		// of this socket, we also assign it an id so the ccserver can
		// identify it
		var playerid = liveServers[json.serverid].clients.length;
		liveServers[json.serverid].clients.push({ws: ws});
		
		// splice it onto the message
		json.playerid = playerid;
		
		// the same if will be used by the client so let it know as well
		ws.send(JSON.stringify({type : "assignid", playerid : playerid}));
	    }
	    
	    // pass it on to the relevant chromecast device
	    // TODO: do some sanity checking here
	    // TODO: this is a good place to grab statistics
	    liveServers[json.serverid].socket.send(JSON.stringify(json));
	} catch (ex) {
	    // close the connection
	    ws.close();
	}
    });
});


// Keep track of connections to the js-client
