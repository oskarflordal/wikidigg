var submitButton;

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

// when we get a new answer, we need to display this
// I guess ideally this should be cached properly
function displayAnswers(json) {

    var list = [];
    for (var i = 0; i < json.q.ans.length; ++i) {
	list.push({title: json.q.ans[i], ansid : i});
    }

    // make sure we can't determine which is the correct answer
    shuffleArray(list);

    // default answer
    currentAnswer = -1;
    
    submitButton = new joButton("Submit answer").selectEvent.subscribe(butSubmitAns)

    answerCard = new joCard([
	new joDraggableList(list, undefined, answerClassicConfig),
	submitButton
    ]).setTitle("Answers");

    App.stack.push(answerCard);
}


