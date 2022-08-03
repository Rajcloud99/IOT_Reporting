const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function Alerts(oNotif) {
    this.imei = oNotif.imei;
    //TODO restrict field later and put validations
}

Alerts.getDeviceAlerts = function (request, callback) {
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
    let query = 'SELECT * FROM ' + database.table_device_alerts;
    const aParams = [];
    request.start_date = request.start_date || request.start_time;
    request.end_date = request.end_date || request.end_time;
    if(request.imeis){
        query = query + " where imei IN  ( "+request.imeis+" ) ";
    }
    if (request.start_date && request.end_date) {
        query = query + "AND datetime>= ? AND datetime <=? ";
        aParams.push(new Date(request.start_date));
        aParams.push(new Date(request.end_date));
    } else if (request.start_date) {
        query = query + "AND datetime>= ? ";
        aParams.push(new Date(request.start_date));
    } else if (request.end_date) {
        query = query + "AND datetime<= ? ";
        aParams.push(new Date(request.end_date));
    }
    if (request.code) {
        query = query + 'AND code=? ';
        aParams.push(request.code);
        query = query + " ALLOW FILTERING";
    }
    cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
        if (err) {
            winston.error('Alerts.getDeviceAlerts', err);
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
module.exports = Alerts;