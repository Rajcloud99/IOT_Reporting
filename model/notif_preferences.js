/**
 * Created by Kamal on 21-09-2016.
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function Notif_pref(oNotif_pref) {
	this.imei = oNotif_pref.imei;
	//TODO restrict field later and put validations
}

const allowedFieldsForUpdate = ['low_battery', 'power_cut', 'geofence', 'over_speed', 'sos', 'blind_area_enter',
	'blind_area_exit', 'sim_card_change', 'user_id', 'last_modified', 'last_modified_by'];
const allowedFieldsForCreate = ['device_id', 'mobile_imei', 'low_battery', 'power_cut', 'geofence', 'over_speed', 'sos', 'blind_area_enter',
	'blind_area_exit', 'sim_card_change', 'user_id', 'last_modified', 'last_modified_by'];
const prepareCreateQuery = function (oNotif_pref) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oNotif_pref) {
		if (allowedFieldsForCreate.indexOf(key) > -1) {
			aParam.push(oNotif_pref[key]);
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
const prepareUpdateQuery = function (oNotif_pref) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oNotif_pref) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oNotif_pref[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key + "=?";
			} else {
				sQuery = key + "=?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.aParam = aParam;
	return oRet;
};
Notif_pref.getNotif_pref = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const oConfig = {
		prepare: 1
	};
	if (request.pageState) {
		oConfig.pageState = new Buffer(request.pageState);
	}
	if (request.row_count) {
		oConfig.fetchSize = request.row_count;
	} else { //default no of rows 30
		oConfig.fetchSize = 30;
	}
	const query = 'SELECT * FROM ' + database.table_notification_pref + ' WHERE device_id = ? AND mobile_imei= ? ';
	const aParams = [request.device_id, request.mobile_imei];
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('Notif_pref.getNotif_pref', err);
			callback(err);
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}
		callback(err, oRes);
	});
};
Notif_pref.updateNotif_pref = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	request.last_modified = Date.now();
	request.last_modified_by = request.selected_uid;
	const oQueryParam = prepareUpdateQuery(request);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.device_id);
	aParam.push(request.mobile_imei);
	sQuery = 'UPDATE ' + database.table_notification_pref + ' SET ' + sQuery + ' WHERE device_id = ? AND mobile_imei = ?';
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Notif_pref.updateNotif_pref', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, Notif_pref);
	});
};
Notif_pref.createNotif_pref = function (request, callback) {
	request.notifObject = request.data;
	request.notifObject.user_id = request.selected_uid || request.login_uid;
	request.notifObject.last_modified = Date.now();
	request.notifObject.last_modified_by = request.notifObject.user_id;
	request.notifObject.device_id = request.device_id;
	request.notifObject.mobile_imei = request.mobile_imei;
	const oRet = prepareCreateQuery(request.notifObject);
	const query = 'INSERT INTO ' + database.table_notification_pref + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error(err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
module.exports = Notif_pref;
