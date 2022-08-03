/**
 * @Author: bharath
 * @Date:   2017-01-10
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const crudUtil = require('../utils/crudutil');

const allowedFieldsForUpdateAdmin = ['permissions', 'feature', 'allowed_fileds', 'shown_fields'];
const allowedFieldsForUpdate = ['shown_fields', 'allowed_fields'];
const allowedFieldsForCreate = ['user_id', 'permissions', 'feature', 'allowed_fileds', 'shown_fields'];
const app_features = require('../config').features;

exports.getAllFeatures = function (request, callback) {
	const query = 'SELECT * FROM ' + database.table_features + ' WHERE user_id = ?';
	cassandraDbInstance.execute(query, [request.user_id || request.selected_uid || request.login_uid], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('feature.getAllFeatures', err);
			callback(err);
			return;
		} else if (!result.rows || result.rows.length === 0) {
			return callback('no data');
		} else {
			return callback(err, result.rows);
		}
	});
};

exports.getFeature = function (request, callback) {
	const query = 'SELECT * FROM ' + database.table_features + ' WHERE user_id = ? AND feature = ?';
	cassandraDbInstance.execute(query, [request.user_id || request.selected_uid || request.login_uid, request.feature], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('feature.getFeature', err);
			callback(err);
			return;
		} else if (result.rows.length === 0) {
			return callback(null, app_features[request.feature]);
		} else {
			return callback(err, result.rows[0]);
		}
	});
};
exports.updateFeature = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const oQueryParam = crudUtil.prepareUpdateQuery(request, allowedFieldsForUpdate);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.selected_uid);
	aParam.push(request.feature);
	sQuery = 'UPDATE ' + database.table_features + ' SET ' + sQuery + ' WHERE user_id = ? AND feature = ?';
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Trip.updateTrip', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, request);
	});
};

exports.upsertFeature = function (user_id, feature, permissions, callback) {
	const query = 'UPDATE ' + database.table_features + ' SET permissions = ? WHERE user_id = ? AND feature = ?';
	cassandraDbInstance.execute(query, [permissions.toString(), user_id, feature], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('feature.upsertFeature', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};

exports.removeFeature = function (user_id, feature, callback) {
	const query = 'DELETE FROM ' + database.table_features + ' WHERE user_id = ?  AND feature = ?';
	cassandraDbInstance.execute(query, [user_id, feature], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('feature.removeFeature', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
