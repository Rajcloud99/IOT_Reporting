/**
 * Created by Kamal on 11-05-2016.
 */

const BPromise = require('bluebird');
const Notification = BPromise.promisifyAll(require('../model/notification'));
const excelService = require('../services/excelService');
const dateUtil = require('../utils/dateutils');
const Alerts = BPromise.promisifyAll(require('../model/deviceAlerts'));
const GpsGaadi = BPromise.promisifyAll(require('../model/gpsgaadi'));
module.exports.getNotification = function (request, callback) {
	request.notrim = true;
	Notification.getNotification(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Notification not found';
		} else {
		    if(request.geofence){
                trimGeofences(res.data,request);
            }
			response.status = 'OK';
			response.message = 'Notification found.';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
};
module.exports.downloadNotifications = function (request, callback) {
	request.notrim = true;
	Notification.getNotification(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'Notification not found';
			return callback(response);
		} else {
			response.login_uid = request.login_uid;
			response.status = 'OK';
			response.data = res.data;

			if (request.type === 'geofence') {
                if(request.geofence){
                    trimGeofences(response.data,request);
                }
                response.timezone = request.timezone;
                if(request.download == true) {
                    excelService.getGeofenceNotificationReport(response, function (obj) {
                        response.message = 'link for geofence report';
                        response.data = obj.url;
                        return callback(response);
                    });
                }else{
                    response.message = 'entry exit report data';
                    return callback(response);
                }
			} else if (request.type === 'halt') {
				excelService.getHaltNotificationReport(response, function (obj) {
					response.message = 'link for geofence report';
					response.data = obj.url;
					return callback(response);
				});
			} else if (request.type === 'over_speed') {
				excelService.getOverSpeedNotificationReport(response, function (obj) {
					response.message = 'link for geofence report';
					response.data = obj.url;
					return callback(response);
				});
			}else{
                excelService.getOverSpeedNotificationReport(response, function (obj) {
                    response.message = 'link for geofence report';
                    response.data = obj.url;
                    return callback(response);
                });
            }
			/*else {
				return callback(response);
			}*/
		}

	});
};
module.exports.getGeofenceScheduleReport = function (request, callback) {
	request.type = 'geofence';
	let response = {status: 'ERROR'};
	request.row_count = 1000;
	Notification.getNotificationAsync(request)
		.then(function (data) {
			data = data.data;
			let devices = {};
			for (let i = 0; i < data.length; i++) {
				if (devices[data[i].imei] === undefined) devices[data[i].imei] = [];
				devices[data[i].imei].push(data[i]);
			}
			response.data = processGeofenceScheduleData(devices);
			response.device_id = Object.keys(devices);
			response.message = 'found data';
			response.status = 'OK';
		})
		.error(function (err) {
			response.message = err.toString();
		})
		.then(function () {
			callback(response);
		});
};
module.exports.downloadGeofenceScheduleReport = function (request, callback) {
    request.type = 'geofence';
    let response = {status: 'ERROR'};
    request.row_count = 1000;
    Notification.getNotificationAsync(request)
        .then(function (data) {
            data = data.data;
            let devices = {};
            for (let i = 0; i < data.length; i++) {
                if (devices[data[i].imei] === undefined) devices[data[i].imei] = [];
                devices[data[i].imei].push(data[i]);
            }
            response.data = processGeofenceScheduleData(devices);
            response.device_id = Object.keys(devices);
            response.message = 'found data';
            response.status = 'OK';
            response.timezone = request.timezone;
			excelService.getGeofenceScheduleReport(response, function (obj) {
               response.message = 'link for geofence schedule report';
               response.data = obj.url;
				return callback(response);
			});
         })
        .error(function (err) {
            response.message = err.toString();
            callback(response);
        });
};
function processGeofenceScheduleData(devices) {
	let res = {};
	for (let device_id in devices) {
		res[device_id] = {};
		res[device_id].data = [];
		devices[device_id].sort(function (a, b) {
			return dateUtil.sortAscComparator(a.datetime, b.datetime);
		});

		let data = devices[device_id];
		for (let i = 1; i < data.length; i++) {
			if (!data[i - 1].entry || !data[i].entry) continue;
            if ((data[i - 1].entry.category === 'loading' || data[i - 1].entry.category === 'unloading' ) && data[i].entry.category === 'unloading') {
                let lu2 = prepareTrips(data,i);
                if(lu2){
                    res[device_id].data.push(lu2);
				}
			}
		}
	}
	return res;
}
module.exports.getDeviceAlerts = function (request, callback) {
    let oReq = {
        request:'gpsgaadi_by_uid',
        selected_uid : request.selected_uid,
        user_id : request.selected_uid
        };
    if(request.imei){
        oReq.request = "gpsgaadi_by_imei";
        oReq.imei = request.imei;
    }
    GpsGaadi.getGpsGaadi(oReq, function (err, res) {
        const response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
            return callback(null, response);
        } else if (!res) {
            response.message = 'GpsGaadi not found';
            return callback(null, response);
        } else {
            let sIMEI = [];
            for (let i = 0; i < res.length; i++) {
                if (res[i].imei) {
                    sIMEI.push(res[i].imei);
                }
            }
            sIMEI = sIMEI.toString();
            request.imeis = request.imei || sIMEI;
            response.gpsRes = res;
            Alerts.getDeviceAlerts(request, function (err, resp) {
                if (err) {
                    response.message = err.toString();
                } else if (!resp) {
                    response.message = 'Device Alerts not found';
                } else {
                    for(let i=0;i<resp.data.length;i++){
                        if(response.gpsRes){
                            for(let j=0;j<response.gpsRes.length;j++){
                                if(parseInt(resp.data[i].imei) == parseInt(response.gpsRes[j].imei)){
                                    resp.data[i].reg_no = response.gpsRes[j].reg_no;
                                }
                            }
                        }
                    }
                    delete response.gpsRes;
                    response.status = 'OK';
                    response.message = 'Device Alerts found.';
                    response.data = resp.data;
                    response.pageState = res.pageState;
                }
                return callback(response);
            });
        }
    });

};
function prepareTrips(data,i){
    let lu = {
        vehicle_no: data[i - 1].vehicle_no,
        imei: data[i - 1].imei,
        load_area: data[i - 1].entry.name || data[i - 1].entry.message,
        unload_area: data[i].entry.name || data[i].entry.message,
        load_in: data[i - 1].entry.datetime,
        load_out: data[i - 1].exit ? data[i - 1].exit.datetime:null,
        unload_in: data[i].entry.datetime,
        unload_out: (data[i].exit ? data[i].exit.datetime : null),
    };
    if(lu.load_out && lu.load_in){
        lu.load_dur = dateUtil.getSecs(lu.load_out) - dateUtil.getSecs(lu.load_in);
    }
    if(lu.unload_out && lu.unload_in){
        lu.unload_dur = dateUtil.getSecs(lu.unload_out) - dateUtil.getSecs(lu.unload_in);
    }
    if(lu.unload_in && lu.load_out){
        lu.lead_load_to_unload = dateUtil.getSecs(lu.unload_in) - dateUtil.getSecs(lu.load_out);
    }
    if(lu.unload_out && lu.load_in){
        lu.total_dur = dateUtil.getSecs(lu.unload_out) - dateUtil.getSecs(lu.load_in);
    }
    return lu;
}
function trimGeofences(notifs, request) {
    for (let i = 0; i < notifs.length; i++) {
        if (notifs[i].type === 'geofence' && notifs[i].entry && notifs[i].entry.name && notifs[i].entry.name.search(request.geofence) > -1) {
           // var k;
        }else {
            notifs.splice(i--, 1);
        }
    }
}
