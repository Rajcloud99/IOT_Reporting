const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const geozoneCalculator = require('../services/geozoneCalculator');
const dateUtil = require('../utils/dateutils');

function Gps(oDevice) {
    this.device_id = oDevice.device_id;
    this.lat = oDevice.latitude;
    this.lng = oDevice.longitude;
    this.latitude = oDevice.latitude;
    this.longitude = oDevice.longitude;
    this.speed = oDevice.speed;
    this.datetime = oDevice.datetime;
    this.status = oDevice.status;
    this.course = oDevice.course;
    this.mcc = oDevice.mcc;
    this.mnc = oDevice.mnc;
    this.gps_tracking = oDevice.gps_tracking;
    this.ignition = oDevice.ignition;
}

Gps.getImei = function (reg_no, callback) {
    const query = 'select imei from ' + database.table_device_inventory + ' where reg_no = \'' + reg_no + '\'';
    cassandraDbInstance.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getImei', err);
            callback(err);
            return;
        }
        if (result.rows === undefined || result.rows.length === 0) return callback('no data');
        const row = result.rows[0];
        callback(err, row.imei);
    });
};

// Only one device is allowed
Gps.getCurrentLocation = function (deviceid, callback) {
    const query = 'SELECT imei, positioning_time, lat, lng, speed, course, status, address, reg_no FROM ' + database.table_device_inventory + ' WHERE imei = ' + deviceid;
    cassandraDbInstance.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getCurrentLocation', err);
            callback(err);
            return;
        }
        if (result.rows === undefined || result.rows.length === 0) return callback('no data');
        const row = result.rows[0];
        const res = {
            device_id: row.imei,
            datetime: row.positioning_time,
            lat: row.lat,
            lng: row.lng,
            speed: row.speed,
            course: row.course,
            status: row.status,
            addr: row.address
        };
        callback(err, res);
    });
};

Gps.getCurrentLocationFromRegNo = function (reg_no, callback) {
    const query = 'SELECT  imei, reg_no, lat, lng, speed, course, acc_high, location_time, positioning_time, address FROM ' + database.table_device_inventory + ' WHERE reg_no = \'' + reg_no + '\'';
    // winston.info(query);
    cassandraDbInstance.execute(query, [], function (err, result) {
        if (err) {
            winston.error('Device.getLocationForTime', err);
            callback(err);
            return;
        }
        if (result && result.rows && result.rows.length === 0) {
            callback('no data found');
            return;
        }
        if (result && result.rows) {
            callback(err, result.rows[0]);
        }

    });
};

Gps.getCurrentLocationsFromImei = function (deviceid, callback) {
    let query;
    if (deviceid instanceof Array) {
        query = 'SELECT imei, positioning_time, lat, lng, speed, course, status, reg_no, address FROM ' + database.table_device_inventory + ' WHERE imei IN (' + deviceid.join(', ') + ')';
    } else {
        query = 'SELECT imei, positioning_time, lat, lng, speed, course, status, reg_no, address FROM ' + database.table_device_inventory + ' WHERE imei = ' + deviceid;
    }
    cassandraDbInstance.execute(query, [], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getCurrentLocation', err);
            callback(err);
            return;
        }
        if (result.rows === undefined || result.rows.length === 0) return callback(new Error('no data'));
        const res = [];
        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows[i];
            res.push({
                device_id: row.imei,
                datetime: row.positioning_time,
                lat: row.lat,
                lng: row.lng,
                speed: row.speed,
                course: row.course,
                status: row.status,
                address: row.address,
                reg_no: row.reg_no
            });
        }
        callback(err, res);
    });
};

Gps.getGPSDataBetweenTime = function (deviceid, starttime, endtime, callback) {
    let query;
    if (deviceid instanceof Array) {
        query = 'SELECT device_id, datetime, latitude, longitude, speed, course,gps_tracking,ignition FROM ' + database.table_gps_data + ' WHERE device_id IN (' + deviceid.join(', ') + ') AND datetime >= ' + new Date(starttime).getTime() + ' AND datetime <= ' + new Date(endtime).getTime();
    } else {
        query = 'SELECT datetime, latitude, longitude, speed, course,gps_tracking,ignition FROM ' + database.table_gps_data + ' WHERE device_id = ' + deviceid + ' AND datetime >= ' + new Date(starttime).getTime() + ' AND datetime <= ' + new Date(endtime).getTime() + ' ORDER BY datetime ASC ALLOW FILTERING';
    }
    const options = {prepare: true, fetchSize: 1000};
    let gpsData = [];
    cassandraDbInstance.eachRow(query, [], options, function (n, row) {
        gpsData.push(new Gps(row));
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getGPSDataBetweenTime ', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        } else {
            calculateSpeedFromRaw(gpsData);
            callback(err, gpsData);
        }
    });
};

