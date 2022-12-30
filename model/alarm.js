/**
 * Created by Kamal on 07-05-2016.
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const crudUtil = require('../utils/crudutil');
const async = require('async');

function Alarm(oAlarm) {
	this.imei = oAlarm.imei;
	//TODO restrict field later and put validations
}

const allowedFieldsForUpdate = ['milestone', 'mobiles', 'trip_id', 'emails', 'created_by', 'description', 'driver_name', 'enabled',
	'end_time', 'geozone', 'gid', 'imei', 'name', 'over_speed', 'ptype', 'radius', 'start_time','loc','type','dest_id',
	'status', 'status_name', 'vehicle_no', 'entry', 'exit', 'in_status', 'out_status', 'halt_duration', 'category', 'entry_msg', 'exit_msg','schedules','custom_schedules'
];
const allowedFieldsForCreate = ['milestone', 'mobiles', 'trip_id', 'emails', 'aid', 'atype', 'created_at', 'created_by', 'description', 'driver_name',
	'enabled', 'end_time', 'geozone', 'gid', 'imei', 'name', 'over_speed', 'ptype', 'radius', 'category', 'entry_msg', 'exit_msg',
	'start_time', 'status', 'status_name', 'user_id', 'vehicle_no', 'entry', 'exit', 'in_status',
	'out_status', 'halt_duration','loc','type','schedules','dest_id'
];
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
const prepareUpdateQuery = function (oAlarm) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oAlarm) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oAlarm[key]);
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
Alarm.getAlarm = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const oConfig = {
		prepare: 1
	};
	if (request.pageState) {
		oConfig.pageState = new Buffer(request.pageState,'hex');
	}
	if (request.row_count) {
		oConfig.fetchSize = request.row_count;
	} else { //default no of rows 30
		oConfig.fetchSize = 30;
	}
	let query = 'SELECT * FROM ' + database.table_Alarm + ' WHERE user_id = ? ';
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
	if (request.atype) {
		query = query + ' AND atype=? ';
		aParams.push(request.atype);
	}
	if (request.imei) {
		query = query + " AND imei=? ";
		aParams.push(request.imei);
	}

	if (request.vehicle_no) {
		query = query + " AND vehicle_no=? ";
		aParams.push(request.vehicle_no);
	}

	if (request.gid) {
		query = query + " AND gid=? ";
		aParams.push(request.gid);
	}
	if (request.enabled === 0 || request.enabled === 1) {
		query = query + " AND enabled=? ";
		aParams.push(request.enabled);
	}
	if (request.public_link) {
		query = query + " AND public_link=? ";
		aParams.push(request.public_link);
	}
	if (request.atype || request.imei || request.vehicle_no || request.enabled || request.gid || request.public_link) {
		query = query + " ALLOW FILTERING";
	}
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('Alarm.getAlarm', err);
			callback(err);
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}else if(result.pageState){
			oRes.pageState =  new Buffer(result.pageState,'hex');
		}else{
			console.log('result',result);
		}
		callback(err, oRes);
	});
};
Alarm.updateAlarm = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	request.last_modified = Date.now();
	request.last_modified_by = request.login_uid;
	const oQueryParam = crudUtil.prepareUpdateQuery(request, allowedFieldsForUpdate);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.selected_uid);
	aParam.push(request.created_at);
	sQuery = 'UPDATE ' + database.table_Alarm + ' SET ' + sQuery + ' WHERE user_id = ? AND created_at = ?';
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Alarm.updateAlarm', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, Alarm);
	});
};

Alarm.createAlarm = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	request.aid = "a" + "_" + Date.now();
	request.user_id = request.selected_uid;
	request.created_at = Date.now();
	request.last_modified = Date.now();
	request.created_by = request.login_uid;
	request.enabled = 1;
	const oRet = prepareCreateQuery(request);
	const query = 'INSERT INTO ' + database.table_Alarm + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
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

Alarm.removeAlarm = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const query = 'DELETE FROM ' + database.table_Alarm + ' WHERE user_id = ?  AND created_at = ?';

	cassandraDbInstance.execute(query, [request.selected_uid, request.created_at], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Alarm.updateAlarm', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};

Alarm.updateBulkAlarms = function (aSchedules, callback) {
    const aQueries = [];
    for (let i = 0; i < aSchedules.length; i++) {
        var oReq = {
            user_id: aSchedules[i].user_id,
            created_at : aSchedules[i].alm_created_at,
            custom_schedules : aSchedules[i].schedules
        };
        const oQueryParam = crudUtil.prepareUpdateQuery(oReq, allowedFieldsForUpdate);
        oQueryParam.aParam.push(aSchedules[i].user_id);
        oQueryParam.aParam.push(aSchedules[i].alm_created_at);
        updateAlarm = 'UPDATE ' + database.table_Alarm + ' SET ' + oQueryParam.sQuery + ' WHERE user_id = ? AND created_at = ?';
        aQueries.push({
            query: updateAlarm,
            params: oQueryParam.aParam
        });
    }
    if (aQueries.length > 0) {
        cassandraDbInstance.batch(aQueries, {
            prepare: true
        }, function (err, result) {
            if (err) {
                callback(err, null);
                winston.error('GpsGaadi.associateGpsGaadiWithUser', err);
                return;
            }
            if (!result) {
                return callback(err, null);
            }
            return callback(err, aSchedules);
        });
    }else{
        return callback(err, request);
    }
};

Alarm.createBulkAlarms = function (request, callback) {
    const aQueries = [];
    for (let i = 0; i < request.geozones.length; i++) {
      request.aid = "a" + "_" + Date.now();
      request.name = request.geozones[i].name;
      request.created_at = request.geozones[i].created_at || Date.now();
      request.last_modified = Date.now();
      request.created_by = request.user_id;
      request.enabled = request.geozones[i].enabled || 1;
      request.atype = request.geozones[i].atype || 'geofence';
      request.ptype = request.geozones[i].ptype || 'circle';
      request.entry = request.geozones[i].entry;
      request.exit = request.geozones[i].exit;
      request.radius = request.geozones[i].radius || 1000;
      request.type = request.geozones[i].type;
      request.category = request.geozones[i].category || request.geozones[i].type;
      request.loc = request.geozones[i].loc;
      request.geozone = [{latitude:request.geozones[i].lat,longitude:request.geozones[i].lng}]
      const oRet = prepareCreateQuery(request);
      const createAlmQuery = 'INSERT INTO ' + database.table_Alarm + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
      aQueries.push({
            query: createAlmQuery,
            params: oRet.aParam
        });
    }
    if (aQueries.length > 0) {
        cassandraDbInstance.batch(aQueries, {
            prepare: true
        }, function (err, result) {
            if (err) {
                callback(err, null);
                winston.error('GpsGaadi.associateGpsGaadiWithUser', err);
                return;
            }
            if (!result) {
                return callback(err, null);
            }
            return callback(err, request);
        });
    }else{
        return callback(err, request);
    }
};

Alarm.removeAlarmsByTripId = function (tripId, callback) {
	const query = 'SELECT * FROM '+ database.table_Alarm +' WHERE trip_id = ? ALLOW FILTERING';
    cassandraDbInstance.execute(query, [tripId], {prepare:true}, function (err, result) {
        if (err) {
            winston.error('Alarm.removeAlarmsByTripId', tripId,err);
        	callback(err)
        }
        if (result && result.rows && result.rows.length>0) {
        	console.log('no of alarms to be removed for ',tripId,result.rows.length);
            async.each(result.rows,
                function (alarm, callback) {
                    let request = {selected_uid:alarm.user_id,created_at:alarm.created_at};
                    Alarm.removeAlarm(request,function(err,result){
                        if (err){callback(err)}
                    });
            }, function(err) {
                if (err) {callback(err)}
            });
        }
    });
};

module.exports = Alarm;
