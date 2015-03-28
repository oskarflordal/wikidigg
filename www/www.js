Questions = new Mongo.Collection("questions");

if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    questions: function () {
	return Questions.find({}, {sort: {createdAt: -1}})
    }
  });

    Template.body.events({
	"submit .new-q": function (event) {
	    // This function is called when the new task form is submitted
	    
	    var question = event.target.question.value;
	    var ans0 = event.target.question.value;
	    var ans1 = event.target.question.value;
	    var ans2 = event.target.question.value;
	    var ans3 = event.target.question.value;
	    var ans4 = event.target.question.value;
	    var ans5 = event.target.question.value;
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
    // At the bottom of the client code
    Accounts.ui.config({
	passwordSignupFields: "USERNAME_ONLY"
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
