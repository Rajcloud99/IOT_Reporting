/**
 * Created by Kamal on 25-10-2016.
 */
const Malfunction = require('../model/malFunction');
function getMalfunction(request, callback) {
	Malfunction.getMalfunction(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Malfunction not found';
		} else {
			response.status = 'OK';
			response.message = 'Malfunction found.';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
}
function updateMalfunction(request, callback) {
	Malfunction.updateMalfunction(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Malfunction update  failed';
		} else {
			response.status = 'OK';
			response.message = 'Malfunction update done succefully';
			response.data = res;
		}
		return callback(response);
	});
}
function createMalfunction(request, callback) {
	Malfunction.createMalfunction(request, function (err, res) {
		const response = {status: 'ERROR', message: "", index: request.index};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Malfunction registration failed';
		} else {
			response.status = 'OK';
			response.message = request.atype + ' Malfunction setup done succefully';
			response.atype = request.atype;
			response.imei = request.imei;
			response.vehicle_no = request.vehicle_no;
		}
		return callback(response);
	});
}
function removeMalfunction(request, callback) {
	Malfunction.removeMalfunction(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Malfunction removal failed';
		} else {
			response.status = 'OK';
			response.message = 'Malfunction removed succefully';
		}
		return callback(response);
	});
}
module.exports.createMalfunction = createMalfunction;
module.exports.getMalfunction = getMalfunction;
module.exports.updateMalfunction = updateMalfunction;
module.exports.removeMalfunction = removeMalfunction;