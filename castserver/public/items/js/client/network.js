var websocket;
var serverid;
var playerid;
var name;
var questionCallback;

function start(name) {
    websocket.send(JSON.stringify({type : "connect", serverid : serverid, name : name, playerid : null}))
}

function assignId(json) {
    playerid = json.playerid;
}

function readyToServer(func) {
    websocket.send(JSON.stringify({type : "ready", serverid : serverid, playerid : playerid}));
    questionCallback = func;
}

function answerToServer(ans) {
    websocket.send(JSON.stringify({type : "answer", serverid : serverid, playerid : playerid, ans : ans}));
}

function connectToServer(id, name, doneFunc) {
    // Setup connection to server through websockets
    var url = window.location.href.split('//')[1].split('/')[0].split(':')[0];
    websocket = new WebSocket("ws://"+url + ":8081");

    serverid = id;
    
    function onMessage(evt) {
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.type) {
	case "assignid" : assignId(json); break;
	case "question"   : questionCallback(json); break;
	}
    }

    websocket.onopen = function(evt) { console.log("onopen"); start(name); doneFunc()}; // no real point of wrapping
    websocket.onclose = function(evt) { console.log("websocket closed")};
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { console.log("error")};

}

//fetchNewQuestions()