Gps.getIdleData = function (request, callback) {
    let query;
    if (request.device_id instanceof Array) {
        query = 'SELECT device_id, datetime, latitude, longitude, speed, course,gps_tracking FROM ' + database.table_gps_data + ' WHERE device_id IN (' + request.device_id.join(', ') + ') AND ignition = 1 AND speed = 0 AND datetime >= ' + new Date(request.start_time).getTime() + ' AND datetime <= ' + new Date(request.end_time).getTime() + ' ALLOW FILTERING';
    } else {
        query = 'SELECT datetime, latitude, longitude, speed, course,gps_tracking FROM ' + database.table_gps_data + ' WHERE device_id = ' + request.device_id + 'AND ignition = 1 AND speed = 0 AND datetime >= ' + new Date(request.start_time).getTime() + ' AND datetime <= ' + new Date(request.end_time).getTime() + ' ORDER BY datetime ASC ALLOW FILTERING';
    }
    const options = {prepare: true, fetchSize: 1000};
    let gpsData = [];
    cassandraDbInstance.eachRow(query, [], options, function (n, row) {
        gpsData.push(new Gps(row));
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getIdleData ', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        } else {
            callback(err, gpsData);
        }
    });
};

Gps.getGPSDataBetweenTimeForSpeed = function (req, callback) {
    let query;
    if (req.device_id instanceof Array) {
        query = 'SELECT device_id, datetime, latitude, longitude, speed FROM ' + database.table_gps_data + ' WHERE device_id IN (' + req.device_id.join(', ') + ') AND datetime >= ' + new Date(req.start_time).getTime() + ' AND datetime <= ' + new Date(req.end_time).getTime();
    } else {
        query = 'SELECT device_id, datetime, latitude, longitude, speed FROM ' + database.table_gps_data + ' WHERE device_id = ' + req.device_id + 'AND datetime >= ' + new Date(req.start_time).getTime() + ' AND datetime <= ' + new Date(req.end_time).getTime() + ' ALLOW FILTERING';
    }
    if (req.speed_limit) {
        query = query + 'AND speed >' + req.speed_limit + ' ALLOW FILTERING';
    }
    const options = {prepare: true, fetchSize: 1000};
    let gpsData = [];
    cassandraDbInstance.eachRow(query, [], options, function (n, row) {
        gpsData.push(new Gps(row));
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getGPSDataBetweenTime', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        } else {
            callback(err, gpsData);
        }
    });
};
Gps.getAac = function (deviceid, starttime, endtime, callback) {
    const query = 'SELECT datetime, acc_high, alarm_phone, alarm_terminal, charge_on, defense_activated, gps_tracking, gsm_signal_str, language, oil_power_dc, voltage FROM ' + database.table_heartbeat + ' WHERE imei = ' + deviceid + 'AND datetime >= ' + new Date(starttime).getTime() + ' AND datetime <= ' + new Date(endtime).getTime() + ' ORDER BY datetime';
    cassandraDbInstance.execute(query, [], function (err, result) {
        if (err) {
            winston.error('Gps.getAac', err);
            callback(err);
            return;
        }
        const res = result.rows;
        callback(err, res);
    });
};

Gps.getAllDeviceIds = function (callback) {
    const query = 'SELECT DISTINCT device_id FROM ' + database.table_gps_data;
    cassandraDbInstance.execute(query, [], function (err, result) {
        if (err) {
            winston.error('Gps.getAllDeviceIds', err);
            callback(err);
            return;
        }
        const dataArray = [];
        for (let i = 0; i < result.rows.length; i++) {
            const data = {
                device_id: result.rows[i].device_id
            };
            dataArray.push(data);
        }
        callback(err, dataArray);
    });
};

