/**
 * @fileOverview Main function repository for NumilFikirFabrikasi Application
 * @name NFF Main Library
 *
 * @author Burak Yigit KAYA	<byk@amplio-vita.net>
 * @version 1.1
 */

nff = {};

nff.config =
{
	paths:
	{
		database: 'nff.db',
		images:
		{
			pin: 'images/down_pin.png',
			pinHover: 'images/up_pin.png',
			close: 'images/close.png',
			closeHover: 'images/hover_close.png',
			buttonNext: 'images/next.png',
			buttonNextHover: 'images/hover_next.png',
			buttonBack: 'images/back.png',
			buttonBackHover: 'images/hover_back.png',
			buttonSave: 'images/save.png',
			buttonSaveHover: 'images/hover_save.png',
			buttonDelete: 'images/delete.png',
			buttonDeleteHover: 'images/hover_delete.png',
			buttonNew: 'images/new.png',
			buttonNewHover: 'images/hover_new.png'
		}
	},
	ids:
	{
		pin: 'pin',
		close: 'close',
		buttonNext: 'buttonNext',
		buttonBack: 'buttonBack',
		buttonSave: 'buttonSave',
		buttonDelete: 'buttonDelete',
		buttonNew: 'buttonNew',
		localNoteCounter: 'localNoteCounter',
		noteArea: 'note'
	},
	texts:
	{
		localNoteCounter: '%s/%s',
		deleteConfirmation: 'Bu notu silmek istediğinizden emin misiniz?',
	},
	trayMenu:
	[
		{
			text: 'Göster/Gizle',
			click: function(event)
			{
				window.nativeWindow.visible=!window.nativeWindow.visible;
			}
		},
		{
			text: 'Fikir Fabrikas!',
			click: function(event)
			{
				air.navigateToURL(new air.URLRequest('http://www.numilfikirfabrikasi.com'));
			}
		},
		{
			text: 'Çıkış',
			click: function(event, autoSave)
			{
				nff.saveSettings();
				if (autoSave!==false)
					nff.saveNote();
				air.NativeApplication.nativeApplication.icon.bitmaps = []; 
				air.NativeApplication.nativeApplication.exit();
			}
		}
	],
	settings:
	{
		width: 206,
		height: 263,
		left: air.Capabilities.screenResolutionX - 206,
		top: 0,
		activeNoteIndex: 0
	}
};

nff.initialize = function()
{
	window.htmlLoader.navigateInSystemBrowser = true;
	nff.initTrayIcon();

	nff.dbObject = new aV.air.database(air.File.applicationStorageDirectory.resolvePath(nff.config.paths.database));
	
	nff.dbObject.assureTable('notes', 'id_note INTEGER PRIMARY KEY, title TEXT, content TEXT');
	nff.dbObject.assureTable('settings', 'name TEXT PRIMARY KEY, value TEXT');
	
	nff.initElements();	
	nff.initEffects();
	nff.assignEventHandlers();
	
	nff.loadSettings();
	nff.setSettings();
	nff.refreshNotes();
	
	window.nativeWindow.addEventListener('move', nff._windowMoveHandler);
	window.nativeWindow.addEventListener(air.Event.CLOSING, nff._windowCloseHandler);
	if (nff.updater) 
	{
		nff.updater.infoElement=document.getElementById('footer');
		nff.updater.refreshVariables();
		nff.updater.startUpdater();
	}
};

nff.initTrayIcon = function()
{
	air.NativeApplication.nativeApplication.autoExit = false;
	//initialize tray menu
	nff._trayMenu = new air.NativeMenu();
	
	var menuItem;
	for (var i = 0; i < nff.config.trayMenu.length; i++) 
	{
		menuItem = nff._trayMenu.addItem(new air.NativeMenuItem(nff.config.trayMenu[i].text));
		menuItem.addEventListener(air.Event.SELECT, nff.config.trayMenu[i].click);
	} 
	
	var iconLoader = new air.Loader();
	var iconLoadComplete = function(event) 
	{ 
		air.NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData]; 
	}
	if (air.NativeApplication.supportsSystemTrayIcon) { 
		iconLoader.contentLoaderInfo.addEventListener(air.Event.COMPLETE, iconLoadComplete); 
		iconLoader.load(new air.URLRequest("icons/16.png")); 
		air.NativeApplication.nativeApplication.icon.tooltip = document.title; 
		air.NativeApplication.nativeApplication.icon.menu = nff._trayMenu; 
		air.NativeApplication.nativeApplication.icon.addEventListener("click", nff.config.trayMenu[0].click);
	} 
	
	if (air.NativeApplication.supportsDockIcon) { 
		iconLoader.contentLoaderInfo.addEventListener(air.Event.COMPLETE,iconLoadComplete); 
		iconLoader.load(new air.URLRequest("icons/128.png")); 
		air.NativeApplication.nativeApplication.icon.menu = nff._trayMenu; 
	}
};

