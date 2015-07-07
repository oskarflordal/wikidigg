document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> PPAPAPA</h1>";

document.getElementById("waitforplayers").innerHTML ="<h1>Joining game</h1>";

var websocket;
var serverid;
var name;

function start(name) {
    websocket.send(JSON.stringify({type : "connect", serverid, name, playerid : null}))
}

function assignId(json) {
    document.getElementById("waitforplayers").innerHTML ="<h1><input type=SUBMIT value="Submit" name="mySubmit"></h1>";
}

function fetchNewQuestions() {
    // Setup connection to server through websockets
    var url = window.location.href.split('//')[1].split('/')[0].split(':')[0];
    websocket = new WebSocket("ws://"+url + ":8081");

    // Connect to the correct id
    serverid = window.location.search.replace("?", "");

    function onMessage(evt) {
	var json = JSON.parse(evt.data);
	console.log(json);
	switch (json.type) {
	case "assignid" : assignId(json); break;
	}
    }

    var name = "Pelle"; // TODO: get from UI
    
    websocket.onopen = function(evt) { console.log("onopen"); start(name); }; // no real point of wrapping
    websocket.onclose = function(evt) { console.log("websocket closed")};
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { console.log("error")};

}

fetchNewQuestions()




