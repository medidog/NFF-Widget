/**
 * @fileOverview Elemental functions for Adobe AIR platform, database operations.
 * @name AIR-Database Library
 *
 * @author Burak Yigit KAYA	<byk@amplio-vita.net>
 * @version 1.1
 * @copyright &copy;2009 amplio-Vita under BSD Licence
 */

if (!window.aV) 
	aV = {config: {}};

if (!aV.air)
	aV.air = {};

aV.config.air = 
{
	SQL:
	{
		createTable: 'CREATE TABLE %s (%s)'
	}
};

aV.air.database = function(path, mode)
{
	this.path = path;

	if (!mode)
		mode = air.SQLMode.CREATE;
	this.mode = mode;
	
	this._connection = new air.SQLConnection();
	this._connection.open(path, mode);
	
	this._statement = new air.SQLStatement();
	this._statement.sqlConnection = this._connection;
};

aV.air.database.prototype.execute = function(SQLString)
{
	this._statement.text = SQLString;
	this._statement.execute();
	return this._statement.getResult();
};

aV.air.database.prototype.assureTable = function(tableName, fieldInfoSQL)
{
	try
	{
		this._connection.loadSchema(null, tableName);				
	}
	catch(error)
	{
		this.execute(aV.config.air.SQL.createTable.format(tableName, fieldInfoSQL));
	}
};
