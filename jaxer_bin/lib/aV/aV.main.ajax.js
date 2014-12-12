/**
 * @fileOverview A function-based AJAX library which also comes with useful XML functions such as <a href="#aV.AJAX.XML.getValue">aV.AJAX.XML.getValue</a> and <a href="#aV.AJAX.XML.setValue">aV.AJAX.XML.setValue</a>.
 * @name Core AJAX and XML functions Library
 *
 * @author Burak Yigit KAYA	<byk@amplio-vita.net>
 * @version 1.7
 * @copyright &copy;2009 amplio-Vita under <a href="../license.txt" target="_blank">BSD Licence</a>
 */

if (!window.aV)
	var aV={config: {}};
	
/**
 * Represents the namespace, aV.AJAX, for the core AJAX functions.
 *
 * @namespace
 * @requires Object Extensions (aV.ext.object.js)
 * @requires Array Extensions (aV.ext.array.js)
 * @requires String Extensions (aV.ext.string.js)
 */
aV.AJAX = {};

if (!aV.config.AJAX)
	/**
	 * @namespace
	 * Holds the configuration parameters for aV.AJAX.
	 */
	aV.config.AJAX={};

aV.config.AJAX.unite(
	{
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The error, wchich will be shown to the user if his/her browser does not support XMLHTTPRequest object.
		 */
		noAjax: "You need an AJAX supported browser to use this page.",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The path of the "loading image" which will be used in various places like in the content of loadContent's target.
		 */
		loadImgPath: "/JSLib/images/loading.gif",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The HTML string which will be placed into the target of loadContent function.
		 */
		loadingText: "<img src=\"/JSLib/images/loading.gif\" style=\"border: none\">Loading, please wait...",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The warning message which will be displayed to the user when (s)he tries to leave the page while an AJAX request is in-progress. Set to false or '' to not to show any message.
		 */
		pageLeaveWarning: "There are one or more requests in progress. If you exit, there might be data loss.",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {String} The path of the "blank.html" which is need for cross-domain requests.
		 */
		blankPageURL: "/JSLib/blank.html",
		/**
		 * @memberOf aV.config.AJAX
		 * @type {Object} Contains the list of the data-parses to process the AJAX result into a native JavaScript object. You can add your data-type and data-parser to this object if you need.
		 */
		dataParsers:
		{
			'text/xml': function(requestObject)
			{
				return aV.AJAX.XML.toObject(requestObject.responseXML);
			},
			'application/xml': function(requestObject)
			{
				return aV.AJAX.XML.toObject(requestObject.responseXML);
			},
			'application/json': function(requestObject)
			{
				return requestObject.responseText.toObject();
			},
			'application/compressed-json': function(requestObject)
			{
				return eval(requestObject.responseText).toObject();
			}
		}
	}
);

/**
 * Destroys the given XMLHttpRequest object safely.
 * Aborts the request if it is active.
 *
 * @param {XMLHttpRequestObject} requestObject The requestObject which will be destroyed
 */
aV.AJAX.destroyRequestObject=function(requestObject)
{
	if (requestObject)
	{
		if ((requestObject.readyState!=4) && (requestObject.readyState!=0))
			requestObject.abort();
		requestObject=undefined;
	}
};

/**
 * This function is assigned to the page's onbeforeunload event for pageLeaveWarning feature.
 * See aV.config.AJAX.pageLeaveWarning
 *
 * @deprecated Should not be called directly, it is for the page's onbeforeunload event.
 * @return {String | null} pageLeaveWarning config variable or null
 */
aV.AJAX.checkActiveRequests=function()
{
	if (aV.config.AJAX.pageLeaveWarning && aV.AJAX.activeRequestCount>0)
		return aV.config.AJAX.pageLeaveWarning;
};

/**
 * Creates a new XMLHttpRequest object which connects to the address, which includes the URI encoded and merged GET parameters.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @param {String} address The address of the page which will be connected. Should include the URI encoded GET parameters.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 * @return {XMLHttpRequestObject} The created XMLHttpRequest.
 */
