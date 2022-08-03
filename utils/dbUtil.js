/**
 * Created by bharath on 26/05/17.
 */

const cassandraDbInstance = require('../cassandraDBInstance');

// Accepts table name and data object.
// All the fields in the data are inserted, so make sure to provide all the required keys
exports.update = function (table, data, callback) {
	//50 q's
	const q = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];
	const query = 'insert into ' + table + ' (' + Object.keys(data).toString() + ') values (' + q.splice(0, Object.keys(data).length).toString() + ')';
	const params = [];

	for (let key in data) {
		if (data[key] === undefined) data[key] = null;
		params.push(data[key]);
	}

	cassandraDbInstance.execute(query, params, {
		prepare: true
	}, function (err, result) {
		callback(err, result);
	});
};

exports.get = function (table, fields, data, callback) {
	if(fields === null || fields === undefined) fields = '*';
	//50 q's
	const q = ['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?'];
	const query = 'select ' + fields.toString() + ' from ' + table + ' where ';
	let where = '';
	const params = [];
	for (let key in data) {
		where += (key + ' = ? and ');
		params.push(data[key]);
	}
	where = where.substr(0, where.length - 5);

	// console.log(query+where,':', params.toString());

	cassandraDbInstance.execute(query + where, params, {
		prepare: true
	}, function (err, result) {
		if (err) return callback(err);
		callback(err, result.rows);
	});
};

exports.getFromQueryAsync = function(query, params) {
	return new Promise((resolve, reject) => {
		cassandraDbInstance.execute(query, params, {
			prepare: true
		}, function(err, result) {
			if(err) return reject(err);
			resolve(result.rows);
		});
	});
};