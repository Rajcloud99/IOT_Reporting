/**
 * Created by Kamal on 07-05-2016.
 */
const Mobile = require('../model/mobiles_device');
function getMobile(request, callback) {
	Mobile.getDevice(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (res && res.length === 0) {
			response.status = 'OK';
			response.message = 'Device Settings';
			response.data = {notification: true, imei: request.imei};
		} else {
			response.status = 'OK';
			response.message = 'Device Settings';
			response.data = res[0];

		}
		return callback(response);
	});
}
function registerMobile(request, callback) {
	request.notification = true;
	Mobile.registerDevice(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: "",
			data: request
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'mobile registration failed';
		} else {
			response.status = 'OK';
			response.message = 'Mobile registration done succefully';
		}
		return callback(response);
	});
}
function updateMobile(request, callback) {
	Mobile.registerDevice(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: "",
			request: request.request
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'user notification update failed';
		} else {
			response.status = 'OK';
			response.message = 'user notification updated succefully';
			response.data = request;

		}
		return callback(response);
	});
}

module.exports.getMobile = getMobile;
module.exports.registerMobile = registerMobile;
module.exports.updateMobile = updateMobile;
