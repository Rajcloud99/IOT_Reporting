/**
 * Created by Kamal on 13-05-2016.
 */
const SharedLocation = require('../model/shared_locations');
function getSharedLocation(request, callback) {
	SharedLocation.getSharedLocation(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Shared Location not found';
		}
		/*else if (res.end_time && new Date()>new Date(res.end_time)){
            response.message = 'Shared Location time has expired';
        }
        */
		else{
			response.status = 'OK';
			response.message = 'Shared Location found.';
			response.data = res;
		}
		return callback(response);
	});
}
function updateSharedLocation(request, callback) {
	SharedLocation.updateSharedLocation(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'SharedLocation update  failed';
		} else {
			response.status = 'OK';
			response.message = 'SharedLocation update done succefully';
			response.data = res;
		}
		return callback(response);
	});
}
function createSharedLocation(request, callback) {
	SharedLocation.createSharedLocation(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'location sharing failed';
		} else {
			request.public_link = "http://tracking.gpsgaadi.com/#!/sharedLocation/" + request.lid;
			response.status = 'OK';
			response.message = "location shared successfully.";
			response.data = request;

		}
		return callback(response);
	});
}
function removeSharedLocation(request, callback) {
	SharedLocation.removeSharedLocation(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'SharedLocation removal failed';
		} else {
			response.status = 'OK';
			response.message = 'SharedLocation removed succefully';
		}
		return callback(response);
	});
}
module.exports.createSharedLocation = createSharedLocation;
module.exports.getSharedLocation = getSharedLocation;
module.exports.updateSharedLocation = updateSharedLocation;
module.exports.removeSharedLocation = removeSharedLocation;