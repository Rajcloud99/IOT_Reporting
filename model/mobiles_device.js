const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function MobileDevice(oDevice) {
	this.imei = oDevice.imei;
	this.fcm_key = oDevice.fcm_key;
	this.model = oDevice.model;
	this.os_v = oDevice.os_v;
	this.app_v = oDevice.app_v;
	this.last_modified = oDevice.last_modified;
}

const allowedFieldsForUpdate = ['fcm_key', 'model', 'os_v', 'app_v', 'last_modified', 'notification', 'user_id'];
const allowedFieldsForCreate = ['imei', 'fcm_key', 'model', 'os_v', 'app_v', 'last_modified', 'notification', 'user_id'];
const prepareCreateQuery = function (oAlarm) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oAlarm) {
		if (allowedFieldsForCreate.indexOf(key) > -1) {
			aParam.push(oAlarm[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key;
				sValues = sValues + ",?";
			} else {
				sQuery = key;
				sValues = "?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.sValues = sValues;
	oRet.aParam = aParam;
	return oRet;
};
MobileDevice.getDevice = function (request, callback) {
	const query = 'SELECT imei,notification,last_modified FROM ' + database.table_mobile_device + ' WHERE imei = ' + "'" + request.imei + "'";
	cassandraDbInstance.execute(query, [], {prepare: true}, function (err, result) {
		if (err) {
			winston.error('Mobile Device.getDevice', err);
			callback(err);
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows);
		}

	});
};
MobileDevice.getAllDevice = function (request, callback) {
	const query = 'SELECT fcm_key FROM ' + database.table_mobile_device;
	cassandraDbInstance.execute(query, [], {prepare: true}, function (err, result) {
		if (err) {
			winston.error('Mobile Device.getDevice', err);
			callback(err);
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows);
		}

	});
};
MobileDevice.registerDevice = function (device, callback) {
	device.last_modified = Date.now();
	const oRet = prepareCreateQuery(device);
	const query = 'INSERT INTO ' + database.table_mobile_device + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Mobile Device.registerDevice', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
module.exports = MobileDevice;