aV.AJAX.makeGetRequest=function(address, changeFunction)
{
	var requestObject = new XMLHttpRequest(); //try to create an XMLHttpRequest object
	if (requestObject) //if the XMLHttpRequest object is valid
	{
		requestObject.open("GET", address, true); //set the address and HTTP method to GET
		requestObject.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(requestObject);
			}
			catch(error)
			{
				if (window.onerror)
					window.onerror(error.message, error.fileName, error.lineNumber);
			}
			finally
			{
				if (requestObject.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					requestObject=undefined;
				}
			}
		};
		requestObject.send(); //start the request
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return requestObject; //return the created XMLHttpRequest object for any further use
};

/**
 * Creates a new XMLHttpRequest object which posts the given URI query string to the given address.
 * Assignes changeFunction to the newly created XMLHttpRequest object's onreadystatechange event.
 * Frees the XMLHttpRequest object automatically after completing the call.
 *
 * @deprecated Generally used internally from other high-level functions. Not very suitable for end-developers.
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String} parameters The URI encoded and merged POST parameters for the HTTP request.
 * @param {Function(XMLHttpRequestObject)} [changeFunction] The function which will be assigned to the newly created XMLHttpRequest object's onreadystatechange event.
 * @return {XMLHttpRequestObject} The created request object.
 */
aV.AJAX.makePostRequest=function(address, parameters, changeFunction)
{
	var requestObject = new XMLHttpRequest(); //try to create a XMLHttpRequest object
	if (requestObject) //if XMLHttpRequest object is valid
	{
		requestObject.open("POST", address, true); //set the address and HTTP method to GET
		requestObject.onreadystatechange = function()
		{
			try
			{
				if (changeFunction) //if there is an assigned changeFunction, assign it to the onreadystatechange event specially, that it recieves the XMLHttpRequest object as its parameter		
					changeFunction(requestObject);
			}
			catch(error)
			{
				if (window.onerror)
					window.onerror(error.message, error.fileName, error.lineNumber);
			}
			finally
			{
				if (requestObject.readyState==4)
				{
					aV.AJAX.activeRequestCount--;
					requestObject=undefined;
				}
			}
		};
		if (!parameters)
			parameters='';
		requestObject.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    requestObject.setRequestHeader("Content-length", parameters.length);
    requestObject.setRequestHeader("Connection", "close");
		//set some headers for POST method
		requestObject.send(parameters); //send the request with parameters attached
		aV.AJAX.activeRequestCount++;
	}
	else if(aV.config.AJAX.noAjax) //if cannot create a valid XMLHttpRequest object, inform user.
		alert(aV.config.AJAX.noAjax);
	return requestObject; //return the created XMLHttpRequest object for any further use
};

/**
 * Takes "GET" or "POST" as method parameter and then according to this, creates a SELF-MANAGED
 * XMLHttpRequest object using internal makeGetRequest or makePostRequest according to the method parameter.
 * Developers are strongly recommended to use THIS function instead of the above POST and GET specific functions.
 *
 * @param {String} method Should be either "POST" or "GET" according to the type of the HTTP request.
 * @param {String} address The address of the page which will be connected. Should  NOT include any parameters.
 * @param {String | Object} parameters The parameters which are either URI encoded and merged or given in the JSON format
 * @param {Function(XMLHttpRequestObject)} [completedFunction] The function which will be called when the HTTP call is completed. (readyState==4)
 * @param {Function(XMLHttpRequestObject)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4. Might be called several times before the call is completed.
 * @return {XMLHttpRequestObject} The newly created XMLHttpRequest object for this specific AJAX call.
 */
