var Search = require('./../lib/Search').Search;
var nStore = require('./lib/nstore');

// A simple data set to search over, feel free to use any data source, nstore uses JavaScript objects so it's simple
var db = nStore('data/example.db');

db.all(null,function (err, docs, metas) {
  if (err) throw err;
	var s = new Search();
	s.fieldWeights.title = 5; // Make one/or many of the document fields more important
	s.index(docs);						// Create a search index, this should only be done when app loads or data changes
	var terms = "meet !poultry";
	var results = s.query(terms);// ,["title"]
	for(var i=0;i<results.length;i++){
		console.log(results[i].id+" "+docs[results[i].id].title +" "+  results[i].rank);
	}
});

/*
db.save("1", {"title":"Full Text Search for Node.js","body":"Tyler Larson has created a full text search engine for Node.js"}, function (err) { if (err) { throw err; } });
db.save("2", {"title":"Daily Bulletin","body":"Humane society challenges meat industry over new law"}, function (err) { if (err) { throw err; } });
db.save("3", {"title":"Wilson County News","body":"Unprecedented meeting on COOL held in Kansas City"}, function (err) { if (err) { throw err; } });
db.save("4", {"title":"Meat & Poultry","body":"Industry reflects on USDA under Bush"}, function (err) { if (err) { throw err; } });
db.save("5", {"title":"Wilson County News","body":"Unprecedented meeting on COOL held in Kansas City"}, function (err) { if (err) { throw err; } });
db.save("6", {"title":"Drovers","body":"Beefing up Safety"}, function (err) { if (err) { throw err; } });
db.save("7", {"title":"Supermarket News","body":"Humane Society opposes meat industry challenge"}, function (err) { if (err) { throw err; } });
db.save("8", {"title":"Daily Bulletin","body":"motion against non-ambulatory ban"}, function (err) { if (err) { throw err; } });
db.save("9", {"title":"Press-Enterprise","body":"California downer law lawsuit"}, function (err) { if (err) { throw err; } });
db.save("10", {"title":"Meatingplace","body":"COOL funding"}, function (err) { if (err) { throw err; } });
*/


/* // Find documents similar to the document at index 0
var relatedResults = s.related(0); 
for(var i=0;i<relatedResults.length;i++){
	console.log(documents[relatedResults[i].id].title +" "+ relatedResults[i].rank );
}*/

