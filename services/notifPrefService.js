/**
 * Created by Kamal on 21-09-2016.
 */
const Notif_pref = require('../model/notif_preferences');
const devices = require('../config').devices;

function getNotif_pref(request, callback) {
	Notif_pref.getNotif_pref(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Notif_pref not found';
		} else if (res.data && res.data.length === 0) {
			response.status = 'OK';
			response.message = 'Notif_pref default found.';
			for (let i = 0; i < devices.length; i++) {
				if (devices[i].key === request.device_type) {
					response.data = devices[i].value.alerts;
				}
			}
			response.pageState = res.pageState;
		} else {
			response.status = 'OK';
			response.message = 'Notif_pref found.';
			response.data = res.data[0];
			delete response.data.mobile_imei;
			delete response.data.device_id;
			delete response.data.last_modified_by;
			delete response.data.last_modified;
			delete response.data.user_id;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
}
function updateNotif_pref(request, callback) {
	Notif_pref.updateNotif_pref(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Notif_pref update  failed';
		} else {
			response.status = 'OK';
			response.message = 'Notif_pref update done succefully';
			response.data = res;
		}
		return callback(response);
	});
}
function createNotif_pref(request, callback) {
	Notif_pref.createNotif_pref(request, function (err, res) {
		delete request.notifObject;
		const response = request;
		response.status = 'ERROR';
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Notif_pref registration failed';
		} else {
			response.status = 'OK';
			response.message = ' Notif_pref setup done succefully';
		}
		return callback(response);
	});
}

module.exports.createNotif_pref = createNotif_pref;
module.exports.getNotif_pref = getNotif_pref;
module.exports.updateNotif_pref = updateNotif_pref;
