/**
 * Created by Kamal on 03-01-2018.
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const crudUtil = require('../utils/crudutil');
function AlarmSchedule(oAlarm) {
    this.date = oAlarm.date;
    this.schedules = oAlarm.schedules;
    this.user_id = oAlarm.user_id;
    this.alm_created_at = oAlarm.alm_created_at;
    //TODO restrict field later and put validations
}

const allowedFieldsForUpdate = ['schedules'];
const allowedFieldsForCreate = ['user_id','schedules','alm_created_at','date'];
AlarmSchedule.getAlarmSchedule = function (request, callback) {
    request.selected_uid = request.selected_uid || request.login_uid || request.user_id;
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
    let query = 'SELECT * FROM ' + database.table_Alarm_schedule + ' WHERE user_id = ? AND alm_created_at = ?';
    const aParams = [request.selected_uid || request.login_uid,request.alm_created_at];
    if (request.date && request.end_date) {
        query = query + " AND date>= ? AND date <=? ";
        aParams.push(new Date(request.date));
        aParams.push(new Date(request.end_date));
    } else if (request.date) {
        query = query + " AND date>= ? ";
        aParams.push(new Date(request.date));
    } else if (request.end_date) {
        query = query + " AND date <= ? ";
        aParams.push(new Date(request.end_date));
    }
    query = query + " ALLOW FILTERING";
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
        }
        callback(err, oRes);
    });
};
AlarmSchedule.updateAlarmSchedule = function (request, callback) {
    request.selected_uid = request.selected_uid || request.login_uid;
    request.last_modified = Date.now();
    request._date = request.date;
    delete request.date;
    const oQueryParam = crudUtil.prepareUpdateQuery(request,allowedFieldsForUpdate);
    let sQuery = oQueryParam.sQuery;
    const aParam = oQueryParam.aParam;
    aParam.push(request.selected_uid);
    aParam.push(request._date);
    sQuery = 'UPDATE ' + database.table_Alarm_schedule + ' SET ' + sQuery + ' WHERE user_id = ? AND date = ?';
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
        return callback(err, request);
    });
};

AlarmSchedule.createAlarmSchedule = function (request, callback) {
    request.user_id = request.selected_uid || request.login_uid || request.user_id;
    request.last_modified = Date.now();
    const oRet = crudUtil.prepareCreateQuery(request, allowedFieldsForCreate);
    const query = 'INSERT INTO ' + database.table_Alarm_schedule + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
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
AlarmSchedule.removeAlarmSchedule = function (request, callback) {
    request.selected_uid = request.selected_uid || request.login_uid;
    const query = 'DELETE FROM ' + database.table_Alarm_schedule + ' WHERE user_id = ?  AND date = ?';

    cassandraDbInstance.execute(query, [request.selected_uid,request.date], {
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
AlarmSchedule.getAlarmScheduleByDate = function (date, callback) {
    const oConfig = {
        prepare: 1
    };
    let dt = new Date(date);
    dt.setHours(0);
    dt.setMinutes(0);
    dt.setSeconds(0);
    dt.setMilliseconds(0);
    let start = dt;
    let end = new Date(dt);
    end.setDate(start.getDate()+1);

    let query = 'SELECT * FROM ' + database.table_Alarm_schedule + ' WHERE date >= ? AND date  <= ? ';
    let aParams = [start,end];
    query = query + " ALLOW FILTERING";
    cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
        if (err) {
            winston.error('Alarm.getAlarm', err);
            callback(err);
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows);
        }
    });
};
module.exports = AlarmSchedule;
