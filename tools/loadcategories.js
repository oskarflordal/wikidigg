var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var mongonConnection;

var url = 'mongodb://localhost:27017/meteor';

// read a file and add each line to the db
var fs = require('fs');
var readline = require('readline');




// Use connect method to connect to the Server


function readAndInsert(collection)  {
    
    var count = 0;
    
    var rd = readline.createInterface({
	    input: fs.createReadStream('clean'),
	    output: process.stdout,
	    terminal: false
	});
    
    rd.on('line', function(line) {
	    count += parseInt(line.split(' ')[3]);
	    var txt = line.split(' ')[1];
	    
	    var doc = {
		word: txt,
		// for randomization we add an offset based on the total end count (which I sneakily counted before)
		rnd: count/1901163855
	    };
	    collection.insert(doc);
	    
	});
    rd.on('close', function(line) {
	    console.log("DONE:");
	    console.log(count);
	});
}

MongoClient.connect(url, function (err, db) {
	if (err) {
	    console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {
	    //HURRAY!! We are connected. :)
	    console.log('Connection established to', url);
	    
	    // do some work here with the database.
	    mongoConnection = db;

	    var collection = db.collection('suggested');

	    readAndInsert(collection);
	}
    });

