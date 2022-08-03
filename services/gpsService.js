const Gps = require('../model/gps');
const winston = require('../utils/logger');
const config = require('../config');
const limit = require('../config').limit;

module.exports.getDeviceIp = function (imei, callback) {
	if (config.isReceiverLocal) return callback('localhost');
	Gps.getDeviceIp(imei, function (err, res) {
		if (res !== undefined && res.ip !== undefined) {
			callback(res.ip);
		} else {
			callback(null);
		}
	});
};

module.exports.getCurrentLocation = function (imei, callback) {
	Gps.getCurrentLocation(imei, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			winston.error('gpsService.getCurrentLocation', err);
		} else if (!res) {
			response.message = 'location not found in DB for ' + imei;
		} else {
			response.data = res;
			response.status = 'OK';
			response.message = 'location';
		}
		return callback(response);
	});
};

module.exports.getOverspeedReport = function (imei, starttime, endtime, speedlimit, callback) {
	Gps.getGPSDataBetweenTime(imei, starttime, endtime, function (err, res) {
		const response = {device_id: imei, status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			winston.error(err);
		} else if (!res || res.length === 0) {
			response.message = 'location not found in DB for ' + imei;
		} else {
			response.data = processOverspeedReport(res, speedlimit, endtime);
			response.status = 'OK';
			response.message = 'overspeed report';
		}
		return callback(response);
	});
};
module.exports.getOverspeedReportV2 = function (request, callback) {
    Gps.getGPSDataBetweenTimeForSpeed(request, function (err, res) {
        const response = {device_id: request.imei, status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            winston.error(err);
        } else if (!res || res.length === 0) {
            response.message = 'location not found in DB for ' + request.imei;
        } else {
            response.data = processOverspeedReportV2(res, speedlimit);
            response.status = 'OK';
            response.message = 'overspeed report';
        }
        return callback(response);
    });
};
module.exports.getPlayback = function (imei, starttime, endtime, callback) {
	Gps.getGPSDataBetweenTime(imei, starttime, endtime, function (err, res) {
		const response = {device_id: imei, status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			winston.error(err);
		} else if (!res) {
			response.message = 'data not found in DB for ' + imei;
		} else {
			response.data = res;
			response.status = 'OK';
			response.message = 'playback';
		}
		return callback(response);
	});
};

function processOverspeedReport(data, speedlimit, endtime) {
	const overspeedReport = [];
	let limitCrossed = false;
	for (let i = 1; i < data.length; i++) {
		const location = data[i];
		if (location.speed >= speedlimit) {
			if (!limitCrossed) {
				limitCrossed = true;
				overspeedReport.push({
					imei: data[i].device_id,
					datetime: data[i].datetime,
					lat: data[i].lat,
					lng: data[i].lng,
					speed: data[i].speed
				});
			} else {
				const report = overspeedReport[overspeedReport.length - 1];
				report.speed += data[i].speed;
				report.speed /= 2;
				report.speed = parseInt(report.speed);
			}
		} else if (limitCrossed) {
			limitCrossed = false;
			const report = overspeedReport[overspeedReport.length - 1];
			let dur = new Date(data[i].datetime).getTime() - new Date(report.datetime).getTime();
			dur /= 1000;
			report.duration = parseInt(dur / 60) > 0 ? parseInt(dur / 60) + ' min ' : '';
			report.duration += parseInt(dur % 60) + ' sec';
		}
		if (overspeedReport.length > 0 && !overspeedReport[overspeedReport.length - 1].duration) {
			const report = overspeedReport[overspeedReport.length - 1];
			let dur = new Date(endtime).getTime() - new Date(report.datetime).getTime();
			dur /= 1000;
			report.duration = parseInt(dur / 60) > 0 ? parseInt(dur / 60) + ' min' : '';
			report.duration += parseInt(dur % 60) + ' sec';
		}
	}
	return overspeedReport;
}
function processOverspeedReportV2(data, speed_limit) {
    let devices = {};

    for (let i = 0; i < data.length; i++) {
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: []
            };
        }
        if (data[i].top_speed >= speed_limit && data[i].top_speed<=limit.speed) {
            devices[data[i].imei].data.push(data[i]);
        }
    }
    return devices;
}