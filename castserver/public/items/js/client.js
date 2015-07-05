document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> PPAPAPA</h1>";

document.getElementById("waitforplayers").innerHTML ="<h1>Joining game</h1>";

var websocket;
var id;

function start() {
    websocket.send(JSON.stringify({serverid : id, type : "connect"}))
}

function fetchNewQuestions() {
    // Setup connection to server through websockets
    var url = window.location.href.split('//')[1].split('/')[0].split(':')[0];
    websocket = new WebSocket("ws://"+url + ":8081");

    // Connect to the correct id
    id = window.location.search.replace("?", "");


    function onMessage(evt) {
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.type) {
	case "questions" : startGame(json.q); break;
	}

    }

    websocket.onopen = function(evt) { console.log("onopen"); start(); }; // no real point of wrapping
    websocket.onclose = function(evt) { console.log("websocket closed")};
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { console.log("error")};

}

fetchNewQuestions()




