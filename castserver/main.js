var express = require('express');
var app = express();

//require('simple-blog').start();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3333, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

// connect to the quesiton database
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var mongonConnection;

var url = 'mongodb://localhost:27017/meteor';

// Since questions will be few, lets grab all of them from the db
// ans store them locally
//TODO FIXME
var questionCollection = [{type : "classic", "text" : "Sveriges huvudstad??", "ans" : ["Stockholm", "Bollywood", "Tokyo", "Sumpan"]},
			  {type : "classic", "text" : "Vad rimmar på apa", "ans" : ["papa", "boll", "koll", "nyans", "aaaa", "bbbb"]}];

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
	if (err) {
	    console.log('Unable to connect to the mongoDB server. Error:', err);
	    setupWSServers();
	} else {
	    //HURRAY!! We are connected. :)
	    console.log('Connection established to', url);
	    
	    // do some work here with the database.
	    mongoConnection = db;

	    var collection = db.collection('questions');

	    collection.find({}).toArray(function (err, result) {
		    if (err) {
			console.log("Error");
			console.log(err);
		    } else if (result.length) {
			questionCollection = result;
		    } else {
			console.log('No questions found');
		    }
		});

	    setupWSServers();
	}
    });


// Websocket server to deliver questions

// return indidivdual question nbased on category
function generateQuestion(type) {
    switch (type) {
    case "classic" : return questionCollection[Math.floor(Math.random() * questionCollection.length)];
    case "range" : return {"type" : type, "text" : "Vilken siffra (10)?", "ans" : {ans: 10, rangeLo : 2, rangeHi : 20, stepSz : 2}};
    case "sort" : return {"type" : type, "text" : "Sortera dessa svenska städer efter storlek?", "ans" : ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Eskilstuna", "Flen"]};
    case "map" : return {"type" : type, "text" : "Vart på kartan ligger Sverige?", "ans" : {"map" : "world_countries", "location" : {longitude : 5.0, latitude : 3.3}, maxdistance : 1000}};
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

//TODO
function saveAnswer(json) {

}

function setupWSServers() {
    // This server is used for connection from the Chromecast
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({port: 8080});

    wss.on('connection', function(ws) {
	    // give this server a special ID and save it for later
	    var id = makeid();
	    
	    liveServers[id] = {socket : ws, created : new Date(), clients : []};
	    console.log(liveServers);
	    
	    // make sure the ccserver is aware of its id
	    ws.send(JSON.stringify({type : "setid", id : id}));
	    
	    ws.on('message', function(message) {
		    try {
	    var json = JSON.parse(message);
	    // TODO: Do some sort of sanity checking
	    console.log(json);
	    switch (json.type) {
	    case "req" : ws.send(JSON.stringify(generateQuestions(json.options))); break;
		// pass any unknowns to the appropriate client
	    default: console.log(liveServers[json.serverid].clients[json.playerid]); liveServers[json.serverid].clients[json.playerid].ws.send(message); break;
	    }
		    } catch (ex) {
			// close the connection
			console.log("exception close");
			ws.close();
		    }
		});
	});
    
    // This socket server is used for connection from a js-client
    var wssClient = new WebSocketServer({port: 8081});
    wssClient.on('connection', function(ws) {
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
			
	    // if this is the answer to a question, Save the answer for later
			if (json.type == "answer") {
			    saveAnswer();
			}
			
			liveServers[json.serverid].socket.send(JSON.stringify(json));
		    } catch (ex) {
			// close the connection
			ws.close();
		    }
		});
	});
}

// Keep track of connections to the js-client
