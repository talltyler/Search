var Class = require('./search/Class').Class;
var PorterStemmer = require('./search/PorterStemmer').PorterStemmer;
var DoubleMetaphone = require('./search/DoubleMetaphone').DoubleMetaphone;
var Vector = require('./search/Vector').Vector;

var Search = new Class({
	constructor:function()
	{
		// fieldWeights can provide feilds with more presidents by adding a modifier
		this.fieldWeights = {};

		// Mapping of vector index to keyword
		this.vectorKeywordIndex=[];
	},
	
	// Create the vector space for the passed document strings
	index: function(documents){
		var vectorKeywordIndex = getVectorKeywordIndex(documents);
		this.vectorKeywordIndex = vectorKeywordIndex[0];
		this.vectorKeywordIndexLength = vectorKeywordIndex[1];
		this.documentVectors = [];
		this.documentFieldVectors = {};
		this.documentsLenght = documents.length;
		this.fields = [];
		for( var i = 0; i < this.documentsLenght; i++){
			if( typeof(documents[i]) == "object" ) {
				for( var field in documents[i] ){
					this.fields.push(field);
					var vector = makeVector(documents[i][field],this.fieldWeights[field]||0,this.vectorKeywordIndex);
					var vectorIndex = this.documentVectors.push(vector);
					if( this.documentFieldVectors.hasOwnProperty(field) ){
						this.documentFieldVectors[field].push(vector);
					}else{
						this.documentFieldVectors[field] = [vector];
					}
				}
			}else{
				this.documentVectors.push(makeVector(documents[i],0,this.vectorKeywordIndex));
			}
		}
	},
	
	// Query the index, returns an array of documents with id and rank
	query: function(string,fields){
		var words = string.split(" ");
		var count = 0;
		var falseMatches = [];
		for( var word in words){
			if(words[word].charAt(0)=="!"||words[word].charAt(0)=="-"){
				var stemmed = stemmer.process(words[word].split("!").join("").split("-").join(""));
				var index = this.vectorKeywordIndex[DoubleMetaphone(stemmed).primary];
				falseMatches.push(index);
				words.splice(count,1);
			}
			count++
		}
		var queryVector = makeVector(words.join(" "),0,this.vectorKeywordIndex);
		var total = 0;
		for(var i = 0; i < queryVector.data.length; i++){
		 total += queryVector.data[i];
		}
		if( total == 0 ){
			return [];
		}
		var i=0;
		var docs = [];
		for( i=0; i<this.documentsLenght; i++){
			docs.push( new Vector(this.vectorKeywordIndexLength) );
		}
		fields = fields||this.fields;
		for( var field in fields){
			var fieldData = this.documentFieldVectors[fields[field]];
			for( i=0; i<this.documentsLenght; i++){
				for( var h=0; h<fieldData[i].data.length; h++){
					docs[i].data[h] += fieldData[i].data[h];
				}
			}
		}
		var results=[];
		documentLoop:for( i=0; i<this.documentsLenght; i++){
			for( var falseMatch in falseMatches){ // strip documents that have falsematches
				if(docs[i].data[falseMatches[falseMatch]]!=0){
					continue documentLoop;
				}
			}
			var result = cosine(queryVector, docs[i]); // figure out query vector closeness to documents
			if( result != 0 ){ 
				results.push({id:i, rank:result});
			} // filter out items that dont match at all
		}
		
		return results.sort(function (a, b) { return ((b.rank - a.rank)) }); // sort in descending order
	},
	
	related: function(documentId){
		var results=[]; // TODO: need to add all the field vector values together because documentId is for whole doc not one field
		for( var i=0; i<this.documentVectors.length; i++){
			var result = cosine(this.documentVectors[documentId], this.documentVectors[i]); // figure out query vector closeness to documents
			if( result != 0 ){ results.push({id:i, rank:result}); } // filter out items that dont match at all
		}
		return results.sort(function (a, b) { return ((b.rank - a.rank)) });
	}
});
exports.Search = Search;

// Private ///////////////////////////////////////////////////////////////////////////////////////////

// Stemming is a way to convert words like speeder and speeds to speed
var stemmer = new PorterStemmer();

