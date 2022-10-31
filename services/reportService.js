const Gps = require('../model/gps');
const dateUtil = require('../utils/dateutils');
const limit = require('../config').limit;
const async = require('async');
const geolib = require('geolib');
exports.getMileageReportLMS = function (request, callback) {
    Gps.dailyData(request, function (err, res) {
        const response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        } else if (!res || res.length === 0) {
            response.message = 'location not found in DB for '+ request.device_id;
            return callback(response);
        } else {
            processMileageReportForLMS(request,res,callback);
        }
    });
};
exports.getMileageReport = function (request, callback) {
    Gps.dailyData(request, function (err, res) {
        const response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        } else if (!res || res.length === 0) {
            response.message = 'location not found in DB for ';
            response.data = res;
            return callback(null,response);
        } else {
            processMileageReport(request,res,callback);
        }
    });
};
exports.getOdometer = function (request, callback) {
    Gps.dailyData(request, function (err, res) {
        let response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        } else if (!res || res.length === 0) {
            response.message = 'location not found in DB for ';
            return callback(null,response);
        } else {
            response.status = 'OK';
            response.data = res;
            return callback(null,response);
        }
    });
};
exports.getDistOdo = function (request, callback) {
    Gps.getGPSDataBetweenTime(request.device_id,request.start_time,request.end_time, function (err, res) {
        let response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        }else {
            response.status = 'OK';
            response.data = res;
            return callback(null,response);
        }
    });
};
exports.getIdleData = function (request, callback) {
    Gps.getIdleData(request, function (err, res) {
        let response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        }else {
            response.status = 'OK';
            response.data = res;
            return callback(null,response);
        }
    });
};
exports.analyseBeat = function (request, callback) {
    Gps.getGPSDataBetweenTime(request.device_id,request.start_time,request.end_time, function (err, res) {
        let response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
            //winston.error(err);
        }else {
            response.status = 'OK';
            //response.data = res;
            response.beat_completed = 'YES';
            if(res.length == 0){
                response.beat_completed = 'NA';
                response.reason = 'No data from device';
            }
            if(request.beat && request.beat.beatStart && request.beat.beatEnd){
                response.beat =  request.beat;
                response.sP = geolib.findNearest({latitude:request.beat.beatStart.latitude,longitude:request.beat.beatStart.longitude},res);
                if(response.sP && response.sP.distance > 500){
                    response.beat_completed = 'NO';
                    response.reason = 'Beat staring point distance is more than 500 mtr';
                }
                response.eP = geolib.findNearest({latitude:request.beat.beatEnd.latitude,longitude:request.beat.beatEnd.longitude},res);
                if(response.eP && response.eP.distance > 500){
                    response.beat_completed = 'NO';
                    response.reason = 'Beat staring point distance is more than 500 mtr';
                }
                /*
                if(parseInt(response.eP.key) < parseInt(response.sP.key)){
                    response.beat_completed = 'NO';
                    response.reason = 'Beat starting point is visited later than end point';
                }*/
                 let minSpeed = 5,maxSpeed=0;
                if(parseInt(response.eP.key) == parseInt(response.sP.key)){
                    response.beat_completed = 'NO';
                    response.reason = 'No data';
                    minSpeed = 0;
                }
                let start = parseInt(response.sP.key); end = parseInt(response.eP.key);
                if(end < start){
                    start = parseInt(response.eP.key);
                    end = parseInt(response.sP.key)
                }
                for(let i= start;i< end;i++){
                    if(res[i].speed < minSpeed){
                        minSpeed = res[i].speed;
                    }
                    if(res[i].speed > maxSpeed){
                        maxSpeed = res[i].speed;
                    }
                }
                response.minSpeed = minSpeed;
                response.maxSpeed = maxSpeed;
            }else{
                response.beat_completed = 'NA';
                response.reason = 'Beat Not found';
            }
            return callback(null,response);
        }
    });
};
exports.beatCacheReport = function (request, callback) {
    Gps.beatCache(request, function (err, res) {
        let response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
        }else {
            response.status = 'OK';
            response.data = res;
            return callback(null,response);
        }
    });
};

function processMileageReportForLMS(request,res,callback){
    let devices = {};
    //prepare device wise data
    for (let i = 0; i < res.length; i++) {
        res[i].imei = parseInt(res[i].imei);
        if (!devices[res[i].imei]) {
            devices[res[i].imei] = {
                data: []
            };
        }
        devices[res[i].imei].data.push(res[i]);
    }
    //process each device data
    let total_dist = 0,total_days=0;

    for(let key in devices) {
        device = devices[key];
        let dist = 0;
        device.start_date = dateUtil.getDateFromYYYYMMDD(device.data[0].date);
        device.end_date = dateUtil.getDateFromYYYYMMDD(device.data[device.data.length - 1].date);
        device.no_of_hours = dateUtil.getHrDifference(device.start_date, device.end_date);
        device.no_of_days = Math.ceil(device.no_of_hours / 24);
        for (let i = 0; i < device.data.length; i++) {
            if (device.data[i].distance) {
                dist += device.data[i].distance;
            }
        }
        device.tot_dist = dist;
        total_dist += dist;
        total_days += device.no_of_days;
        device.avg_daily_km = device.tot_dist / (1000 * device.no_of_days);
        //done();
    }
    let resp = {status:'OK',tot_dist : total_dist,total_days:total_days,devices:devices};
    if(callback)  callback(null,resp);
}

