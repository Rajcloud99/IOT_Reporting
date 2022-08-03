const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function SharedLocation(oNotif) {
	this.imei = oNotif.imei;
	//TODO restrict field later and put validations
}

const allowedFieldsForCreate = ['device_type', 'mobiles', 'emails', 'lid', 'user_id', 'vehicle_no', 'imei', 'start_time', 'end_time', 'created_at'];
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
SharedLocation.createSharedLocation = function (request, callback) {
	request.lid = "l_" + Date.now();
	request.user_id = request.selected_uid || request.login_uid;
	request.created_at = Date.now();
	const oRet = prepareCreateQuery(request);
	const query = 'INSERT INTO ' + database.table_shared_locations + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('SharedLocation.createSharedLocation', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
SharedLocation.getSharedLocation = function (request, callback) {
	const oConfig = {
		prepare: 1
	};
	const query = 'SELECT * FROM ' + database.table_shared_locations + ' WHERE lid = ? ';
	const aParams = [request.lid];
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('SharedLocation.getSharedLocation', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length > 0) {
			callback(err, result.rows[0]);
		}

	});
};
module.exports = SharedLocation;