aV.AJAX.makeRequest=function(method, address, parameters, completedFunction, loadingFunction)
{
	var triggerFunction=function (requestObject) //define the custom changeFunction as triggerFunction
	{
		if (requestObject.readyState == 4 && completedFunction) //if the request is finished and there is a  completedFunction assigned
			completedFunction(requestObject); //call the completedFunction sending the requestObject as its parameter
		else if (loadingFunction) //if request is in progress and there is an assigned loadingFunction
			loadingFunction(requestObject); //call the loadingFunction passing the requestObject as its parameter
	}; //finished defining the custom changeFunction
	//checking parameters
	if (!parameters)
		parameters='';
	if (parameters.constructor==Object)
		parameters=parameters.toQueryString();
	
	if (method.toUpperCase()=="GET") //if requested method is GET, then call the aV.AJAX.makeGetRequest function
		return this.makeGetRequest(address + ((parameters)?'?' + parameters:''), triggerFunction);
	else if (method.toUpperCase()=="POST") //else if requested method is POST, then call the aV.AJAX.makePostRequest function
		return this.makePostRequest(address, parameters, triggerFunction);
	else //if requested method is invalid, return false
		return false;
};

/**
 * Tries to extract the mime-type from the requestObjects "Content-type" header.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {String} The extracted mime type or 'text/plain' as default.
 */
aV.AJAX.getMimeType=function(requestObject)
{
	var responseMimeType=("getResponseHeader" in requestObject)?requestObject.getResponseHeader("Content-Type"):'text/plain';
	return responseMimeType.substring(0, (responseMimeType.indexOf(';') + responseMimeType.length + 1) % (responseMimeType.length + 1)).toLowerCase();	
};

/**
 * Tries to extract the encoding from the requestObjects "Content-type" header.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {String} The extracted encoding or 'utf-8' as default.
 */
aV.AJAX.getEncoding=function(requestObject)
{
	var result=requestObject.getResponseHeader("Content-Type").match(/charset=(.+)/i);
	return (result)?result[1].toLowerCase():'utf-8';	
};

/**
 * Checks the given requestObject for successfull return by means of HTTP status, non-empty responseText and if given mime-type.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @param {String} [mimeType] The mime-type which will be checked on.
 * @return {Boolean} Returns true if all the conditions are staisfied for a successfull response, false otherwise.
 */
aV.AJAX.isResponseOK=function(requestObject, mimeType)
{
	var result=(requestObject.status==200 && requestObject.responseText);
	if (mimeType && result) 
	{
		if (!(mimeType instanceof Array))
			mimeType=[mimeType];
		result = (mimeType.indexOf(aV.AJAX.getMimeType(requestObject)) > -1);
	}
	return result;
};

/**
 * AUto parses the given requestObject's data using the dataParsers available in the config according to the response's mime-type.
 * 
 * @param {XMLHttpRequestObject} requestObject The request object which contains the data.
 * @return {Object} The native JAvaScript object which is parsed via the appropriate data parser.
 */
aV.AJAX.getResponseAsObject=function(requestObject)
{
	var mimeType=aV.AJAX.getMimeType(requestObject);
	return aV.config.AJAX.dataParsers[(mimeType in aV.config.AJAX.dataParsers)?mimeType:'application/json'](requestObject);
};

/**
 * Loads content to the given container element using an asynchronous HTTP GET call.
 * If the aV.config.AJAX.loadingText is defined, target container element's innerHTML is filled with its valye while the content is loading.
 *
 * @param {String} address The URL of the content which will be loaded dynamically into the given container.
 * @param {String|Object} element The container element itself or its id, which the dynamic content will be loaded into.
 * @param {Function(Object, String)} [completedFunction] The function which will be called when the loading of the content is finished. It is called with the target container element and the URL as parameters.
 * @param {Function(Object, String)} [loadingFunction] The function which will be called EVERYTIME when an onreadystatechange event is occured with a readyState different than 4 while loading the dynamic content. It is called with the target container element and the URL as parameters.
 * @return {XMLHttpRequestObject} The created XMLHttoRequestObject.
 */