function processMileageReport(request,res,callback) {
    let devices = {};
    //prepare device wise data
    for (let i = 0; i < res.length; i++) {
        res[i].imei = parseInt(res[i].imei);
        if (!devices[res[i].imei]) {
            devices[res[i].imei] = {
                datewise_dist: []
            };
        }
        devices[res[i].imei].datewise_dist.push(res[i]);
    }
    //process each device data
    let total_dist = 0, total_days = 0;
    for (let key in devices) {
        device = devices[key];
        //async.each(devices, function (device, done) {
        //sort data
        /* device.datewise_dist.sort(function (a, b) {
             let keyA = new Date(a.date),
                 keyB = new Date(b.date);
             // Compare the 2 dates
             if (keyA < keyB) return -1;
             if (keyA > keyB) return 1;
             return 0;
         });
         */
        let dist = 0;
        //device.start_date = dateUtil.getDateFromYYYYMMDD(device.datewise_dist[0].date);
        //device.end_date = dateUtil.getDateFromYYYYMMDD(device.datewise_dist[device.datewise_dist.length - 1].date);
        //device.no_of_hours = dateUtil.getHrDifference(device.start_date, device.end_date);
        //device.no_of_days = Math.ceil(device.no_of_hours / 24);
        let y, m, d, dStr;
        for (let i = 0; i < device.datewise_dist.length; i++) {
            if (device.datewise_dist[i].distance && !isNaN(device.datewise_dist[i].distance)) {
                dist += device.datewise_dist[i].distance;
            }
            dStr = device.datewise_dist[i].date.toString();
            y = dStr.substr(0, 4);
            m = dStr.substr(4, 2);
            d = dStr.substr(6, 2);
            device.datewise_dist[i].date = d + "-" + m + "-" + y;
        }
        device.tot_dist = dist;
        total_dist += dist;
        total_days += device.no_of_days;
        //device.avg_daily_km = device.tot_dist / (1000 * device.no_of_days);
        //done();
        }
    //, function (err) {
    let resp = {
        status: 'OK',
        'message': 'mileage report',
        'start_time': request.start_time,
        'end_time': request.end_time,
        tot_dist: total_dist,
        total_days: total_days,
        data: devices
    };
    resp.data = processMileageReportForDays(resp, request.device_id);
    formatData(resp, request.start_time, request.end_time);
    if (callback) callback(null, resp);

    //});
   };

function processMileageReportForDays(activity, device_id) {
    let days = {};
    let s = 'Summary';
    days[s] = {};

    let shouldShowSummary = false;

    for (let device in activity.data) {
        if (activity.data[device].datewise_dist.length > 0) {
            shouldShowSummary = true;
        }else{
            console.log(device,activity.data[device].datewise_dist);
        }
        for (let i = 0; i < activity.data[device].datewise_dist.length; i++) {
            const dwd = activity.data[device].datewise_dist[i];
            if (!days[dwd.date]) days[dwd.date] = {};
            if (device_id instanceof Array) {
                for (let j = 0; j < device_id.length; j++) {
                    if (!days[dwd.date][device_id[j]]) days[dwd.date][device_id[j]] = {
                        distance: 0,
                        duration: 0,
                        top_speed: 0
                    };
                    if (!days[s][device_id[j]]) days[s][device_id[j]] = {
                        distance: 0,
                        duration: 0,
                        top_speed: 0
                    };
                }
            } else {
                if (!days[dwd.date][device_id]) days[dwd.date][device_id] = {
                    distance: 0,
                    duration: 0,
                    top_speed: 0
                };
                if (!days[s][device_id]) days[s][device_id] = {
                    distance: 0,
                    duration: 0,
                    top_speed: 0
                };
            }
            days[dwd.date][device] = {
                distance: dwd.distance,
                duration: dwd.dur_drive,
                top_speed: dwd.top_speed
            };

            days[s][device].distance += days[dwd.date][device].distance;
            days[s][device].duration += days[dwd.date][device].duration;
            if(days[dwd.date][device].top_speed > days[s][device].top_speed && days[dwd.date][device].top_speed < limit.speed){
                days[s][device].top_speed = days[dwd.date][device].top_speed;
            }
        }
    }
    // if(!shouldShowSummary) delete days[s];
    return days;
}

function formatData(res,start_time,end_time){
    let vehs,client='download';
    res.headers = dateUtil.getDateArray(start_time, end_time);
    if (res.data.Summary) res.headers.splice(0, 0, 'Summary');
    for (let date in res.data) {
        if (!vehs) {
            vehs = {};
            for (let veh in res.data[date]) {
                vehs[veh] = {};
            }
        }
        if (date === 'Summary') {
            vehs[date] = res.data[date];
            continue;
        }
        for (let veh in res.data[date]) {
            vehs[veh][date] = res.data[date][veh];
        }
    }
    if (client === 'download') {
        res.data = vehs;
    } else {
        let aVehicles = [];
        for (let imei in vehs) {
            if (imei !== 'Summary') {
                let oVeh = {};
                oVeh.imei = imei;
                if (vehs.Summary && vehs.Summary[imei]) {
                    oVeh.total_dist = vehs.Summary[imei].distance;
                    oVeh.total_dur = vehs.Summary[imei].duration;
                    oVeh.top_speed = vehs.Summary[imei].top_speed;
                    oVeh.average_speed = vehs.Summary[imei].average_speed;
                }
                for (let date in vehs[imei]) {
                    oVeh[date] = vehs[imei][date].distance;
                }
                aVehicles.push(oVeh);
            }
        }
        res.data = aVehicles;
    }
};
