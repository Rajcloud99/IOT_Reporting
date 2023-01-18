const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const crudUtil = require('../utils/crudutil');

function GpsGaadi(oGpsGaadi) {
	this.imei = oGpsGaadi.imei;
	this.manufecturer = oGpsGaadi.manufecturer;
	this.model = oGpsGaadi.model;
	this.sn = oGpsGaadi.sn;
	this.name = oGpsGaadi.name;
	this.user_id = oGpsGaadi.user_id;
	this.activation_time = oGpsGaadi.activation_time;
	this.contact_no = oGpsGaadi.contact_no;
	this.driver_contact = oGpsGaadi.driver_contact;
	this.driver_name = oGpsGaadi.driver_name;
	this.expiry_time = oGpsGaadi.expiry_time;
	this.icon = oGpsGaadi.icon;
	this.remark = oGpsGaadi.remark;
	this.sim_no = oGpsGaadi.sim_no;
	this.status = oGpsGaadi.status;
	this.sim_provider = oGpsGaadi.sim_provider;
	this.driver_mobile = oGpsGaadi.driver_mobile;
	this.vehicle_type = oGpsGaadi.vehicle_type;
	this.vehicle_group = oGpsGaadi.vehicle_group;
	this.ip = oGpsGaadi.ip;
	this.branch = oGpsGaadi.branch;
	this.ac_on = oGpsGaadi.ac_on;
}
const allowedFieldsForUpdate = ['branch', 'activation_time', 'contact_no', 'driver_contact', 'driver_name', 'expiry_time',
	'icon', 'remark', 'sim_no', 'sim_provider','last_modified', 'last_modified_by','device_type', 'ip',
	'manufecturer', 'name', 'reg_no', 'sn', 'status', 'driver_mobile', 'vehicle_type', 'vehicle_group', 'remark2', 'remark3', 'estimated_dist',
    'owner_group','trip_start_time','trip_end_time','vehicle_status','customer','trip_status','route','trip_no','sos_nos'
];
const allowedFieldsForCreate = ['imei', 'branch', 'ownership', 'activation_time', 'contact_no', 'driver_contact', 'driver_name', 'expiry_time',
	'icon', 'remark', 'sim_no', 'sim_provider', 'user_id', 'last_modified', 'last_modified_by', 'created_at', 'device_type', 'ip',
	'manufecturer', 'name', 'reg_no', 'sn', 'status','owner_group','trip_start_time','trip_end_time','vehicle_status','customer','trip_status','route','trip_no'
];
const prepareCreateQuery = function (oAlarm) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oAlarm) {
		if (allowedFieldsForCreate.indexOf(key) > -1 && oAlarm[key]) {
			aParam.push(oAlarm[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key;
				sValues = sValues + ",?";
			} else {
				sQuery = key;
				sValues = "?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.sValues = sValues;
	oRet.aParam = aParam;
	return oRet;
};
const prepareUpdateQuery = function (oGpsGaadi) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oGpsGaadi) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oGpsGaadi[key]);
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
GpsGaadi.getGpsGaadi = function (request, callback) {
	let aParam, sKey,query;
	if(request.project){
		query = 'SELECT ' + Object.keys(request.project).join(',') +  ' FROM ' + database.table_gpsgaadi;
	}else {
		query = 'SELECT * FROM ' + database.table_gpsgaadi;
	}
	if (request.request === 'gpsgaadi_by_imei') {
        aParam = [parseInt(request.imei)];
		query = query + ' WHERE imei = ?';
	} else if (request.request === 'gpsgaadi_by_uid' || request.request === 'gpsgaadi_by_uid_web') {
		aParam = [request.selected_uid];
        query = query + ' WHERE user_id = ?';
	} else if (request.request === 'gpsgaadi_by_reg_no') {
        aParam = [request.reg_no];
        query = query + database.table_gpsgaadi + ' WHERE reg_no = ?';
	}else if (request.request === 'gpsgaadi_by_reg_no_user') {
        aParam = [request.reg_no,request.selected_uid];
        query = query + ' WHERE reg_no = ? AND user_id = ?';
    }else if (request.request === 'gpsgaadi_by_imei_user') {
        aParam = [request.imei,request.selected_uid || request.user_id];
        query = query + ' WHERE imei = ? AND user_id = ?';
    }
	cassandraDbInstance.execute(query, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('GpsGaadi.getGpsGaadi', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			if (request.request === 'gpsgaadi_by_reg_no' || request.request === 'gpsgaadi_by_reg_no_user') {
				callback(err, {});
			} else {
				callback(err, []);
			}
			return;
		}
		if (result && result.rows) {
			if (request.request === 'gpsgaadi_by_reg_no' || request.request === 'gpsgaadi_by_reg_no_user' || request.request === 'gpsgaadi_by_imei_user') {
				callback(err, result.rows[0]);
			} else {
				callback(err, result.rows);
			}
		}

	});
};
GpsGaadi.getGpsGaadiList = function (request, callback) {
	const oConfig = {
		prepare: 1
	};
	// if (request.pageState) {
	// 	oConfig.pageState = new Buffer(request.pageState);
	// }
	// if (request.all) {
	// 	//   winston.info("2");
	// 	//skip
	// } else if (request.row_count) {
	// 	oConfig.fetchSize = request.row_count;
	// } else if (request.device_id) {
	// 	//do nothing to size list
	// } else {//default no of rows 30
	// 	oConfig.fetchSize = 50;
	// }


	let query;
	let aParams;
	/***If imei list is not provided ***/
	if (!request.device_id && (request.selected_uid || request.login_uid)) {
		query = 'SELECT * FROM ' + database.table_gpsgaadi + ' WHERE user_id = ? ';
		aParams = [request.selected_uid || request.login_uid];
	}else {
		if (request.device_id) {
			query = 'SELECT * FROM ' + database.table_gpsgaadi + ' WHERE user_id = ? AND imei IN ( ? )';
			aParams = [(request.selected_uid || request.login_uid), request.device_id.join(",")];
		}
	}
	if(!query){
		console.log('query',query,aParams,request.selected_uid ,request.login_uid);
		return callback(null, {data:[]});
	}
	if (request.reg_no) {
		query = query + "AND reg_no=? ";
		aParams.push(request.reg_no);
	}
	if (request.reg_no || request.device_id) {
		query = query + " ALLOW FILTERING";
	}
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('GpsGaadi.getGpsGaadiList'+ aParams, err);
			callback(err);
			return;
		}
		if (!result || !result.rows || result.rows.length === 0){
            return callback(null, {data:[]});
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
GpsGaadi.getFlvliList = function (request, callback) {
	const oConfig = {
		prepare: 1
	};
	let query;
	let aParams;

	if (request.device_id) {
		query = 'SELECT datetime,fl,f_lvl,speed,latitude,longitude FROM ' + database.table_gps_data +  ' WHERE device_id IN(?) ' + ' AND  datetime >= ? AND datetime <=? ORDER BY datetime DESC LIMIT 60000 ALLOW FILTERING';
		aParams = [request.device_id.join(","),request.from,request.to];
	}
	if(!query){
		console.log('query',query,aParams,request.selected_uid ,request.login_uid);
		return callback(null, {data:[]});
	}
	if (request.reg_no) {
		query = query + " ALLOW FILTERING";
	}
	cassandraDbInstance.execute(query,aParams , oConfig, function (err, result) {
		if (err) {
			winston.error('GpsGaadi.getGpsGaadiList'+ aParams, err);
			callback(err);
			return;
		}
		if (!result || !result.rows || result.rows.length === 0){
			return callback(null, {data:[]});
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

const updateGpsGaadis = function (req, res, callback) {
	const aQueries = [];
	delete req.imei;
	delete req.created_at;
	delete req.user_id;
	for (let dev = 0; dev < res.length; dev++) {
		const oQueryParam = crudUtil.prepareUpdateQuery(req, allowedFieldsForUpdate);
		//const oQueryParam = prepareUpdateQuery(req);
		let sQuery = oQueryParam.sQuery;
		const aParam = oQueryParam.aParam;
		aParam.push(res[dev].user_id);
		aParam.push(new Date(res[dev].created_at));
		sQuery = 'UPDATE ' + database.table_gpsgaadi + ' SET ' + sQuery + ' WHERE user_id = ? AND created_at = ?';
		aQueries.push({
			query: sQuery,
			params: aParam
		});
	}
	if (aQueries.length > 0) {
		cassandraDbInstance.batch(aQueries, {
			prepare: true
		}, function (err, result) {
			if (err) {
				callback(err, null);
				winston.error('GpsGaadi.updateGpsGaadis', err);
				return;
			}
			if (!result) {
				return callback(err, null);
			}
			return callback(err, result);
		});
	}
};

GpsGaadi.updateGpsGaadi = function (req, callback) {
	const local_cb = function (err, res) {
		if (err) {
			winston.error('GpsGaadi.updateGpsGaadi', err);
		} else if (res) {
			updateGpsGaadis(req, res, callback);
		}
	};
	req.request = 'gpsgaadi_by_imei';
	GpsGaadi.getGpsGaadi(req, local_cb);
};

GpsGaadi.associateGpsGaadiWithUser = function (request, callback) {
	const aQueries = [];
	const updateGpsGaadiInventoryQuery = 'UPDATE ' + database.table_gpsgaadi + ' SET user_id = ? WHERE imei = ?';
	for (let dev = 0; dev < request.GpsGaadis.length; dev++) {
		aQueries.push({
			query: updateGpsGaadiInventoryQuery,
			params: [request.new_uid, parseInt(request.GpsGaadis[dev])]
		});
	}
	if (aQueries.length > 0) {
		cassandraDbInstance.batch(aQueries, {
			prepare: true
		}, function (err, result) {
			if (err) {
				callback(err, null);
				winston.error('GpsGaadi.associateGpsGaadiWithUser', err);
				return;
			}
			if (!result) {
				return callback(err, null);
			}
			return callback(err, result);
		});
	}
};

GpsGaadi.updateGpsGaadisByTrip = function (request, callback) {
    request.selected_uid = request.selected_uid || request.login_uid;
    request.last_modified = Date.now();
    request.last_modified_by = request.login_uid;
    const oQueryParam = crudUtil.prepareUpdateQuery(request, allowedFieldsForUpdate);
    let sQuery = oQueryParam.sQuery;
    const aParam = oQueryParam.aParam;
    aParam.push(request.user_id);
    aParam.push(request.created_at);
    sQuery = 'UPDATE ' + database.table_gpsgaadi + ' SET ' + sQuery + ' WHERE user_id = ? AND created_at = ?';
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

GpsGaadi.registerGpsGaadi1 = function (GpsGaadis, callback) {  // todo  update for multiple user for assosiate device with user
	const aQueries = [];
	for (let dev = 0; dev < GpsGaadis.length; dev++) {
		const getDeviceInventoryQuery = 'SELECT * FROM ' + database.table_gpsgaadi + ' WHERE imei = ' + GpsGaadis[dev].imei +  ' AND user_id =' +  "'" + GpsGaadis[dev].user_id + "'";
		cassandraDbInstance.execute(getDeviceInventoryQuery, [], function (err, result) {
			if (err) {
				winston.error('Device.associateDeviceWithUser', err);
			}
			if (result && result.rows && result.rows.length === 0) {
				//GpsGaadis[dev].status = 'offline';
				GpsGaadis[dev].created_at = Date.now();
				GpsGaadis[dev].ownership = 'owner';
				const oRet = prepareCreateQuery(GpsGaadis[dev]);
				const query = 'INSERT INTO ' + database.table_gpsgaadi + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
				aQueries.push({
					query: query,
					params: oRet.aParam
				});
				cassandraDbInstance.batch(aQueries, {
					prepare: true
				}, function (err, result) {
					if (err) {
						callback(err, null);
						winston.error('GpsGaadi.registerGpsGaadi', err);
						return;
					}
					if (!result) {
						return callback(err, null);
					}
					return callback(err, result);
				});
			}
		});
	}
};

GpsGaadi.registerGpsGaadi = function (GpsGaadis, callback) {
	const aQueries = [];
	for (let dev = 0; dev < GpsGaadis.length; dev++) {
		//GpsGaadis[dev].status = 'offline';
		GpsGaadis[dev].created_at = Date.now();
		GpsGaadis[dev].ownership = 'owner';
		const oRet = prepareCreateQuery(GpsGaadis[dev]);
		const query = 'INSERT INTO ' + database.table_gpsgaadi + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
		aQueries.push({
			query: query,
			params: oRet.aParam
		});
	}
	cassandraDbInstance.batch(aQueries, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('GpsGaadi.registerGpsGaadi', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
GpsGaadi.addGpsGaadiFromPool = function (GpsGaadis, callback) {
	const oRet = prepareCreateQuery(GpsGaadis);
	const query = 'INSERT INTO ' + database.table_gpsgaadi + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('GpsGaadi.addGpsGaadiFromPool', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};
GpsGaadi.removeGpsGaadi = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const query = 'DELETE FROM ' + database.table_gpsgaadi + ' WHERE user_id = ?  AND created_at = ?';

	cassandraDbInstance.execute(query, [request.selected_uid, request.created_at], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('GpsGaadi.removeGpsGaadi', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});
};

module.exports = GpsGaadi;
