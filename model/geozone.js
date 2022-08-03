/**
 * Created by Kamal on 07-05-2016.
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function Geozone(oGeozone) {
	this.name = oGeozone.name;
	//TODO restrict field later and put validations
}

const allowedFieldsForUpdate = ['last_modified', 'last_modified_by', 'name', 'center', 'description', 'geozone', 'ptype', 'radius'];
const prepareUpdateQuery = function (oGeozone) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oGeozone) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oGeozone[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key + "=?";
			} else {
				sQuery = key + "=?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.aParam = aParam;
	return oRet;
};

Geozone.getGeozone = function (request, callback) {
	const oConfig = {
		prepare: 1
	};
	if (request.pageState) {
		oConfig.pageState = new Buffer(request.pageState);
	}
	if (request.row_count) {
		oConfig.fetchSize = request.row_count;
	} else { //default no of rows 30
		oConfig.fetchSize = 100;
	}
	request.selected_uid = request.selected_uid || request.login_uid;
	let query, skey, aParam = [];
	if (request.request === 'get_zeozone_by_gid') {
		aParam.push(request.gid);
		query = 'SELECT * FROM ' + database.table_geozone + ' WHERE gid = ?';
	} else if (request.request === 'get_zeozone_by_name') {
		aParam.push(request.name);
		aParam.push(request.selected_uid || request.login_uid);
		query = 'SELECT * FROM ' + database.table_geozone + ' WHERE name = ? AND user_id = ? ALLOW FILTERING';
	}else {
		aParam.push(request.selected_uid || request.login_uid);
		query = 'SELECT * FROM ' + database.table_geozone + ' WHERE user_id = ? ALLOW FILTERING';
	}
	cassandraDbInstance.execute(query, aParam, oConfig, function (err, result) {
		if (err) {
			winston.error('Geozone.getGeozone', err);
			callback(err);
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}
		callback(err, oRes);
	});
};

Geozone.updateGeozone = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	request.last_modified = Date.now();
	request.last_modified_by = request.login_uid;
	const oQueryParam = prepareUpdateQuery(request);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.gid);
	sQuery = 'UPDATE ' + database.table_geozone + ' SET ' + sQuery + ' WHERE gid=?';
	// winston.info(sQuery,aParam);
	cassandraDbInstance.execute(sQuery, aParam, {prepare: true}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Geozone.updateGeozone', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, Geozone);
	});
};

Geozone.addGeozone = function (request, callback) {
	request.user_id = request.selected_uid || request.login_uid;
	request.gid = request.name + "_" + Date.now();
	request.datetime = Date.now();
	request.last_modified = Date.now();
	request.last_modified_by = request.login_uid;
	const query = 'INSERT INTO ' + database.table_geozone + ' (gid,datetime,description,geozone,last_modified,last_modified_by,name,ptype,radius,user_id) VALUES(?,?,?,?,?,?,?,?,?,?)';
	cassandraDbInstance.execute(query, [request.gid, request.datetime, request.description, request.geozone, request.last_modified, request.last_modified_by, request.name, request.ptype, request.radius, request.user_id], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Geozone.addGeozone', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, request);
	});
};
Geozone.removeGeozone = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const query = 'DELETE FROM ' + database.table_geozone + ' WHERE gid = ?';
	cassandraDbInstance.execute(query, [request.gid], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Geozone.removeGeozone', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
module.exports = Geozone;
