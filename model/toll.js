/**
 * @Author: bharath
 * @Date:   2017-01-03
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

exports.getToll = function (callback) {
	const query = 'SELECT toll_plaza_id, latitude, longitude, car_rate_single, lcv_rate_single, bus_rate_multi, multi_axle_rate_single, hcm_eme_single, project_type, four_to_six_axle_single, seven_or_more_axle_single, toll_name, search_loc, toll_address FROM ' + database.table_tolls;
	cassandraDbInstance.execute(query, [], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('landmark.getLandmarks', err);
			callback(err);
			return;
		}
		if (!result.rows || result.rows.length === 0) return callback('no tolls');
		callback(err, result.rows);
	});
};