nff.initElements = function()
{
	nff.elements = {};
	for (var idendifier in nff.config.ids) 
		if (nff.config.ids.hasOwnProperty(idendifier)) 
		{
			nff.elements[idendifier] = document.getElementById(nff.config.ids[idendifier]);
			nff.elements[idendifier].nffId = idendifier;
		}
};

nff.initEffects = function()
{
	for (var element in nff.elements)
		if (nff.elements.hasOwnProperty(element) && nff.elements[element].tagName.toLowerCase()=='img')
		{
			nff.elements[element].addEventListener("mouseover", nff._imageSwaper);
			nff.elements[element].addEventListener("mouseout", nff._imageSwaper);
		}
};

nff.assignEventHandlers = function()
{
	nff.elements.buttonSave.addEventListener("click", nff.saveNote);
	nff.elements.buttonDelete.addEventListener("click", nff.deleteNote);
	nff.elements.buttonNew.addEventListener("click", nff.newNote);
	
	nff.elements.buttonNext.addEventListener("click", nff.incrementActiveNodeIndex);
	nff.elements.buttonBack.addEventListener("click", nff.incrementActiveNodeIndex);
	
	nff.elements.close.addEventListener("click", nff.config.trayMenu[2].click);
};

nff.loadSettings = function()
{
	var resultSet = nff.dbObject.execute('SELECT * FROM settings').data;
	if (!resultSet)
		return;
	for (var i=0; i<resultSet.length; i++)
		nff.config.settings[resultSet[i].name] = resultSet[i].value;
};

nff.saveSettings = function()
{
	nff.dbObject.execute('DELETE FROM settings');
	for (var setting in nff.config.settings)
		if (nff.config.settings.hasOwnProperty(setting))
			nff.dbObject.execute('INSERT INTO settings (name, value) VALUES ("%s", "%s")'.format(setting, nff.config.settings[setting]));
};

nff.setSettings = function()
{
	nativeWindow.x = nff.config.settings.left;
	nativeWindow.y = nff.config.settings.top;
};

nff._windowMoveHandler = function(event)
{
	nff.config.settings.left = nativeWindow.x;
	nff.config.settings.top = nativeWindow.y;
};

nff._windowCloseHandler = function(event)
{
	event.preventDefault();
	nff.saveSettings();
	window.nativeWindow.visible = false;
};

nff._imageSwaper = function(event)
{
	event.target.src = nff.config.paths.images[event.target.nffId + ((event.type=='mouseover')?'Hover':'')];
};

nff.refreshNotes = function()
{
	nff._notes = nff.dbObject.execute('SELECT id_note FROM notes ORDER BY id_note ASC').data;
	if (!nff._notes || nff._notes.length==0)
		nff.newNote();
	else
		nff.showNote(nff.config.settings.activeNoteIndex=nff.config.settings.activeNoteIndex%nff._notes.length);
};

nff.showNote = function(order)
{
	nff.elements.localNoteCounter.innerHTML = nff.config.texts.localNoteCounter.format(parseInt(order)+1, nff._notes.length);
	nff.elements.noteArea.value = unescape(nff.dbObject.execute('SELECT content FROM notes WHERE id_note = %s'.format(nff._notes[order].id_note)).data[0].content);
};

nff.saveNote = function(index)
{
	if (!nff._notes || !nff._notes.length)
		return;

	if (typeof index!='number')
		index=nff._notes[nff.config.settings.activeNoteIndex].id_note;
	nff.elements.noteArea.disabled = true;
	nff.dbObject.execute('UPDATE notes SET content="%s" WHERE id_note=%s'.format(escape(nff.elements.noteArea.value), index));
	nff.elements.noteArea.disabled = false;
	nff.refreshNotes();
};

nff.deleteNote = function(index)
{
	if (typeof index!='number')
		index=nff._notes[nff.config.settings.activeNoteIndex].id_note;
	if (!confirm(nff.config.texts.deleteConfirmation))
		return false;
	
	nff.elements.noteArea.disabled = true;
	nff.dbObject.execute('DELETE FROM notes WHERE id_note=%s'.format(index));
	nff.elements.noteArea.disabled = false;
	
	nff.refreshNotes();	
};

nff.newNote = function(autoSave)
{
	if (autoSave!==false)
		nff.saveNote();
	nff.dbObject.execute('INSERT INTO notes (content) VALUES ("")');
	nff.config.settings.activeNoteIndex = (nff._notes)?nff._notes.length:0;
	nff.refreshNotes();
};

nff.incrementActiveNodeIndex = function(event, autoSave)
{
	if (autoSave!==false)
		nff.saveNote();
	nff.config.settings.activeNoteIndex += parseInt(event.target.getAttribute("increment")) + nff._notes.length;
	nff.config.settings.activeNoteIndex %= nff._notes.length;
	nff.refreshNotes();
};

window.addEventListener('load', nff.initialize);