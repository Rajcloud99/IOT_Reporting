const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const dateUtil = require('../utils/dateutils');

function Notification(oNotif) {
	this.imei = oNotif.imei;
	//TODO restrict field later and put validations
}

const allowedFieldsForCreate = ['mobiles', 'emails', 'nid', 'type', 'imei', 'datetime', 'message', 'priority', 'user_id', 'vehicle_no'];
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
Notification.saveNotification = function (request, callback) {
	request.nid = "n_" + Date.now();
	request.datetime = Date.now();
	const oRet = prepareCreateQuery(request);
	const query = 'INSERT INTO ' + database.table_notification + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Notification.saveNotification', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
Notification.getNotification = function (request, callback) {
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
	let query = 'SELECT * FROM ' + database.table_notification + ' WHERE user_id = ? ';
	const aParams = [request.selected_uid || request.login_uid];
	request.start_date = request.start_date || request.start_time;
	request.end_date = request.end_date || request.end_time;
	if (request.start_date && request.end_date) {
		query = query + "AND datetime>= ? AND datetime <=? ";
		aParams.push(new Date(request.start_date));
		aParams.push(new Date(request.end_date));
	} else if (request.start_date) {
		query = query + "AND datetime>= ? AND datetime <=? ";
		aParams.push(new Date(request.start_date));
		var tempEnd = new Date(request.start_date);
		tempEnd.setHours(23);
		tempEnd.setMinutes(59);
		tempEnd.setSeconds(59);
        aParams.push(tempEnd);
	} else if (request.end_date) {
		query = query + "AND datetime>= ? AND datetime<= ? ";
		var tempStart = new Date(request.end_date);
        tempStart.setHours(0);
        tempStart.setMinutes(0);
        tempStart.setSeconds(0);
        aParams.push(tempStart);
		aParams.push(new Date(request.end_date));
	}
	if (request.type) {
		query = query + 'AND type=? ';
		aParams.push(request.type);
	}
	if (request.imei) {
		query = query + "AND imei=? ";
		aParams.push(parseInt(request.imei));
	}
	if (request.type || request.imei) {
		query = query + " ALLOW FILTERING";
	}
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('Notification.getNotification', err);
			callback(err);
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
			trimGeofences(oRes.data, request);
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}
		callback(err, oRes);

	});
};

function trimGeofences(notifs, request) {
	let aIMEIs = request.device_id;
	for (let i = 0; i < notifs.length; i++) {
		if(aIMEIs && (aIMEIs.indexOf(parseInt(notifs[i].imei)) !== -1 || aIMEIs.indexOf(notifs[i].imei.toString()) !== -1)){
			//don't
		}else if ((notifs[i].type !== 'geofence') || (notifs[i].type === 'geofence' && request.notrim)) {
			//don't ignore minor geofences for notification purpose
		}else {
            notifs.splice(i--, 1);
        }
	}

    for (let i = 0; i < notifs.length; i++) {
        if (notifs[i].type === 'geofence' && request.notrim) {
            //don't ignore minor geofences for notification purpose
        }else if (notifs[i].type === 'geofence' && notifs[i].entry && notifs[i].exit && (dateUtil.getSecs(notifs[i].exit.datetime) - dateUtil.getSecs(notifs[i].entry.datetime) < 6 * 60)) {
            notifs.splice(i--, 1);
        }
    }
}


module.exports = Notification;
