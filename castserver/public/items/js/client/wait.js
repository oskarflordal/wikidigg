var joinedPlayers;
var readyButton;

function butReady() {
    readyButton.disable();
    readyToServer(displayAnswers);
}

joCache.set("wait", function() {
    var slider;
    joinedPlayers = new joGroup([
    ]);

    readyButton = new joButton("I am ready!").selectEvent.subscribe(function() {
	butReady();
    });
    
    var card = new joCard([
	new joTitle("Joining " + getId()),
	joinedPlayers,
	readyButton,
    ]).setTitle("Form Widgets");
    
    return card;
});