// Words that will not be indexed
var stopWords = ["a","about","above","above","across","after","afterwards","again","against","all","almost","alone","along","already","also","although","always","am","among","amongst","amoungst","amount","an","and","another","any","anyhow","anyone","anything","anyway","anywhere","are","around","as","at","back","be","became","because","become","becomes","becoming","been","before","beforehand","behind","being","below","beside","besides","between","beyond","bill","both","bottom","but","by","call","can","cannot","cant","co","con","could","couldnt","cry","de","describe","detail","do","done","down","due","during","each","eg","eight","either","eleven","else","elsewhere","empty","enough","etc","even","ever","every","everyone","everything","everywhere","except","few","fifteen","fify","fill","find","fire","first","five","for","former","formerly","forty","found","four","from","front","full","further","get","give","go","had","has","hasnt","have","he","hence","her","here","hereafter","hereby","herein","hereupon","hers","herself","him","himself","his","how","however","hundred","ie","if","in","inc","indeed","interest","into","is","it","its","itself","keep","last","latter","latterly","least","less","ltd","made","many","may","me","meanwhile","might","mill","mine","more","moreover","most","mostly","move","much","must","my","myself","name","namely","neither","never","nevertheless","next","nine","no","nobody","none","noone","nor","not","nothing","now","nowhere","of","off","often","on","once","one","only","onto","or","other","others","otherwise","our","ours","ourselves","out","over","own","part","per","perhaps","please","put","rather","re","same","see","seem","seemed","seeming","seems","serious","several","she","should","show","side","since","sincere","six","sixty","so","some","somehow","someone","something","sometime","sometimes","somewhere","still","such","system","take","ten","than","that","the","their","them","themselves","then","thence","there","thereafter","thereby","therefore","therein","thereupon","these","they","thickv","thin","third","this","those","though","three","through","throughout","thru","thus","to","together","too","top","toward","towards","twelve","twenty","two","un","under","until","up","upon","us","very","via","was","we","well","were","what","whatever","when","whence","whenever","where","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","while","whither","who","whoever","whole","whom","whose","why","will","with","within","without","would","yet","you","your","yours","yourself","yourselves","the"];

var vectorKeywordIndexLength = 0;

// Create the keyword associated to the position of the elements within the document vectors
function getVectorKeywordIndex(documents){
	// Mapped documents into a single word string
	var vocabularyString = "";
	for( var i = 0; i < documents.length; i++){
		for( var field in documents[i] ){
			vocabularyString += documents[i][field]+" ";
		}
	}
	//Remove common words which have no search value
	var vocabularyList = tokenise(removeStopWords(vocabularyString));		
	var uniqueVocabularyList = removeDuplicates(vocabularyList);

	var vectorIndex={};
	var offset=0;
	//Associate a position with the keywords which maps to the dimension on the vector used to represent this word
	for( var i = 0; i < uniqueVocabularyList.length; i++){
		var word = uniqueVocabularyList[i];
		vectorIndex[word]=offset;
		offset++;
	}
	vectorKeywordIndexLength = uniqueVocabularyList.length
	return [vectorIndex, uniqueVocabularyList.length]; // (keyword:position)
}

// Make a vector that has values for each instance of the words contained in each document
function makeVector(string,fieldWeight,vectorKeywordIndex){
	fieldWeight = fieldWeight||0;
	var vector = new Vector(vectorKeywordIndexLength);
	var wordList = tokenise(removeStopWords(string));
	for( var i=0; i<wordList.length; i++){
		var word = wordList[i];
		vector.data[vectorKeywordIndex[word]] += 1+fieldWeight; // Use simple Term Count Model
	}
	return vector;
}

// Remove duplicates from a list
function removeDuplicates(list){
	var result = new Array();
  o:for(var i=0, n = list.length; i < n; i++){
		for(var x=0, y = result.length; x < y; x++){
			if(result[x]==list[i]) continue o;
		}
		result[result.length] = list[i];
  }
  return result;
}

// related documents j and q are in the concept space by comparing the vectors 
//  cosine  = ( V1 * V2 ) / ||V1|| x ||V2||
function cosine(vector1,vector2){
	return vector1.dot(vector2) / (vector1.norm() * vector2.norm()); 
}

// remove any nasty grammar tokens from string
function clean(string){
	string = string.split(".").join(" ");
	string = string.split("-").join(" ");
	string = string.split("_").join(" ");
	string = string.split("&").join(" ");
	string = string.split(/\s+/).join(" ");
	return string.toLowerCase();
}

// Remove common words which have no search value
function removeStopWords(string){
	var words = clean(string).split(" ");
	var result = [];
	for( var i=0; i<words.length; i++){
		if(stopWords.indexOf(words[i])==-1) result.push(words[i]);
	}
	return result;
}

// break string up into tokens and stem words
function tokenise(words){
	var result = [];
	for( var i=0; i<words.length; i++){
		var word = words[i];
		var metaphones = DoubleMetaphone(stemmer.process(word));
		result.push(metaphones.primary);
		if(metaphones.secondary!=null){
			result.push(metaphones.secondary);
		}
	}
	return result;
}
