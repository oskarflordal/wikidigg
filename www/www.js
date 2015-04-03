Questions = new Mongo.Collection("questions");
Wordvector = new Mongo.Collection("wordvec");

if (Meteor.isClient) {
    Meteor.subscribe("wvec");
    Meteor.subscribe("questions");

    // This code only runs on the client
    Template.body.helpers({
	questions: function () {
	    return Questions.find({}, {sort: {createdAt: -1}})
	}
    });

    Template.body.events({
	"keydown": function (event, template) {
	    var form = template.find(".newq");
	    
	    form.ans1.value = "dsfsfasdfas";
	    Meteor.call("askSimilar", form.ans1.value, form);
	    console.log("he!");
	}
    });

    Template.body.events({
	"submit .newq": function (event) {
	    // This function is called when the new task form is submitted
	    
	    var question = event.target.question.value;
	    var ans0 = event.target.ans0.value;
	    var ans1 = event.target.ans1.value;
	    var ans2 = event.target.ans2.value;
	    var ans3 = event.target.ans3.value;
	    var ans4 = event.target.ans4.value;
	    var ans5 = event.target.ans5.value;
	    var type = "standard"
	    
	    Meteor.call("addQuestion", question);
	    
	    // Clear form
	    event.target.question.value = "";
	    event.target.ans0.value = "";
	    event.target.ans1.value = "";
	    event.target.ans2.value = "";
	    event.target.ans3.value = "";
	    event.target.ans4.value = "";
	    event.target.ans5.value = "";
	    
	    // Prevent default form submit
	    return false;
	}
    });
    Template.question.events({
	"click .delete": function () {
	    Meteor.call("deleteTask", this._id);
	}
    }); 

    Accounts.ui.config({
	passwordSignupFields: "USERNAME_ONLY"
    });
}

if (Meteor.isServer) {
    Meteor.publish("wvec", function () {
	return Wordvector.find();
    });
    
    Meteor.publish("questions", function () {
	return Questions.find();
    });
}

Meteor.methods({
  addQuestion: function (question) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

      Questions.insert({
	  text: question,
	  owner: Meteor.userId(), 
	  username: Meteor.user().username,
	  createdAt: new Date() // current time
      });

  },
  askSimilar: function (text, form) {
      console.log("ask sim");
      form.ans2.value = "grumt2";
      form.ans3.value = "grumt3";
      form.ans4.value = "grumt4";
      form.ans5.value = "grumt5";
      form.ans6.value = "grumt6";
  },

  deleteTask: function (taskId) {
    Questions.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Questions.update(taskId, { $set: { checked: setChecked} });
  }
});
