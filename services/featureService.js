/**
 * @Author: bharath
 * @Date:   2016-12-14
 */

const Feature = require('../model/feature');

exports.upsertFeature = function (request, callback) {
	if (request.permissions.length === 0) return exports.removeFeature(request, callback);
	Feature.upsertFeature(request.selected_uid || request.login_uid, request.feature, request.permissions, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'upsert feature failed';
		} else {
			response.status = 'OK';
			response.message = 'Feature upserted successfully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.getFeature = function (request, callback) {
	Feature.getFeature(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Get feature failed';
		} else {
			response.status = 'OK';
			response.message = 'feature fetched successfully';
			response.data = res;
		}
		return callback(err, response);
	});
};

exports.removeFeature = function (request, callback) {
	Feature.removeFeature(request.selected_uid || request.login_uid, request.feature, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'remove reature failed';
		} else {
			response.status = 'OK';
			response.message = 'feature removed successfully';
			//response.data = res;
		}
		return callback(response);
	});
};
exports.updateFeature = function (request, callback) {
	Feature.updateFeature(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Feature update  failed';
		} else {
			response.status = 'OK';
			response.message = 'Feature update done succefully';
			response.data = res;
		}
		return callback(response);
	});
};
