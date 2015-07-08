var ans1Func;
var players = [];
var websocket;
var serverid; // the way we are identified at the node 

jQuery.ajax("http://www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js", {complete: function() {
    return;

    if (typeof cast == 'undefined') {
	document.getElementById("magisk").innerHTML = "undefined";
    }
    
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    var customMessageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:xyz.qupplo.qupplo');

    customMessageBus.onMessage = function(event) {

	document.getElementById("waitforplayers").innerHTML ="<h1>rec" + event.senderId + ": " + event.data + "</h1>";
    }

    customMessageBus.onSenderConnected = function(event) {

	document.getElementById("waitforplayers").innerHTML ="<h1>someone joined</h1>";
    }
    
    window.castReceiverManager.start();

}})

var mappy;

// these essentially replace templates, obviously it could be cleaner to move a proper templating system and move these into separate files
function templateMapQuestion(data) {

    document.getElementById("q1").innerHTML = "<h1>" + data.q + "<div class=\"container\"><div class=\"map\">Alternative content</div></div></h1>";

    document.getElementById("ans1").innerHTML = "<div class=\"container\"><div class=\"map\">Alternative content</div></div></h1>";

    
    mappy = $(".container").mapael({
	map : {
            name : "world_countries"
	}
    });
    
    // function to reveal that will mark the correct location
    ans1Func = function() {};
}

function templateClassicQuestion(data) {
    var template = "<h1>" + data.q + "</h1>";
    var templateAns = "<h1>" + data.ans[0] + "</h1>";

    document.getElementById("q1").innerHTML = template;
    document.getElementById("ans1").innerHTML = templateAns;
}

function bcastQuestion(q) {
    var i;
    for (i = 0; i  < players.length; ++i) {
	websocket.send(JSON.stringify({type: "question", serverid, playerid : i, q}));
    }
    timeQSent = new Date();
}

function startQuestion(q) {
    switch (q[0].type) {
    case "classic": templateClassicQuestion(q[0]); break;
    case "map"    : templateMapQuestion(q[0]); break;
    }

    bcastQuestion(q[0]);
    
    flipPage();
    setTimeout(function() {flipPage();
			   // if there are no more questions, go for the score screen
			   if (q.length == 1) {
			       // TODO end
			   } else {
			   
			       startQuestion(q.slice(1,q.length));
			   }}, 8000);
}

/**************
 * STATE progression
 **************/
function showInstructions(questions) {
    flipPage();
    
    setTimeout(function() {startQuestion(questions)}, 1000);
} 

function startGame(questions) {
    // set up one question at a time
    // setup start screen
    console.log(questions);
    setTimeout( function() {showInstructions(questions)}, 1000);
}



// When we are assigned an if from the server, show this on the screen
// so that clients may connect
function setId(id) {
    var url = window.location.href.split('//')[1].split('/')[0]+'/items/client.html?' + id;
    serverid = id;
    
    document.getElementById("url").innerHTML = url;
    new QRCode(document.getElementById("qrcode"), url);
}


// When a client is connecting
function addClient(json) {
    document.getElementById("waitforplayers").innerHTML += "<h1>"+json.name+"</h1>";
    players[json.playerid] = {score : 0, name : json.name, ready : false};
    
    // the node server will have told the player its id as well
}

function askForQuestions() {
    var request = {};
    request.type = "req";
    request.options = {};
    request.options.types = ["classic","classic","classic","classic","classic"];

    websocket.send(JSON.stringify(request));
}

function clientReady(json) {
    players[json.playerid].ready = true;

    if (players.every(function (elem, i, a){return elem.ready})) {
	askForQuestions();
    }
}

var timeQSent;

function clientAnswer(json) {
    players[json.playerid].ans = {time : (new Date - timeQSent), ans : json.ans };
}

function fetchNewQuestions() {
    // Setup connection to server through websockets
    var url = window.location.href.split('//')[1].split('/')[0].split(':')[0];
    websocket = new WebSocket("ws://"+url + ":8080");

    // make a request for 5 questions of category 0

    function onMessage(evt) {
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.type) {
	case "questions" : startGame(json.q); break;
	case "setid"     : setId(json.id); break;

	// from a client
	case "connect"   : addClient(json); break;
	case "ready"     : clientReady(json); break;
	case "answer"    : clientAnswer(json); break;
	}
    }
    
    websocket.onopen = function(evt) { }; // no real point of wrapping
    websocket.onclose = function(evt) { console.log(evt)};
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { console.log("error")};
}

// send this to get questions
//websocket.send(JSON.stringify(request));

fetchNewQuestions()

// Protocol to node server:
//
/*
{ "type" : "req",
  "serverid" : "id", // id of the chromecast unit or similar (may not be available)
  "userids" : [], // to avoid repeat questions
  // possibly oath token of the person who started the server
  // potentially some more configuration
}

Response
{ "type" : "questions",
  "q" : [Q,Q,Q] };
*/
// where Q depends on different questions types




