Questions = new Mongo.Collection("questions");
Suggested = new Mongo.Collection("suggested");
Wordvector = new Mongo.Collection("wordvec");

if (Meteor.isClient) {
    Session.set("qSearch", "");
    Session.set("typeSelect", "classic");
    Session.set("ansSearch", ["","",""]);

    Meteor.subscribe("suggested");

    Tracker.autorun(function () {
	Meteor.subscribe("questions", Session.get("qSearch"), Session.get("ansSearch"), Session.get("showAll"));
    });

    Tracker.autorun(function () {
	var foo = Session.get("ansSearch")
	Meteor.subscribe("wordvec", foo);
    });

    // This code only runs on the client
    Template.body.helpers({
	questions: function () {
	    return Questions.find({}, {sort: {createdAt: -1}})
	}
    });

    Template.sug.helpers({
	    suggested: function () {
		console.log("finding");
		return Suggested.find({});
	    },
	    fixedword: function () {
		return decodeURIComponent(this.word);
	    }
	});


    Template.body.helpers({
	wordvec: function () {
	    var ret = Wordvector.find()
	    return ret;
	}
    });

    function capitalise(str) {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    function multiCapitalise(str) {
	var split = str.split('_');
	var fixed = split.map(capitalise);
	return fixed.join(' ');
    }

    function formClear(target) {
	target.question.value = "";
	target.category.value = "";
	target.ans0.value = "";
	target.ans1.value = "";
	target.ans2.value = "";
	target.ans3.value = "";
	target.ans4.value = "";
	target.ans5.value = "";
    }

    function formClearRange(target) {
	target.question.value = "";
	target.category.value = "";
	target.ans.value = "";
	target.rangeLo.value = "";
	target.rangeHi.value = "";
	target.stepSz.value = "";
    }
    function formClearMap(target) {
	target.question.value = "";
	target.category.value = "";
	target.longitude.value = "";
	target.latitude.value = "";
	target.maxdistance.value = "";
    }

    var lastAnsSearch = -1;
    var lastQSearch = -1;

    var mappy;

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

    Template.body.events({
	"keyup": function (event, template) {
	    var form = template.find(".newq");

	    // If we update question we will suggest other similar questions
	    // in the quesition list
	    // This should probably also include the answer
	    if (Session.get("qSearch") != form.question.value) {
		if (lastQSearch != -1) {
		    Meteor.clearTimeout(lastQSearch);
		}
		lastQSearch = Meteor.setTimeout(function() {
		    Session.set("qSearch", form.question.value);
		}, 300);
	    }

	    var type = Session.get("typeSelect");

	    // update based on longitude/latitude
	    if (type == "map") {
		var deletedPlots = ["point", "reach"];

		// Find out how far away we need to set another point to indicate the current maximum distance
		// do it iteratively for now
		var dist = 0;
		var itr = 0;
		var longitr = parseInt(form.longitude.value);
		while (dist < form.maxdistance.value && itr < 10000) {
		    longitr += 0.1;
		    itr++;
		    dist = calcDistanceOnMap({latitude:form.latitude.value, longitude:form.longitude.value},
					     {latitude:form.latitude.value, longitude:longitr});
		}

		var newPlots = {
		    "point" : {
			latitude : form.latitude.value,
			longitude : form.longitude.value,
			attrs : {
			    fill : "#000000",
			}
		    },
		    "reach" : {
			latitude : form.latitude.value,
			longitude : longitr,
			attrs : {
			    fill : "#777777",
			}
		    }
		};
		$(".mapcontainer").trigger('update', [null, newPlots, deletedPlots]);
	    }
	    
	    // If we updated ans0 we will suggest answers
	    if ((type == "classic" || type == "sort") &&
		Session.get("ansSearch") != form.ans0.value) {
		// make sure we have  a delay so we don't hammer the server
		// and queue up a bunch of publications
		if (lastAnsSearch != -1) {
		    Meteor.clearTimeout(lastAnsSearch);
		}
		lastAnsSearch = Meteor.setTimeout(function() {
			// underscores are currently stored in place of ' '
			Session.set("ansSearch",
				    [form.ans0.value.toLowerCase().replace(" ", "_"),
				     form.ans1.value.toLowerCase().replace(" ", "_"),
				     form.ans2.value.toLowerCase().replace(" ", "_")]);
		}, 300);
	    }
	},
	"change .show-all input": function (event) {
	    Session.set("showAll", event.target.checked);
	},

	"click .addAns": function (event, template) {
	    event.target.disabled = true;
	    var form = template.find(".newq");
	    var ans1 = form.ans1.value;
	    var ans2 = form.ans2.value;
	    var ans3 = form.ans3.value;
	    var ans4 = form.ans4.value;
	    var ans5 = form.ans5.value;

	    // find an empty answer field and add this there
	    if (!/\S/.test(ans1)) {
		form.ans1.value = multiCapitalise(this.word);
	    } else if (!/\S/.test(ans2)) {
		form.ans2.value = multiCapitalise(this.word);
	    } else if (!/\S/.test(ans3)) {
		form.ans3.value = multiCapitalise(this.word);
	    } else if (!/\S/.test(ans4)) {
		form.ans4.value = multiCapitalise(this.word);
	    } else if (!/\S/.test(ans5)) {
		form.ans5.value = multiCapitalise(this.word);
	    }

	}

    });

    function buildClassicAnswer(event) {
	var ans = [];
	var ans0 = event.target.ans0.value;
	var ans1 = event.target.ans1.value;
	var ans2 = event.target.ans2.value;
	var ans3 = event.target.ans3.value;
	var ans4 = event.target.ans4.value;
	var ans5 = event.target.ans5.value;
	
	if (/\S/.test(ans0)) {
	    ans.push(ans0);
	} else { return false}
	if (/\S/.test(ans1)) {
	    ans.push(ans1);
	    }
	if (/\S/.test(ans2)) {
	    ans.push(ans2);
	}
	if (/\S/.test(ans3)) {
	    ans.push(ans3);
	}
	if (/\S/.test(ans4)) {
	    ans.push(ans4);
	}
	if (/\S/.test(ans5)) {
	    ans.push(ans5);
	}

	return ans;
    }

    function buildRangeAnswer(event) {
	var ans = parseInt(event.target.ans.value);
	var rangeLo = parseInt(event.target.rangeLo.value);
	var rangeHi = parseInt(event.target.rangeHi.value);
	var stepSz = parseInt(event.target.stepSz.value);

	// Sanity checks
	// Make sure we can hit the the correct answer
	if ( !((((ans-rangeLo)%stepSz) == 0) &&
	       (((rangeHi-rangeLo)%stepSz) == 0) &&
	       ((ans >= rangeLo) && (ans <= rangeHi)) &&
	       (rangeLo < rangeHi))) {
	    console.log(ans);
	    console.log(rangeLo);
	    console.log(rangeHi);
	    console.log(stepSz);

	    console.log((((ans-rangeLo)%stepSz) == 0));
	    console.log( (((rangeHi-rangeLo)%stepSz) == 0));
	    console.log(((ans >= rangeLo)));
	    console.log(ans <= rangeHi);
	    console.log((rangeLo < rangeHi));
	    return false;
	}
	
	
	if (/\S/.test(ans) && /\S/.test(rangeLo) && /\S/.test(rangeHi) && /\S/.test(stepSz)) {
	    return {ans : ans, rangeLo : rangeLo, rangeHi : rangeHi,  stepSz : stepSz};
	} else {
	    return false;
	}
    }

    function buildMapAnswer(event) {
	var longitude = parseFloat(event.target.longitude.value);
	var latitude = parseFloat(event.target.latitude.value);
	var maxdistance = parseFloat(event.target.maxdistance.value);

	// Sanity checks
	// TODO
	
	
	if (/\S/.test(longitude) && /\S/.test(latitude) && /\S/.test(maxdistance)) {
	    return {map : "world_countries", location : {longitude : longitude,
			latitude : latitude}, maxdistance : maxdistance};
	} else {
	    return false;
	}
    }

    Template.body.events({
	"submit .newq": function (event) {
	    // This function is called when the new task form is submitted
	    
	    var question = event.target.question.value;
	    var category = event.target.category.value;
	    var type = Session.get("typeSelect");

	    var ans;
	    switch(type) {
	    case "classic":
		ans = buildClassicAnswer(event);
		// Clear form
		formClear(event.target);
		break;
	    case "range":
		ans = buildRangeAnswer(event);
		formClearRange(event.target);
		break;
	    case "sort":
		ans = buildClassicAnswer(event); // looks the same
		// Clear form
		formClear(event.target);
		break;
	    case "map":
		ans = buildMapAnswer(event);
		formClearMap(event.target);
		break;
	    }

	    if (ans == false) {
		return false;
	    }

	    var updateId = Session.get("editId");
	    if (typeof updateId === 'undefined') {
		Meteor.call("addQuestion", question, category, ans, type);
	    } else {
		Meteor.call("updateQuestion", updateId, question, category, ans, type);
		delete Session.keys['editId'];
	    }
	    
	    // Prevent default form submit
	    return false;
	},
	"clear .newq": function (event) {
	    // Clear form
	    delete Session.keys['editId'];
	    formClear(event.target);
	},
	"change #classpicker": function (event) {
	    // Clear form
	    var type = Session.set("typeSelect", $(event.target).val());
	}
    });
    Template.question.events({
	"click .delete": function () {
	    Meteor.call("deleteTask", this._id);
	},
	"click .edit": function () {
	    Session.set("editId", this._id);
	    if ($("#classpicker").val() == this.type) {
		switch (this.type) {
		case "classic": setEditClassic(this); break;
		case "range": setEditRange(this); break;
		case "map": setEditMap(this); break;
		case "sort": setEditSort(this); break;
		};
		
	    } else { // if we don't have the correct DOM rendered we need to wait until blaze has redrawn (I guess?)
		// it is then called in the onrendered callback
		$("#classpicker").val(this.type);
		Session.set("typeSelect", this.type);
		Session.set("edit", this);
	    }
	}
    }); 

    Template.question.helpers({
	relcreated : function() {
	    return moment(this.createdAt).fromNow();
	},
	nonfirst : function(val) {
	    return val.slice(1,val.length);
	},
	typeclassic : function(val) {
	    return val == "classic";
	},
	typerange : function(val) {
	    return val == "range";
	},
	typesort : function(val) {
	    return val == "sort";
	},
	typemap : function(val) {
	    return val == "map";
	},
    });

    Template.answer.helpers({
	    fixedword : function() {
		// separate all underscores since that is the way they are stroed in the db
		return this.word.replace('_',' ');
	    }
	});


    Template.qform.helpers({
	selectclassic : function() {
	    var type = Session.get("typeSelect");
	    return type == "classic";
	},
	selectrange : function() {
	    var type = Session.get("typeSelect");
	    return type == "range";
	},
	selectmap : function() {
	    var type = Session.get("typeSelect");
	    return type == "map";
	},
	selectsort : function() {
	    var type = Session.get("typeSelect");
	    return type == "sort";
	},
    });

    function nifundef(a) {
	return (typeof a === 'undefined') ? "" : a;
    }
    
    function setEditClassic(q) {
	$("#qinput")[0].value = q.text;
	$("#cinput")[0].value = q.category;
	$("#ans0input")[0].value = nifundef(q.ans[0]);
	$("#ans1input")[0].value = nifundef(q.ans[1]);
	$("#ans2input")[0].value = nifundef(q.ans[2]);
	$("#ans3input")[0].value = nifundef(q.ans[3]);
	$("#ans4input")[0].value = nifundef(q.ans[4]);
	$("#ans5input")[0].value = nifundef(q.ans[5]);
    }

    function setEditSort(q) {
	$("#qinput")[0].value = q.text;
	$("#cinput")[0].value = q.category;
	$("#ans0input")[0].value = nifundef(q.ans[0]);
	$("#ans1input")[0].value = nifundef(q.ans[1]);
	$("#ans2input")[0].value = nifundef(q.ans[2]);
	$("#ans3input")[0].value = nifundef(q.ans[3]);
	$("#ans4input")[0].value = nifundef(q.ans[4]);
	$("#ans5input")[0].value = nifundef(q.ans[5]);
    }

    function setEditRange(q) {
	$("#qinput")[0].value = q.text;
	$("#cinput")[0].value = q.category;
	$("#ansinput")[0].value = nifundef(q.ans.ans);
	$("#rangeLoinput")[0].value = nifundef(q.ans.rangeLo);
	$("#rangeHiinput")[0].value = nifundef(q.ans.rangeHi);
	$("#stepSzinput")[0].value = nifundef(q.ans.stepSz);
    }

    function setEditMap(q) {
	$("#qinput")[0].value = q.text;
	$("#cinput")[0].value = q.category;
	$("#longitudeinput")[0].value = nifundef(q.ans.location.longitude);
	$("#latitudeinput")[0].value = nifundef(q.ans.location.latitude);
	$("#maxdistanceinput")[0].value = nifundef(q.ans.maxdistance);
    }

    Template.qformclassic.onRendered(function(){
	var q = Session.get('edit');
	if (typeof q !== 'undefined') {
	    // we have a question to edit, lets place it in the fields
	    setEditClassic(q);
	    
	    delete Session.keys['edit'];
	}
    });
    Template.qformsort.onRendered(function(){
	var q = Session.get('edit');
	if (typeof q !== 'undefined') {
	    // we have a question to edit, lets place it in the fields
	    setEditSort(q);
	    
	    delete Session.keys['edit'];
	}
    });
    Template.qformrange.onRendered(function(){
	var q = Session.get('edit');
	if (typeof q !== 'undefined') {
	    // we have a question to edit, lets place it in the fields
	    setEditRange(q);
	    
	    delete Session.keys['edit'];
	}
    });
    Template.qformmap.onRendered(function(){
	var q = Session.get('edit');
	if (typeof q !== 'undefined') {
	    // we have a question to edit, lets place it in the fields
	    setEditMap(q);
	    
	    delete Session.keys['edit'];
	}
    });

    function setupMapael() {
	mappy = $(".mapcontainer").mapael({
	    map : {
		name : "world_countries",
		zoom: {
		    enabled: false
		},
		defaultArea : {
		    attrs : {
			fill : "#ffffff",
			stroke: "#000000"
		    } ,
		    text : {
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
    }

    Template.mapview.onRendered(function(){
	if (Session.get("typeSelect") == "map") {
	    setupMapael();
	}
    });

    Template.mapselect.helpers({
	selectmap : function() {
	    var type = Session.get("typeSelect");
	    var on = type == "map";
	    return on;
	},
    });

    Accounts.ui.config({
	passwordSignupFields: "USERNAME_ONLY"
    });
}

if (Meteor.isServer) {

    function removeA(arr) {
	var what, a = arguments, L = a.length, ax;
	while (L > 1 && arr.length) {
	    what = a[--L];
	    while ((ax= arr.indexOf(what)) !== -1) {
		arr.splice(ax, 1);
	    }
	}
	return arr;
    }

    Meteor.publish("wordvec", function (filterWord) {
	    
	// check if we have the word available
	    var ret = Wordvector.find({$or : [{"word": filterWord[0]},
	                                      {"word": filterWord[1]},
                                    	      {"word": filterWord[2]}]});
	var data = ret.fetch();
	var ans = null;

	if (ret.count() != 0) {
	    var i;
	    ids = data[0].simid;

	    // merge the first three we are searching for
	    for (i = 1; i < data.length; ++i) {
		ids = ids.concat(data[i].simid);
	    }

	    // grab the unique values
	    var uniqids = ids.filter(function(item, i, ar){ return ar.indexOf(item) === i; });

	    // fetch all words that are similar
	    ans = Wordvector.find({"id": {$in : uniqids}});

	    // strip any occurances of the filterwords
	    removeA(ans, filterWord[0]);
	    removeA(ans, filterWord[1]);
	    removeA(ans, filterWord[2]);
	}
	return ans;
    });

    function toTitleCase(str) {
	
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    Meteor.publish("suggested", function () {

	    var rand = Math.random();
	    console.log(rand);
	    return Suggested.find({rnd : { $gte : rand}}, {limit : 5});
	});
    
    Meteor.publish("questions", function (filterWord, ansSearch, showAll) {
	var ret;
	if (showAll) {
	    ret = Questions.find();
	} else {
	    ret = Questions.find({$or: [{"text": filterWord},
	    {"ans": capitalise(ansSearch[0])} ,
	    {"ans": capitalise(ansSearch[1])},
	    {"ans": capitalise(ansSearch[2])}]});
	}
	return ret;
    });
}

Meteor.methods({
    addQuestion: function (question, category, ans, type) {
	// Make sure the user is logged in before inserting a task
	if (! Meteor.userId()) {
	    throw new Meteor.Error("not-authorized");
	}
	
	// TODO make potentially some more checks on the data
	// although clientside is probably sufficient
	Questions.insert({
	    text: question,
	    owner: Meteor.userId(), 
	    category : category,
	    ans : ans,
	    type: type,
	    username: Meteor.user().profile.name,
	    createdAt: new Date() // current time
	});
	
    },

    updateQuestion: function (updateId, question, category, ans, type) {
	// Make sure the user is logged in before inserting a task
	if (! Meteor.userId()) {
	    throw new Meteor.Error("not-authorized");
	}
	
	Questions.update(
	    {"_id" : updateId},
	    {
		text: question,
		owner: Meteor.userId(), 
		category : category,
		ans : ans,
		type: type,
		username: Meteor.user().profile.name,
		createdAt: new Date() // current time
	    },
	    {upsert : false, multi : false });
	
    },

  deleteTask: function (taskId) {
      if (! Meteor.userId()) { // should probably be admin or the like TODO
	  throw new Meteor.Error("not-authorized");
      }
      Questions.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Questions.update(taskId, { $set: { checked: setChecked} });
  }
});







