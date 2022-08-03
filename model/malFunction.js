/**
 * Created by Kamal on 25-10-2016.
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function Malfunction(oMalfunction) {
	this.imei = oMalfunction.imei;
	//TODO restrict field later and put validations
}

const allowedFieldsForUpdate = ['reason', 'remark', 'notice_date', 'device_type', 'last_modified', 'modified_by', 'device_name'];
const allowedFieldsForCreate = ['imei', 'reg_no', 'reason', 'remark', 'notice_date', 'device_type', 'user_id', 'device_name', 'created_at', 'last_modified', 'modified_by'];
const prepareCreateQuery = function (oMalfunction) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oMalfunction) {
		if (allowedFieldsForCreate.indexOf(key) > -1) {
			aParam.push(oMalfunction[key]);
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
const prepareUpdateQuery = function (oMalfunction) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oMalfunction) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oMalfunction[key]);
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
Malfunction.getMalfunction = function (request, callback) {
	request.user_id = request.selected_uid || request.login_uid;
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
	let query = 'SELECT * FROM ' + database.table_Malfunction + ' WHERE user_id = ? ';
	const aParams = [request.selected_uid || request.login_uid];
	if (request.start_date && request.end_date) {
		query = query + " AND created_at>= ? AND created_at <=? ";
		aParams.push(new Date(request.start_date));
		aParams.push(new Date(request.end_date));
	} else if (request.start_date) {
		query = query + " AND created_at>= ? ";
		aParams.push(new Date(request.start_date));
	} else if (request.end_date) {
		query = query + " AND created_at<= ? ";
		aParams.push(new Date(request.end_date));
	}
	if (request.imei) {
		query = query + " AND imei=? ";
		aParams.push(request.imei);
	}
	if (request.user_id) {
		query = query + " ALLOW FILTERING";
	}
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('Malfunction.getMalfunction', err);
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
Malfunction.updateMalfunction = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	request.last_modified = Date.now();
	request.last_modified_by = request.login_uid;
	const oQueryParam = prepareUpdateQuery(request);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.imei);
	aParam.push(request.selected_uid);
	aParam.push(request.created_at);
	sQuery = 'UPDATE ' + database.table_Malfunction + ' SET ' + sQuery + ' WHERE imei = ? AND user_id = ? AND created_at = ?';
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Malfunction.updateMalfunction', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, Malfunction);
	});
};

Malfunction.createMalfunction = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	// request.aid = request.name || "a" + "_" + Date.now();
	request.user_id = request.login_uid;
	request.created_at = Date.now();
	request.last_modified = Date.now();
	const oRet = prepareCreateQuery(request);
	const query = 'INSERT INTO ' + database.table_Malfunction + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
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
Malfunction.removeMalfunction = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const query = 'DELETE FROM ' + database.table_Malfunction + ' WHERE user_id = ?  AND created_at = ?';

	cassandraDbInstance.execute(query, [request.selected_uid, request.created_at], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Malfunction.updateMalfunction', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
module.exports = Malfunction;
