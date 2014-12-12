/**
 * @fileOverview A library for the footer update system in NumilFikirFabrikası Application
 * @name Footer Info Updater Library
 *
 * @author Burak Yigit KAYA	<byk@amplio-vita.net>
 * @version 1.0
 */

if (!window.nff)
	throw new Error("NFF namespace cannot be found.", "nff.updater.js");
	
nff.updater={}

nff.config.updater=
{
	updateInterval: 60000,
	updateInfoPath: 'http://www.numilfikirfabrikasi.com/admin/nff-desktop.asp',
	compareOrder: ['days', 'hours', 'minutes'],
	texts:
	{
		untilEnd: 'Dönemin bitmesine',
		untilStart: 'Sonraki döneme',
		days: 'gün',
		hours: 'saat',
		minutes: 'dakika',
		remainingFormat: '%s <strong>%s %s</strong> kaldı.',
		totalEntries: 'Toplam <strong>%s</strong> fikir kaydedildi.'
	}
};

nff.updater.variables = 
{
	countDownDate: '',
	type: 'End',
	ideaCount: 0
};

nff.updater.refreshVariables=function()
{
	var completedFunction=function(requestObject)
	{
		if (!aV.AJAX.isResponseOK(requestObject, 'application/json'))
			return false;
		nff.updater.variables=aV.AJAX.getResponseAsObject(requestObject);
		nff.updater.printVariables();
	};
	aV.AJAX.makeRequest("GET", nff.config.updater.updateInfoPath, '', completedFunction);
};

nff.updater.printVariables=function()
{
	var text;
	var untilDate=Date.parseIso8601(nff.updater.variables.countDownDate);
	var now=new Date();
	var remaining=0;
	
	for (var i=0; i<nff.config.updater.compareOrder.length && !remaining; i++)
		remaining=now.diff(untilDate, nff.config.updater.compareOrder[i]);
	text=nff.config.updater.texts.remainingFormat.format(nff.config.updater.texts['until' + nff.updater.variables.type], remaining, nff.config.updater.texts[nff.config.updater.compareOrder[i-1]]);
	text+="<br />";
	text+=nff.config.updater.texts.totalEntries.format(nff.updater.variables.ideaCount);
	nff.updater.infoElement.innerHTML=text;
};

nff.updater.startUpdater=function()
{
	if (!nff.updater.timerHandle)
		nff.updater.timerHandle=window.setInterval(nff.updater.refreshVariables, nff.config.updater.updateInterval);
};

nff.updater.stopUpdater=function()
{
	if (nff.updater.timerHandle)
		window.clearInterval(nff.updater.timerHandle);
};
