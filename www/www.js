Questions = new Mongo.Collection("questions");
Wordvector = new Mongo.Collection("wordvec");

if (Meteor.isClient) {
    Session.set("qSearch", "");
    Session.set("ansSearch", "");
    Tracker.autorun(function () {
	Meteor.subscribe("questions", Session.get("qSearch"));
    });
    Tracker.autorun(function () {
	Meteor.subscribe("wordvec", Session.get("ansSearch"));
    });

    // This code only runs on the client
    Template.body.helpers({
	questions: function () {
	    return Questions.find({}, {sort: {createdAt: -1}})
	}
    });

    Template.body.events({
	"keyup": function (event, template) {
	    var form = template.find(".newq");

	    // If we update question we will suggest other similar questions
	    // in the quesition list
	    // This should probably also include the answer
	    console.log()
	    if (Session.get("qSearch") != form.question.value) {
		Session.set("qSearch", form.question.value);
	    }

	    // If we updated ans0 we will suggest answers
	    if (Session.get("ansSearch") != form.ans0.value) {
		Session.set("ansSearch", form.ans0.value);
	    }
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
    Meteor.publish("wordvec", function () {
	return Wordvector.find();
    });
    
    Meteor.publish("questions", function (filterWord) {
	return Questions.find({"text": filterWord});
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

  deleteTask: function (taskId) {
    Questions.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Questions.update(taskId, { $set: { checked: setChecked} });
  }
});