Gps.insertGPSData = function (data) {
    const query = 'INSERT INTO ' + database.table_gps_data + ' (device_id, satellites, latitude, longitude, speed, real_time, gps_tracking, course, mcc, mnc, lac, cid, datetime, inserted) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    cassandraDbInstance.execute(query, [data.device_id,
            data.satellites,
            data.latitude,
            data.longitude,
            data.speed,
            data.real_time,
            data.gps_tracking,
            data.course,
            data.mcc,
            data.mnc,
            data.lac,
            data.cid,
            data.datetime.getTime(),
            data.inserted.getTime()
        ], {
            prepare: true
        },
        function (err, result) {
            if (err) {
                winston.error('Gps.insertGPSData', err);
                return;
            }
            // winston.info('data Added');
        });
};

Gps.getDeviceIp = function (imei, callback) {
    // winston.info('imei:', imei);
    const query = 'SELECT ip FROM ' + database.table_device_inventory + ' WHERE imei = ?';
    cassandraDbInstance.execute(query, [imei], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('Gps.getDeviceIp', err);
            return callback(err);
        }
        if (!result.rows[0]) {
            return callback(null);
        }
        return callback(err, result.rows[0]);
    });
};

Gps.dailyData = function (request, callback) {
    let query;
    if (request.device_id instanceof Array) {
        query = 'select * from ' + database.table_adas_daily + ' where imei IN(' + request.device_id.join(', ') + ') AND date >= ? AND date <= ? ALLOW FILTERING';
    } else {
        query = 'select * from ' + database.table_adas_daily + ' where imei = ' + request.device_id + 'AND date >= ? AND date <= ? ALLOW FILTERING';
    }
    const aParams = [dateUtil.getYYYYMMDD(request.start_time), dateUtil.getYYYYMMDD(request.end_time)]
    const options = {prepare: true, fetchSize: 1000};
    let dailyData = [];
    cassandraDbInstance.eachRow(query, aParams, options, function (n, row) {
        dailyData.push(row);
    }, function (err, result) {
        if (err) {
            winston.error('Gps.dailyData', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        } else {
            callback(err, dailyData);
        }
    });
};
Gps.beatCache = function (request, callback) {
    let query;
    let aParams = [request.start_time, request.end_time];
    if (request.device_id instanceof Array && request.device_id.length) {
        query = 'select * from report_beat where imei IN(' + request.device_id.join(', ') + ') AND start_time >= ? AND start_time <= ? ALLOW FILTERING';
    } else if(request.device_id && request.device_id.length) {
        query = 'select * from report_beat where imei = ' + request.device_id + 'AND start_time >= ? AND start_time <= ? ALLOW FILTERING';
    }else{
        query = 'select * from report_beat where parent CONTAINS ? AND start_time >= ? AND start_time <= ? ALLOW FILTERING';
        aParams = [request.selected_uid || request.login_uid,request.start_time, request.end_time];
    }
   console.log(query);
   console.log(aParams);
    const options = {prepare: true, fetchSize: 1000};
    let beatData = [];
    cassandraDbInstance.eachRow(query, aParams, options, function (n, row) {
        beatData.push(row);
    }, function (err, result) {
        if (err) {
            winston.error('Gps.beatCache', err);
            callback(err);
            return;
        }
        if (result.nextPage) {
            result.nextPage();
        } else {
            callback(err, beatData);
        }
    });
};

function calculateSpeedFromRaw(data, request) {
    let duration = 0, speed = 0, distance = 0,lastCumDist=0;
    let bNeedForSpped = true;
    let countExtra;
    for (let i = 1; i < data.length; i++) {
        if (bNeedForSpped && data[i].speed > 0) bNeedForSpped = false;
        duration = data[i].datetime - data[i - 1].datetime;//msec
        duration = duration / 1000; //sec
        if(data[i].speed > 65){
            //console.log(data[i].speed);
        }
        if (data[i - 1].latitude && data[i - 1].longitude && data[i].latitude && data[i].longitude) {
            distance = geozoneCalculator.getDistance({
                latitude: data[i - 1].latitude,
                longitude: data[i - 1].longitude
            }, {
                latitude: data[i].latitude,
                longitude: data[i].longitude
            });
        }

        if (distance > 0 && duration > 0) {
            speed = distance / duration * 3.6;
        }
        if (data[i].speed > 120) {
            data[i].speed = 70;
        }
        if (distance > 2000 && speed > 100) {
            if (countExtra && (i - countExtra) == 1) {//2 consecutive point has anomoly then remove mid one
                data.splice(i - 1, 1);
                i--;
            } else {
                countExtra = i;
            }
        }
    }
};
module.exports = Gps;
