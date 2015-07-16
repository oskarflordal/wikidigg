var submitButton;
// These are really ugly hacks due to me not understanding js
var paperInst;

var mappy;

var answerClassicConfig = {
    draggable:false,
    formatItem:function (item, index) {
	var o = new joFlexrow([
	    new joClassyCaption(item.title, "list-item-title"),
	]);
	
	return o;
    },
    onSelect:function(index, event) {
	currentAnswer = event.data[index].ansid;
    }
};

var answerMapConfig = {
    draggable:false,
    formatItem:function (item, index) {
	var o = new joFlexrow([
	    new joClassyCaption(item.title, "list-item-title"),
	]);
	
	return o;
    },
    onSelect:function(index, event) {
	currentAnswer = event.data[index].ansid;
    }
};

var currentAnswer;

var answerSortConfig = {
    draggable:true,
    formatItem:function (item, index) {
	var o = new joFlexrow([
	    new joClassyCaption(item.title, "list-item-title"),
	]);
	
	return o;
    },
    onSelect:function(index, event) {
	
    },
    onListChange:function(data) {
    }
};
    

/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function butSubmitAns() {
    submitButton.disable();

    answerToServer(currentAnswer);
}

var answerCard;

function displayClassicAnswers(json) {
    var list = [];
    for (var i = 0; i < json.q.ans.length; ++i) {
	list.push({title: json.q.ans[i], ansid : i});
    }

    // make sure we can't determine which is the correct answer
    shuffleArray(list);

    answerCard = new joCard([
	new joDraggableList(list, undefined, answerClassicConfig),
	submitButton
    ]).setTitle("Answers");

    App.stack.push(answerCard);
}

function displayMapAnswers(json) {
    answerCard = new joCard([
	new joHTML("<div class=\"container\"><div class=\"map\">Alternative content</div></div>"),
	submitButton
    ]).setTitle("Answers");

    App.stack.push(answerCard);

    mappy = $(".container").mapael({
	map : {
	    name : "world_countries",
	    zoom: {
		enabled: false
	    },
	    afterInit : function($self, paper, areas, plots, options) {
		paperInst = paper;
	    },
	    defaultArea : {
		attrs : {
		    fill : "#eeeeee"
		    , stroke: "#ced8d0"
		}
		, text : {
		    attrs : {
			fill : "#505444"
		    }
		    , attrsHover : {
			fill : "#000"
		    }
		},
		eventHandlers: {
		    click: function (e, id, mapElem, textElem) {
			globalstate = e;
			var x = e.offsetX/paperInst.width*$.fn.mapael.maps.world_countries.width;
			var y = e.offsetY/paperInst.height*$.fn.mapael.maps.world_countries.height;
			
			var coords = $.fn.mapael.maps.world_countries.getInverseCoords(x,y);
			
			var deletedPlots = ["point"];

			currentAnswer = coords;

			var newPlots = {
			    "point" : {
				latitude : coords.lat,
				longitude : coords.lon,
			    }
			};
			
			$(".container").trigger('update', [null, newPlots, deletedPlots, {animDuration : 1000}]);
		    }
		},
		
	    },
	    areas: {
		"ALL" : {
		    attrs : {
			fill : "#ffffff",
		    }
		}
	    },
	    
	},
    });
}

// when we get a new answer, we need to display this
// I guess ideally this should be cached properly
function displayAnswers(json) {

    submitButton = new joButton("Submit answer").selectEvent.subscribe(butSubmitAns)
    submitButton.enable();

    // default answer
    currentAnswer = -1;

    switch (json.q.type) {
    case "classic": displayClassicAnswers(json); break;
    case "map"    : displayMapAnswers(json); break;
    }

}


