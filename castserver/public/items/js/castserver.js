document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> PPAPAPA</h1>";

jQuery.ajax("http://www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js", {complete: function() {
    if (typeof cast == 'undefined') {
	document.getElementById("magisk").innerHTML = "undefined";
    }
    
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> Blip</h1>";

    var customMessageBus = window.castReceiverManager.getCastMessageBus('urn:x-cast:xyz.qupplo.qupplo');

    document.getElementById("q1").innerHTML = "<h1><span>A collection of</span><strong>Page</strong> BLOP bip bopp apa apapapap pdpfdsfas fpasdpfas fsdpfpsad</h1>";
    customMessageBus.onMessage = function(event) {

    document.getElementById("magisk").innerHTML ="rec" + event.senderId + ": " + event.data;

    }

    window.castReceiverManager.start();

}})
