document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> PPAPAPA</h1>";

var ans1Func;

jQuery.ajax("http://www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js", {complete: function() {
    return;

    if (typeof cast == 'undefined') {
	document.getElementById("magisk").innerHTML = "undefined";
    }
    
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> Blip</h1>";


//    document.getElementById("waitforplayers").innerHTML ="<h1>step 1</h1>";

    var customMessageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:xyz.qupplo.qupplo');

//    document.getElementById("waitforplayers").innerHTML ="<h1>step 2</h1>";

    document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> BLOP bip bopp apa apapapap pdpfdsfas fpasdpfas fsdpfpsad</h1>";
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

    
    
    // funciton to reveal that will mark the correct location
    ans1Func = function() {};
}

function templateClassicQuestion(data) {
    var template = "<h1>" + data.q + "</h1>";
    var templateAns = "<h1>" + data.ans[0] + "</h1>";

    document.getElementById("q1").innerHTML = template;
    document.getElementById("ans1").innerHTML = templateAns;
}

function startQuestion(q) {
    switch (q[0].type) {
    case "classic": templateClassicQuestion(q[0]); break;
    case "map"    : templateMapQuestion(q[0]); break;
    }

    flipPage();
    setTimeout(function() {flipPage();}, 8000);
}

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

function setId(id) {
    var url = "http://qupplo.xyz/items/client.html?" + id;

    document.getElementById("url").innerHTML = url;
    new QRCode(document.getElementById("qrcode"), url);
}

function addClient() {
    document.getElementById("waitforplayers").innerHTML ="<h1>someone joined</h1>";
}

function fetchNewQuestions() {
    // Setup connection to server through websockets
    var url = window.location.href.split('//')[1].split('/')[0].split(':')[0];
    var websocket = new WebSocket("ws://"+url + ":8080");

    // make a request for 5 questions of category 0
    var request = {};
    request.type = "req";
    request.options = {};
    request.options.types = ["classic","classic","classic","classic","classic"];

    function onMessage(evt) {
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.type) {
	case "questions" : startGame(json.q); break;
	case "setid"     : setId(json.id); break;

	// from a client
	case "connect"   : addClient(json);
	     websocket.send(JSON.stringify(request)); break;
	case "answer"    : clientAnswer(json); break;
	}

    }

    websocket.onopen = function(evt) { console.log(request); }; // no real point of wrapping
    websocket.onclose = function(evt) { console.log("websocket closed")};
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { console.log("error")};

}

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




