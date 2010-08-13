var Class = require('./Class').Class;

var Vector = new Class({
	constructor:function(size){
		this.data = [];
		for(var i=0;i<size;i++){
			this.data.push(0);
		}
	},
	norm: function(){
		var maxColSum = 0;
	  var sum = 0;
	  for (var row = 0; row < this.data.length; row++) {
	      sum += Math.abs(this.data[row]);
	  }
	  return Math.max(maxColSum, sum);
	},
	dot: function(vector) {
	  var V = vector.data || vector;
	  var i, product = 0, n = this.data.length;
	  if (n != V.length) { return null; }
	  do { product += this.data[n-1] * V[n-1]; } while (--n);
	  return product;
	}
});
exports.Vector = Vector;