aV.AJAX.loadContent=function(address, element, completedFunction, loadingFunction)
{
	var crossDomain=aV.AJAX.isCrossDomain(address);
	if (typeof(element)=='string') //if id of the object is given instead of the object itself
		element=document.getElementById(element); //assign the element the object corresponding to the given id
	var triggerFunction = function(requestObject) //define the custom changeFunction
	{
		if (requestObject.readyState == 4) //if the request is finished
		{
			element.innerHTML=requestObject.responseText; //fill the element's innerHTML with the returning data
			if (completedFunction) //if a callback function assigned to *callbackFunc*
				completedFunction(element, address); //call it with the element object and the given URL as its parameters
		}
		else
		{
			if (loadingFunction) //if a custom loadingFunction is assigned
				loadingFunction(element, address); //call it with the element object and the given URL as its parameters
			else if (aV.config.AJAX.loadingText)
				element.innerHTML=aV.config.AJAX.loadingText; //set the given element's innerHTML the loading text to inform the user
		}
	};
	return this.makeGetRequest(address, triggerFunction, crossDomain); //make the GET request and return the used XMLHttpRequest object
};

/**
 * Loads an external style-sheet or Javascript file on-demand.
 * Removes the old node if a resourceId is given.
 * 
 * @param {String} address The address of the resource-to-be-loaded.
 * @param {String} [type="js"] The type of the resource. Should be either js or css.
 * @param {String} [resourceId]	The id which will be assigned to newly created DOM node. If not given, no id is assigned to the created node.
 * @param {Boolean} [forceRefresh=false] Addes a "?time" value at the end of the file URL to force the browser reload the file and not to use cache.
 * @return {HTMLElementObject} The newly added script or link DOM node.
 */
aV.AJAX.loadResource=function(address, type, resourceId, forceRefresh)
{
	if (!type)
		type="js";
	if (forceRefresh)
		address+="?" + Date.parse(new Date());
	var attr, newNode;
	var head=document.getElementsByTagName("head")[0];
	if (type=="js")
	{
		newNode=document.createElement("script");
		newNode.type="text/javascript";
		attr="src";
	}
	else if (type=="css")
	{
		newNode=document.createElement("link");
		newNode.type="text/css";
		newNode.rel="stylesheet";
		attr="href";
	}
	if (resourceId)
	{
		old=document.getElementById(resourceId);
		if (old) old.parentNode.removeChild(old);
		delete old;
		newNode.id=resourceId;
	}
	newNode[attr]=address;
	return head.appendChild(newNode);
};

/**
 * @ignore
 * @param {Object} address
 * @param {Object} parameters
 * @param {Object} element
 * @param {Object} incremental
 * @param {Object} completedFunction
 * @param {Object} loadingFunction
 */
aV.AJAX.loadSelectOptions=function(address, parameters, element, incremental, completedFunction, loadingFunction)
{
	
};

/**
 * Sends the form data using AJAX when the form's onSubmit event is triggered.
 * 
 * @ignore
 * @param {Object} event
 * @return {Boolean} Returns always false to prevent "real" submission.
 */
aV.AJAX.sendForm=function(event)
{
	var form=event.target;
/*
	if (checkRequiredFormElements)
		if (!checkRequiredFormElements(form))
		return false;
*/	
	var params={};
	for (var i = 0; i < form.elements.length; i++) 
	{
		if (form.elements[i].type=='submit' || form.elements[i].value=='' || ((form.elements[i].type=='checkbox' || form.elements[i].type=='radio') && form.elements[i].checked==false))
			continue;
		params[form.elements[i].name] = form.elements[i].value;
		form.elements[i].oldDisabled=form.elements[i].disabled;
		form.elements[i].disabled=true;
	}
	
	var completedFunction=function(requestObject)
	{
		for (var i = 0; i < form.elements.length; i++) 
			form.elements[i].disabled=form.elements[i].oldDisabled;
		if (form.callback)
			form.callback(requestObject);
	};
	
	aV.AJAX.makeRequest(form.method, form.action, params, completedFunction);
	return false;
};

