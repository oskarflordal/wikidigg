var connectButton;
var connectName;

function getId() {
    return window.location.search.replace("?", "");
}

function switchToWaitForStart() {
    App.stack.push(joCache.get("wait"))
}

function butConnection() {
    // disable
    connectButton.disable();

    // launch the connect function
    // pass a callback to switch to the next
    connectToServer(getId(), connectName.data, switchToWaitForStart);
}

joCache.set("connect", function() {
    var slider;
    connectButton = new joButton("Connect").selectEvent.subscribe(butConnection);
    connectName = new joInput("", "This is my name!");

    var card = new joCard([
	new joTitle("Joining " + getId()),
	new joGroup([
	    new joLabel("Nickname"),
	    new joFlexrow(connectName),
	    connectButton
	])
    ]).setTitle("Form Widgets");

    return card;
});

