/**
 * @fileOverview A library which extends the Array class with some useful functions.
 * @name Array Extensions
 *
 * @author Burak Yiğit KAYA <byk@amplio-vita.net>
 * @version 1.1
 *
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

/* backup the original indexOf if exists */
if (Array.prototype.indexOf)
	Array.prototype.indexOfOriginal=Array.prototype.indexOf;

/**
 * Finds the index of the given element int the array.
 * Returns -1 if there is no match
 * 
 * @param {Object} element The element whose index should be found.
 * @param {Boolean} [strictMatch=false] Indicates wheter the comparison would be type sensitive (uses === comparator)
 * @param {Integer} [startFrom=0] Where to start searching from
 * @param {Function(a,b)} [compareFuncion] Custom comparison function
 * @return {Integer} The index of the found element or -1
 */
Array.prototype.indexOf=function(element, strictMatch, startFrom, compareFunction)
{
	if (!compareFunction)
	compareFunction=(strictMatch)?function(haystack, needle){return (haystack===needle)}:function(haystack, needle){return (haystack==needle)};
	if (!(startFrom>0))
		startFrom=0;
	for (; startFrom<this.length; startFrom++)
		if (compareFunction(this[startFrom], element))
			return startFrom;
	return -1;
};

/**
 * Applies the given unitFunction to each element in the array and replaces it with the result.
 * @param {Function(x)} unitFunction The unit function which will be applied to the elements
 * @param {Boolean} [recursive=false] Indicates wheter the function should be applied to possible sub-elements.
 * @return {Array} Returns the modified array, a.k.a itself.
 */
Array.prototype.each=function(unitFunction, recursive)
{
	if (!unitFunction)
		return false;
	
	for (var i=0; i<this.length; i++)
		if (recursive && (this[i] instanceof Array))
			this[i]=this[i].each(unitFunction, true);
		else
			this[i]=unitFunction(this[i]);
	
	return this;
};

/**
 * Pads the array to the given length by appending the given value to the end of the string iteratively.
 * 
 * @param {Integer} newLength
 * @param {Object} value
 * @return {Array} Returns the new version of itself.
 */
Array.prototype.pad=function(newLength, value)
{
	while (this.length<newLength)
		this.push(value);
	return this;
};

/**
 * Sums all the elements in the array and returns the result.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into possible sub-arrays to sum.
 * @return {Number} The sum of all the items in the arrray and possible sub-arrays according to recursive parameter.
 */
Array.prototype.sum=function(recursive)
{
	var result=0;
	for (var i = 0; i < this.length; i++) 
	{
		if (recursive && (this[i] instanceof Array))
			result+=this[i].sum(true);
		else
			result+=parseFloat(this[i]);
	}
	return result;
};

/**
 * Calculates the mean average value of the array.
 * @return {Number} The mean average of the array.
 */
Array.prototype.mean=function()
{
	return this.sum()/this.length;
};

/**
 * Multiplies all the elements in the array.
 * 
 * @param {Boolean} [recursive=false] Defines wheter the function should go into possible sub-arrays to multiply.
 * @return {Number} The product of all the items in the arrray and possible sub-arrays according to recursive parameter.
 */
Array.prototype.product=function(recursive)
{
	var result=1;
	for (var i = 0; result && i < this.length; i++) 
	{
		if (recursive && (this[i] instanceof Array))
			result*=this[i].product(true);
		else
			result*=parseFloat(this[i]);
	}
	return result;
};

/**
 * Returns the given number of randomly selected elements from the array.
 * The items may repeat since there is no check for a uniqueness test on the result.
 * 
 * @param {Integer} [count=1] The number of elements should be returned.
 * @return {Object|Array} The randomly selected elements from the array. If count is 1 the result is not an array but the picked element itself.
 */
Array.prototype.rand=function(count)
{
	if (!(count>0))
		count=1;
	var result=[];
	while (count)
	{
		result.push(this[Math.floor(Math.random()*this.length)]);
		count--;
	}
	
	if (result.length==1)
		return result[0];
	else
		return result;
};

/**
 * Recursively reduces the array to a single value using the given unitFunction.
 * To understand how reduce exactly works, see PHP array_reduce at http://php.net/array_reduce
 * 
 * @param {Function(x,y)} unitFunction
 * @param {Object} [initialValue=null]
 * @param {Boolean} [recursive=false]
 * @return {Object} The reduced value.
 */
Array.prototype.reduce=function(unitFunction, initialValue, recursive)
{
	if (initialValue===undefined)
		initialValue=null;
	var result=initialValue;
	var currentValue;
	for (var i=0; i<this.length; i++)
	{
		currentValue=(recursive && (this[i] instanceof Array))?this[i].reduce(unitFunction, initialValue, true):this[i];
		result=unitFunction(result, currentValue);
	}
	return result;
};

/**
 * Shuffles the array and returnes the shuffled version.
 * 
 * @return {Array} The new, shuffled array.
 */
Array.prototype.shuffle=function()
{
	var temp=this.slice(0);
	this.splice(0, this.length);
	while (temp.length)
	{
		var index=Math.floor(Math.random()*temp.length);
		this.push(temp.splice(index, 1)[0]);
	}
	return this;
};

/**
 * Returns the index of the least element in the array.
 * 
 * @param {Function(a,b)} [compareFunction] Custom compare function
 * @return {Number} The index of the least element 
 */
Array.prototype.min=function(compareFunction)
{
	if (!compareFunction)
		compareFunction=function(a, b)
		{
			return a-b;
		};

	var result=0;
	for (var i=1; i<this.length; i++)
		if (compareFunction(this[i], this[result])<0)
			result=i;
	return result;
};

/**
 * Returns the index of the greatest element in the array.
 * 
 * @param {Function(a,b)} [compareFunction] Custom compare function
 * @return {Number} The index of the greatest element 
 */
Array.prototype.max=function(compareFunction)
{
	if (!compareFunction)
		compareFunction=function(a, b)
		{
			return a-b;
		};
	var result=0;
	for (var i=1; i<this.length; i++)
		if (compareFunction(this[i], this[result])>0)
			result=i;
	return result;
};

/**
 * Returns the first non-null element in the array.
 * @param {Number} [startFrom=0] The index where to start looking for.
 * @return {Object} The first non-null element in the array after the index given instartFrom.
 */
Array.prototype.coalesce=function(startFrom)
{
	var result;
	if (!startFrom)
		startFrom=0;

	while (!result && startFrom<this.length)
		result=this[startFrom++];
	return result;
};