/**
 * @ignore
 */
aV.AJAX.activeRequestCount=0;

/**
 * @ignore
 */
aV.AJAX._crossDomainRequestLastGuid=1;

/**
 * @ignore
 */
aV.AJAX.headerTranslations=
{
	'content-type': 'enctype',
	'accept-charset': 'acceptCharset',
	'accept-language': 'lang'
};

/**
 * Introduces some useful functions for XML parsing, which are returned by the XMLHttpRequest objects's responseXML property.
 * @namespace
 */
aV.AJAX.XML = {};

/**
 * Tries to extract the node value whose name is given with nodeName and is contained by mainItem node. Returns the defaultVal if any error occurs.
 *
 * @param {Object} mainItem The main node item which holds the sub nodes and their values.
 * @param {String} nodeName Name of the sub node whose value will be extracted from the mainItem.
 * @param {String} [defaultVal] The default value which will be returned if the sub node whose name is given in nodeName is not found.
 * @return {String} The value of the node whose name is given with nodeName and which is contained by mainItem node.
 */
aV.AJAX.XML.getValue=function(mainItem, nodeName, defaultVal)
{
	defaultVal=(defaultVal) ? defaultVal : "";
	var val;
	try
	{
		val=mainItem.getElementsByTagName(nodeName)[0].firstChild.nodeValue;
		val=(val!=undefined) ? val : defaultVal;
	}
	catch(error)
	{
		val=defaultVal;
	}
	finally
	{
		return val;
	}
};

/**
 * Tries to set the node value whose name is given with nodeName and is contained by mainItem node. Returns false if any error occurs.
 *
 * @param {Object} mainItem The main node item which holds the sub nodes and their values.
 * @param {String} nodeName Name of the sub node whose value will be set.
 * @param {String} val The new value of the sub node whose name is given in nodeName.
 * @return {String} The value set by the function is returned. If an error occures, the function returns false.
 */
aV.AJAX.XML.setValue=function(mainItem, nodeName, val)
{
	try
	{
		mainItem.getElementsByTagName(nodeName)[0].firstChild.nodeValue=val;
		return val;
	}
	catch(error)
	{
		return false;
	}
};

/**
 * Converts an element/node collection, which acts as an array usually, to an actual array and returns it, which allows developers to use array-spesific functions.
 *
 * @param {HTMLCollectionObject} collection The collection which will be converted to array.
 * @return {HTMLElementObject[]} The array version of the given collection.
 */
aV.AJAX.XML.toArray=function(collection)
{
	var result = new Array();
	for (i = 0; i < collection.length; i++)
		result.push(collection[i]);
	return result;
};

/**
 * Parses an XML tree to a native JavaScript object recursively.
 * 
 * @param {Object} source The XML node which will be converted to JavaScript object.
 * @param {Boolean} [includeRoot=false] Set true to include the main top node, a.k.a the node supplied, in the parsed object.
 * @return {Object} The JavaScript object correspondence of the supplied XML node.
 */
aV.AJAX.XML.toObject=function(source, includeRoot)
{
	var result={};
	if (source.nodeType==9)
		source=source.firstChild;
	if (!includeRoot)
		source=source.firstChild;

	while (source) 
	{
		if (source.childNodes.length) 
		{
			if (source.tagName in result) 
			{
				if (result[source.tagName].constructor != Array) 
					result[source.tagName] = [result[source.tagName]];
				result[source.tagName].push(aV.AJAX.XML.toObject(source));
			}
			else 
				result[source.tagName] = aV.AJAX.XML.toObject(source);
		}
		else if (source.tagName)
			result[source.tagName] = source.nodeValue;
		else
			result = source.nodeValue;
		source = source.nextSibling;
	}

	return result;
};

/**
 * @ignore
 */
window.onbeforeunload=aV.AJAX.checkActiveRequests;