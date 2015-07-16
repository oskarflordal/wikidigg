var ans1Func;
var players = [];
var websocket;
var serverid; // the way we are identified at the node 

var gameState;

// FIXME: hack to identify the various pages when flipping
var waitpage = 0;
var readypage = 1;
var questionpage = 2;
var answerpage = 3;
var scorepage = 4;

var gameConfig = { questiontime : 10000,
		   answertime : 10000,
		   roundscoretime : 3000,
		   scoretime : 3000,
		   rounds : 5,
		 };

var gameColors = ["#ff0000",
		  "#00ff00",
		  "#0000ff",
		  "#ffff00",
		  "#00ffff",
		 "#ffffff", ];

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

    document.getElementById("q1").innerHTML = "<h1>" + data.q + "</h1>";

    document.getElementById("ans1").innerHTML = "<div class=\"container\"><div class=\"map\">Alternative content</div></div></h1>";

    mappy = $(".container").mapael({
	map : {
	    name : "world_countries",
	    zoom: {
		enabled: false
	    },
	    defaultArea : {
		attrs : {
		    fill : "#7bb7fa" // TODO: sample from css?
		    , stroke: "#111111"
		}
		, text : {
		    attrs : {
			fill : "#505444"
		    }
		    , attrsHover : {
			fill : "#000"
		    }
		},
		
	    },
	    
	},
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

function templateSortQuestion(data) {
    var template = "<h1>" + data.q + "</h1>";
    var templateAns = "";
    for (var i = 0; i  < data.ans.length; ++i) {
	templateAns += "<h1>" + data.ans[i] + "</h1>";
    }

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

function sorted(list) {
    var num = 0;
    var i,j;
    for (i = 0, j = list.length; i < j; ++i) {
	if (list[i] == i) {
	    num++;
	}
    }
    return num;
}

function degToRad(deg) {
    return deg * (Math.PI/180);
}

// Calculate distance in kilometers between two points, used for scoring
function calcDistanceOnMap(from, to) {
    var earthRad = 6371;
    var degLat = degToRad(to.latitude-from.latitude);
    var degLon = degToRad(to.longitude-from.longitude);
    var a = Math.sin(degLat/2)*Math.sin(degLat/2)+
	Math.cos(degToRad(from.latitude))*Math.cos(degToRad(to.latitude))*
	Math.sin(degLon/2)*Math.sin(degLon/2);
    var c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = earthRad*c; 
    return d == NaN ? 999999 : d;
}

// min max and round to score range
function trimScore(val) {
    return Math.max(0, Math.min(100, Math.round(val)));
}

function score(q, player) {
    // No answer given
    // TODO, more stringent testing may be required
    if (player.ans.ans == -1) return 0;
    
    // depending on type we will score differently
    switch (q.type) {
    case "classic":
	return (player.ans.ans == 0) ? (trimScore(130 * ((gameConfig.questiontime - player.ans.time) / gameConfig.questiontime))) : 0;
	break;
    case "sort":
	var numSorted = sorted(player.ans.ans);
	return (trimScore((numSorted/player.ans.ans.length)*100));
	break;
    case "map"    :
	return trimScore(130*(q.ans.maxdistance-calcDistanceOnMap(player.ans.ans, q.ans.location))/(q.ans.maxdistance)); break;
    }
}

function startScoreScreen(q) {
    // perhaps it would make sense to do this earlier
    // TODO: there should probably be a nice animation of adding the score here
    document.getElementById("score1").innerHTML = "<h1>Round "+(gameConfig.rounds-q.length+1)+" score</h1>";
    for (i = 0; i < players.length; ++i) {
	document.getElementById("score1").innerHTML += "<h2>"+players[i].name+ " " + +players[i].score+" (+"+players[i].nextscore+")</h2>";
    }

    
    flipPage(scorepage);

    for (i = 0; i  < players.length; ++i) {
	players[i].score += players[i].nextscore;
    }
    
    setTimeout(function() {    // if there are no more questions, go for the score screen
	if (q.length == 1) {
	    // TODO end
	    
	} else {
	    startQuestion(q.slice(1,q.length));
	}		   
    }, gameConfig.roundscoretime);
}
    


function startAnswer(q) {
    // TODO refactor
    if(q[0].type == "map") {
	var i, j;
	var newPlots = {};
	var deletedPlots = {};

	newPlots["correct"] = {
	    latitude : q[0].ans.location.latitude,
	    longitude : q[0].ans.location.longitude,
	    attrs : {
		fill : "#333333",
		size : 40,
	    }
	}

	for (i = 0, j = players.length; i < j; ++i) {
	    newPlots[players[i].name] = {
		latitude : players[i].ans.ans.latitude,
		longitude : players[i].ans.ans.longitude,
		attrs : {
		    fill : gameColors[i]
		}
	    }
	}
	
	$(".container").trigger('update', [null, newPlots, deletedPlots, {animDuration : 3000}]);
    }

    // Make sure we score the players before they had a chance to see the answers
    for (i = 0; i  < players.length; ++i) {
	players[i].nextscore = score(q[0], players[i]);
	players[i].ans = {time : -1, ans : -1};
    }

    flipPage(answerpage);



    // Show the correct answer for a while and then go to score screen
    setTimeout(function() {startScoreScreen(q)}, gameConfig.answertime);

}

function startQuestion(q) {

    // this sets up all the pages, from now on, we only need to swap them around
    switch (q[0].type) {
    case "sort"   : templateSortQuestion(q[0]); break;
    case "classic": templateClassicQuestion(q[0]); break;
    case "map"    : templateMapQuestion(q[0]); break;
    }

    bcastQuestion(q[0]);
    
    flipPage(questionpage);
    setTimeout(function() {startAnswer(q)}, gameConfig.questiontime);
}

/**************
 * STATE progression
 **************/
function showInstructions(questions) {
//    flipPage(0);
    
    setTimeout(function() {startQuestion(questions)}, 1000);
} 

function startGame(questions) {
    // set up one question at a time
    // setup start screen
    setTimeout( function() {showInstructions(questions)}, 1000);
}



// When we are assigned an if from the server, show this on the screen
// so that clients may connect
function setId(id) {
    var url = window.location.href.split('//')[1].split('/')[0]+'/items/client.html?' + id + "<br><br>";
    serverid = id;
    
    document.getElementById("url").innerHTML = url;
    new QRCode(document.getElementById("qrcode"), url);
}


// When a client is connecting
function addClient(json) {
    // TODO make sure we are waiting for players
    if (gameState == "RUNNING") return;
    
    document.getElementById("waitforplayers").innerHTML += "<h2>"+json.name+"</h2>";
    players[json.playerid] = {score : 0, nextscore : 0, name : json.name, ready : false, ans : {time : -1, ans : -1}};
    
    // the node server will have told the player its id as well
}

// Send the request for questions, when we get a reply we will move on
function askForQuestions() {
    var request = {};
    request.type = "req";
    request.options = {};
    request.options.types = ["sort", "map","classic","classic","classic","classic"];

    websocket.send(JSON.stringify(request));
}

function clientReady(json) {
    players[json.playerid].ready = true;

    if (players.every(function (elem, i, a){return elem.ready})) {
	gameState = "RUNNING";
	askForQuestions();
    }
}

var timeQSent;

function clientAnswer(json) {
    players[json.playerid].ans = {time : (new Date - timeQSent), ans : json.ans };
}

function connectToNode() {
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

connectToNode();

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




