/**
 * Created by Kamal on 07-05-2016.
 */
const Alarm = require('../model/alarm');
const Geozone = require('../services/geozoneService');
const receivermanager = require('../utils/receivermanager');

function getAlarm(request, callback) {
	Alarm.getAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm not found';
		} else {
			response.status = 'OK';
			response.message = 'Alarm found.';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
}
function updateAlarm(request, callback) {
	Alarm.updateAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm update  failed';
		} else {

			response.status = 'OK';
			response.message = 'Alarm update done succefully';
			response.data = res;
            if(request.imei){
                require('../utils/receivermanager').sendAlarmUpdate(request.imei);
            }
			//receivermanager.sendAlarmUpdate(request.imei);
		}
		return callback(response);
	});
}

function createAlarmHelper(request, callback) {
	Alarm.createAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: "", index: request.index};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm registration failed';
		} else {
			response.status = 'OK';
			response.message = request.atype + ' alarm setup done succefully';
			response.atype = request.atype;
			response.imei = request.imei;
			response.vehicle_no = request.vehicle_no;
            if(request.imei){
                require('../utils/receivermanager').sendAlarmUpdate(request.imei);
            }
		}
		return callback(response);
	});
}

function checkAlarm(request, callback) {
	Alarm.getAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm not found';
		} else if (res.data.length > 0) {
			response.message = 'Alarm already exists.';
			response.data = res.data;
			response.pageState = res.pageState;
		} else {
			response.status = 'OK';
			response.message = 'Alarm can be created.';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
}

function createAlarm(request, callback) {
	function prepareGeozoneData(res) {
		if (res.status === 'OK' && res.data && res.data[0]) {
			const oGeoZone = res.data[0];
			request.ptype = oGeoZone.ptype;
			request.radius = oGeoZone.radius;
			request.geozone = oGeoZone.geozone;
			request.name = oGeoZone.name;
			request.description = oGeoZone.description;
			request.gid = oGeoZone.gid;
			const oReq = {
				gid: oGeoZone.gid,
				selected_uid: request.selected_uid || request.login_uid,
				imei: request.imei
			};
			checkAlarm(oReq, function (reppp) {
				if (reppp.status === 'OK') {
					createAlarmHelper(request, callback);
				} else {
					return callback(reppp);
				}
			});

		} else {
			const response = {};
			response.status = 'ERROR';
			response.message = 'Geozone with given gid not found';
			return callback(response);
		}
	}

	if (request.atype === 'geofence' && request.gid) {
		const nReq = {request: 'get_zeozone_by_gid', gid: request.gid};
		Geozone.getGeozone(nReq, prepareGeozoneData);
	} else if (request.atype === 'geofence' && request.name) {
		const nReq = {
			request: 'get_zeozone_by_name',
			name: request.name,
			selected_uid: request.selected_uid,
			login_uid: request.login_uid
		};
		Geozone.getGeozone(nReq, prepareGeozoneData);
	} else {
		createAlarmHelper(request, callback);
	}
}

function removeAlarm(request, callback) {
	Alarm.removeAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm removal failed';
		} else {
			response.status = 'OK';
			response.message = 'Alarm removed succefully';
            if(request.imei){
                require('../utils/receivermanager').sendAlarmUpdate(request.imei);
            }
			//receivermanager.sendAlarmUpdate(request.imei);
		}
		return callback(response);
	});
}

function addAlarm(request, callback) {
	Alarm.createAlarm(request, function (err, res) {
		const response = {status: 'ERROR', message: "", index: request.index};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Alarm registration failed';
		} else {
			response.status = 'OK';
			response.message = request.atype + ' alarm setup done succefully';
			response.atype = request.atype;
			response.imei = request.imei;
			response.vehicle_no = request.vehicle_no;
			if(request.imei){
				require('../utils/receivermanager').sendAlarmUpdate(request.imei);
			}
		}
		return callback(response);
	});
}

module.exports.createAlarm = createAlarm;
module.exports.getAlarm = getAlarm;
module.exports.updateAlarm = updateAlarm;
module.exports.removeAlarm = removeAlarm;
module.exports.addAlarm = addAlarm;

