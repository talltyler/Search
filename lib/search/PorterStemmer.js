// http://tartarus.org/~martin/PorterStemmer/js.txt
// Porter stemmer in Javascript. Few comments, but it's easy to follow against the rules in the original
// paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
//  no. 3, pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009

var Class = require('./Class').Class;

var PorterStemmer = new Class({
	constructor:function(){
		this.step2list = {
				"ational" : "ate",
				"tional" : "tion",
				"enci" : "ence",
				"anci" : "ance",
				"izer" : "ize",
				"bli" : "ble",
				"alli" : "al",
				"entli" : "ent",
				"eli" : "e",
				"ousli" : "ous",
				"ization" : "ize",
				"ation" : "ate",
				"ator" : "ate",
				"alism" : "al",
				"iveness" : "ive",
				"fulness" : "ful",
				"ousness" : "ous",
				"aliti" : "al",
				"iviti" : "ive",
				"biliti" : "ble",
				"logi" : "log"
			},

		this.step3list = {
				"icate" : "ic",
				"ative" : "",
				"alize" : "al",
				"iciti" : "ic",
				"ical" : "ic",
				"ful" : "",
				"ness" : ""
			},

			this.c = "[^aeiou]",          // consonant
			this.v = "[aeiouy]",          // vowel
			this.C = this.c + "[^aeiouy]*",    // consonant sequence
			this.V = this.v + "[aeiou]*",      // vowel sequence

			this.mgr0 = "^(" + this.C + ")?" + this.V + this.C,               					// [C]VC... is m>0
			this.meq1 = "^(" + this.C + ")?" + this.V + this.C + "(" + this.V + ")?$",  // [C]VC[V] is m=1
			this.mgr1 = "^(" + this.C + ")?" + this.V + this.C + this.V + this.C,       // [C]VCVC... is m>1
			this.s_v = "^(" + this.C + ")?" + this.v;                   								// vowel in stem
	},
	process: function(w){
		var stem,
			suffix,
			firstch,
			re,
			re2,
			re3,
			re4,
			origword = w;

		if (w.length < 3) { return w; }

		firstch = w.substr(0,1);
		if (firstch == "y") {
			w = firstch.toUpperCase() + w.substr(1);
		}

		// Step 1a
		re = /^(.+?)(ss|i)es$/;
		re2 = /^(.+?)([^s])s$/;

		if (re.test(w)) { w = w.replace(re,"$1$2"); }
		else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }

		// Step 1b
		re = /^(.+?)eed$/;
		re2 = /^(.+?)(ed|ing)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			re = new RegExp(this.mgr0);
			if (re.test(fp[1])) {
				re = /.$/;
				w = w.replace(re,"");
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1];
			re2 = new RegExp(this.s_v);
			if (re2.test(stem)) {
				w = stem;
				re2 = /(at|bl|iz)$/;
				re3 = new RegExp("([^aeiouylsz])\\1$");
				re4 = new RegExp("^" + this.C + this.v + "[^aeiouwxy]$");
				if (re2.test(w)) {	w = w + "e"; }
				else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
				else if (re4.test(w)) { w = w + "e"; }
			}
		}

		// Step 1c
		re = /^(.+?)y$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(this.s_v);
			if (re.test(stem)) { w = stem + "i"; }
		}

		// Step 2
		re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(this.mgr0);
			if (re.test(stem)) {
				w = stem + this.step2list[suffix];
			}
		}

		// Step 3
		re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(this.mgr0);
			if (re.test(stem)) {
				w = stem + this.step3list[suffix];
			}
		}

		// Step 4
		re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
		re2 = /^(.+?)(s|t)(ion)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(this.mgr1);
			if (re.test(stem)) {
				w = stem;
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1] + fp[2];
			re2 = new RegExp(this.mgr1);
			if (re2.test(stem)) {
				w = stem;
			}
		}

		// Step 5
		re = /^(.+?)e$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(this.mgr1);
			re2 = new RegExp(this.meq1);
			re3 = new RegExp("^" + this.C + this.v + "[^aeiouwxy]$");
			if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
				w = stem;
			}
		}

		re = /ll$/;
		re2 = new RegExp(this.mgr1);
		if (re.test(w) && re2.test(w)) {
			re = /.$/;
			w = w.replace(re,"");
		}

		// and turn initial Y back to y

		if (firstch == "y") {
			w = firstch.toLowerCase() + w.substr(1);
		}

		return w;
	}
});
exports.PorterStemmer = PorterStemmer;