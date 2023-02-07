const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const async = require('async');
const database = require('../config').database;
const crudUtil = require('../utils/crudutil');
const dateUtil = require('../utils/dateutils');
const BPromise = require('bluebird');
const geozoneCalculator = require('./../services/geozoneCalculator');
const User = require("./user");
const {adminUser} = require("../config/default");
const GpsGaadi = require("./gpsgaadi");

function Device(oDevice) {
	this.imei = oDevice.imei;
	this.reg_no = oDevice.reg_no;
	this.manufecturer = oDevice.manufecturer;
	this.device_type = oDevice.device_type;
	this.sn = oDevice.sn;
	this.name = oDevice.name;
	this.user_id = oDevice.user_id;
	this.activation_time = oDevice.activation_time;
	this.contact_no = oDevice.contact_no;
	this.driver_contact = oDevice.driver_contact;
	this.driver_name = oDevice.driver_name;
	this.rfid1 = oDevice.rfid1;
	this.driver_name2 = oDevice.driver_name2;
	this.rfid2 = oDevice.rfid2;
	this.ra_limit = oDevice.ra_limit;
	this.hb_limit = oDevice.hb_limit;
	this.expiry_time = oDevice.expiry_time;
	this.icon = oDevice.icon;
	this.remark = oDevice.remark;
	this.sim_no = oDevice.sim_no;
	this.sos_nos = oDevice.sos_nos;
	this.status = oDevice.status;
	this.sim_provider = oDevice.sim_provider;
	this.ip = oDevice.ip;
	this.lat = oDevice.lat;
	this.lng = oDevice.lng;
	this.speed = oDevice.speed;
	this.location_time = oDevice.location_time;
	this.datetime = oDevice.location_time;
	this.positioning_time = oDevice.positioning_time;
	this.geofence_status = oDevice.geofence_status;
	this.course = oDevice.course;
	this.ac_on = oDevice.ac_on;
	this.gsm_signal_str = oDevice.gsm_signal_str;
	this.address = oDevice.address;
}

const allowedFieldsForUpdate = ['reg_no', 'user_role', 'pooled', 'activation_time', 'contact_no', 'driver_contact', 'driver_name', 'expiry_time',
	'icon', 'remark', 'sim_no', 'sim_provider', 'user_id', 'last_modified', 'last_modified_by', 'device_type', 'on_trip','driver_name2','rfid1','rfid2',
'ra_limit','hb_limit', 'sos'];
const allowedFieldsForCreate = ['imei', 'activation_time', 'contact_no', 'created_at', 'device_type', 'driver_contact', 'driver_name', 'expiry_time',
	'icon', 'ip', 'last_modified', 'last_modified_by', 'manufecturer', 'name', 'pooled', 'reg_no', 'remarks', 'sim_no', 'sim_provider',
	'sn', 'status', 'user_id', 'user_role', 'on_trip','driver_name2','rfid1','rfid2','ra_limit','hb_limit', 'sos'];
Device.getDevice = function (request, callback) {
	let sId, sKey;
	if (request.request === 'device_by_imei') {
		sId = parseInt(request.imei);
		sKey = 'imei';

	} else if (request.request === 'device_by_uid') {
		sId = request.selected_uid;
		sKey = 'user_id';
	} else if (request.request === 'device_by_reg_no') {
		sId = request.reg_no;
		sKey = 'reg_no';
	}
	const query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE ' + sKey + ' = ?';
	cassandraDbInstance.execute(query, [sId], {
		prepare: true
	}, function (err, result) {
		if (err) {
			winston.error('Device.getDevice', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(err, []);
			return;
		}
		if (result && result.rows) {
			let device;
			if (request.request === 'device_by_imei') {
				device = new Device(result.rows[0]);
			} else if (request.request === 'device_by_uid' || request.request === 'device_by_reg_no') {
				device = result.rows;
				for (const key in device) {
					device[key].datetime = device[key].location_time;
				}
			}
			callback(err, device);
		}

	});
};

Device.getAllDevices = function (callback) {
	let lastDate = new Date();
	lastDate.setFullYear(lastDate.getFullYear() - 1);
    const query = 'SELECT imei,ip,device_type,port,reg_no,user_id FROM ' + database.table_device_inventory + ' WHERE positioning_time > ? ALLOW FILTERING';
    const options = { prepare : true , fetchSize : 1000 };
    let allDevices = [];
    cassandraDbInstance.eachRow(query, [lastDate], options, function (n, row) {
         allDevices.push(new Device(row));
        }, function (err, result) {
        if (err) {
            winston.error('Device.getAllDevices', err);
            callback(err);
            return;
        }
            if (result.nextPage) {
                result.nextPage();
            }else{
                callback(null,allDevices);
			}
        });
};

Device.getDeviceStatus = function (sIMEI, callback) {
	if (sIMEI instanceof Array) sIMEI = sIMEI.toString();
	const query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei IN (' + sIMEI + ' )';
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('Device.getDeviceStatus', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(err, []);
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows);
		}

	});
};

Device.updateDevice = function (device, callback) {
	device.last_modified = Date.now();
	device.last_modified_by = device.login_uid;
	const oQueryParam = crudUtil.prepareUpdateQuery(device, allowedFieldsForUpdate);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	sQuery = 'UPDATE ' + database.table_device_inventory + ' SET ' + sQuery + ' WHERE imei=' + parseInt(device.imei);
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Device.updateDevice', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, device);
	});
};

Device.getDevices = function (request, callback) {
	const sIMEI = request.devices.toString();
	const query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei IN (' + sIMEI + ')';
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('Device.getDevices', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(err, []);
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows);
		}

	});
};

Device.associateDeviceWithUser = function (request, callback) {
	const aQueries = [];
	const aParam = [];
	for (let dev = 0; dev < request.devices.length; dev++) {
		aParam.push(parseInt(request.devices[dev]), request.new_uid)
	}
	let getDeviceInventoryQuery1;
	if(request.isSelected_uid){
		getDeviceInventoryQuery1 = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei = ' + aParam[0] +  ' AND user_id =' +  "'" + request.selected_uid + "'";
	}else{
		getDeviceInventoryQuery1 = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei = ' + aParam[0];
	}
	const getDeviceInventoryQuery = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE imei = ' + aParam[0] +  ' AND user_id =' +  "'" + request.new_uid + "'";
	cassandraDbInstance.execute(getDeviceInventoryQuery1, [], function (err, result) {
		if (err) {
			winston.error('Device.associateDeviceWithUser', err);
			return callback(err, null);
		}
		if (result && result.rows && result.rows.length === 0) {
			winston.error(`Device not found with this user ${request.selected_uid}`);
			return callback(`Device not found with this user ${request.selected_uid}`,null);
		}
		if(result && result.rows && result.rows.length > 0){
			cassandraDbInstance.execute(getDeviceInventoryQuery, [], function (err, result) {
				if (err) {
					winston.error('Device.associateDeviceWithUser', err);
					return callback(err, null);
				}
				if (result && result.rows && result.rows.length > 0) {
					winston.error(`device already allocate to ${request.new_uid} you can not allocate again to same account`);
					return callback(`device already allocate to ${request.new_uid} you can not allocate again to same account`,null);
				}
				if(result && result.rows && result.rows.length === 0){
					const updateDeviceInventoryQuery = 'UPDATE ' + database.table_device_inventory + ' SET user_id = ?, pooled = ? WHERE imei = ?';
					for (let dev = 0; dev < request.devices.length; dev++) {
						aQueries.push({
							query: updateDeviceInventoryQuery,
							params: [request.new_uid, request.pooled, parseInt(request.devices[dev])]
						});
					}
					cassandraDbInstance.batch(aQueries, {prepare: true}, function (err, result) {
						if (err) {
							winston.error('Device.associateDeviceWithUser', err);
							return callback(err, null);
						}
						if (!result) {
							winston.error('Device.associateDeviceWithUser no result');
							return callback(err, null);
						}
						User.getUser(request.new_uid, function (err, res) {
							const response = {status: 'ERROR', message: ""};
							if (err) {
								response.message = err.toString();
							} else if (!res) {
								response.message = 'user not found';
							}else{
								let userData = res;
								let totalDevice = (userData.total_device || 0) + 1;
								let totalStock = (userData.stock || 0) + 1;
								const aParam = [];
								aParam.push(request.new_uid);
								const query1 = 'UPDATE ' + database.table_users + ' SET total_device = ' + totalDevice + ', stock =  ' +  totalStock + ' WHERE user_id = ?';
								cassandraDbInstance.execute(query1, aParam, {prepare: true});
							}
						});
						if(request.isSelected_uid){
							User.getUser(request.selected_uid, function (err, res) {
								const response = {status: 'ERROR', message: ""};
								if (err) {
									response.message = err.toString();
								} else if (!res) {
									response.message = 'user not found';
								}else{
									let userData = res;
									let totalStock = (userData.stock || 0) - 1;
									const aParam = [];
									aParam.push(request.selected_uid);
									const query1 = 'UPDATE ' + database.table_users + ' SET stock = ' + totalStock +  ' WHERE user_id = ?';
									cassandraDbInstance.execute(query1, aParam, {prepare: true});
								}
							});
						}
						return callback(err, result);
					});
				}
			});
		}
	});


};

Device.registerDevice = function (device, callback) {
	device.status = 'inactive';
	device.created_at = new Date();
	device.user_id = device.user_id || device.selected_uid || device.login_uid;
	const oRet = crudUtil.prepareCreateQuery(device, allowedFieldsForCreate);
	const query = 'INSERT INTO ' + database.table_device_inventory + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('Device.registerDevice', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		User.getUser(device.user_id, function (err, res) {
			const response = {status: 'ERROR', message: ""};
			if (err) {
				response.message = err.toString();
			} else if (!res) {
				response.message = 'user not found';
			}else{
				let userData = res;
				let totalDevice = (userData.total_device || 0) + 1;
				let totalStock = (userData.stock || 0) + 1;
				const aParam = [];
				aParam.push(device.user_id);
				const query1 = 'UPDATE ' + database.table_users + ' SET total_device = ' + totalDevice + ', stock =  ' +  totalStock + ' WHERE user_id = ?';
				cassandraDbInstance.execute(query1, aParam, {prepare: true});
			}
		});
		return callback(err, result);
	});


};

Device.registerDevicesBatch = function (deviceArr, callback) {
    const aQueries = [];
    for (let i = 0; i < deviceArr.length; i++) {
        const oRet = crudUtil.prepareCreateQuery(deviceArr[i], allowedFieldsForCreate);
        const query = 'INSERT INTO ' + database.table_device_inventory + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
        aQueries.push({
            query: query,
            params: oRet.aParam
        });
    }
    cassandraDbInstance.batch(aQueries, {prepare: true}, function (err, result) {
        if (err) {
            winston.error('Device.registerDeviceBatch', err);
            return callback(err, null);
        }
        if (!result) {
            winston.error('Device.registerDeviceBatch no result');
            return callback(err, null);
        }
        return callback(err, result);
    });
};

Device.removeDevicesForUserId = function (request, callback) {
	const aQueries = [];
	const updateDeviceInventoryQuery = 'UPDATE ' + database.table_device_inventory + ' SET user_id = ?, pooled = ? WHERE imei = ?';
	aQueries.push({
		query: updateDeviceInventoryQuery,
		params: [adminUser, request.pooled, parseInt(request.imei)]
	});
	cassandraDbInstance.batch(aQueries, {prepare: true}, function (err, result) {
		if (err) {
			winston.error('Device.deAssociateDeviceWithUser', err);
			return callback(err, null);
		}
		if (!result) {
			winston.error('Device.deAssociateDeviceWithUser no result');
			return callback(err, null);
		}
		User.getUser(adminUser, function (err, res) {
			const response = {status: 'ERROR', message: ""};
			if (err) {
				response.message = err.toString();
			} else if (!res) {
				response.message = 'user not found';
			}else{
				let userData = res;
				let totalDevice = (userData.total_device || 0) + 1;
				let totalStock = (userData.stock || 0) + 1;
				const aParam = [];
				aParam.push(adminUser);
				const query1 = 'UPDATE ' + database.table_users + ' SET total_device = ' + totalDevice + ', stock =  ' +  totalStock + ' WHERE user_id = ?';
				cassandraDbInstance.execute(query1, aParam, {prepare: true});
			}
		});
		User.getUser(request.selected_uid, function (err, res) {
				const response = {status: 'ERROR', message: ""};
				if (err) {
					response.message = err.toString();
				} else if (!res) {
					response.message = 'user not found';
				}else{
					let userData = res;
					let totalDevice = (userData.total_device || 0) - 1;
					let totalStock = (userData.stock || 0) - 1;
					const aParam = [];
					aParam.push(request.selected_uid);
					const query1 = 'UPDATE ' + database.table_users + ' SET total_device = ' + totalDevice + ', stock = ' + totalStock +  ' WHERE user_id = ?';
					cassandraDbInstance.execute(query1, aParam, {prepare: true});
				}
		});
		return callback(err, result);
	});
};

Device.getRegNo = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT imei, reg_no FROM ' + database.table_device_inventory + ' WHERE imei IN (' + device_id.join(', ');
	} else {
		query = 'SELECT imei, reg_no FROM ' + database.table_device_inventory + ' WHERE imei = ' + device_id;
	}
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('Device.getRegNo', err);
			return callback(err);
		}
		callback(err, result.rows);
	});
};

Device.getMileageReport = function (device_id, start_time, end_time, callback) {
	const asyncTasks = [];
	let yday, today;
	end_time = end_time || Date.now();
	asyncTasks.push(function (cb) {
		if (dateUtil.getDuration(start_time, dateUtil.getMorning(Date.now())) < 0) return cb();
		BPromise.promisify(Device.getMileageReportOld)(device_id, start_time, dateUtil.getMorning(end_time))
			.then(function (res) {
				yday = res;
			})
			.error(function (err) {
			})
			.then(function () {
				cb(null);
			});
	});
	asyncTasks.push(function (cb) {
		if (dateUtil.getDuration(end_time, dateUtil.getMorning(Date.now())) < 0) return cb();
		BPromise.promisify(Device.getMileageReportToday)(device_id, dateUtil.getMorning(Date.now()), end_time)
			.then(function (res) {
				today = res;
			})
			.error(function (err) {
			})
			.then(function () {
				cb(null);
			});
	});
	async.parallel(asyncTasks, function () {
		let res = [];
		if (yday) res = res.concat(yday);
		if (today) res = res.concat(today);
		if (res.length === 0) return callback('no data');
		return callback(null, res);
	});
};

Device.getMileageReportToday = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive IN (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei = ' + device_id + ' AND drive IN (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime() + ' ORDER BY drive';
	}
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('Device.getMileageReport', err);
			return callback(err);
		}
		for (const key in result.rows) {
			if (!result.rows[key].idle) result.rows[key].idle = false;
		}
		callback(err, result.rows);
	});
};

Device.getMileageReportOld = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive IN (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei = ' + device_id + ' AND drive IN (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime() + ' ORDER BY drive';
	}
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('Device.getMileageReport', err);
			return callback(err);
		}
		for (const key in result.rows) {
			if (!result.rows[key].idle) result.rows[key].idle = false;
		}
		callback(err, result.rows);
	});
};

Device.getPlayback = function (device_id, start_time, end_time, callback) {
	const query = 'SELECT * FROM ' + database.table_drives_and_stops + ' WHERE imei = ' + device_id + ' AND drive in (true) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime() + ' ORDER BY drive';
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('Device.getPlayback', err);
			return callback(err);
		}
		callback(err, result.rows);
	});
};

Device.getOverspeedReport = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_report_overspeed + ' WHERE imei IN (' + device_id.join(', ') + ') AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_report_overspeed + ' WHERE imei = ' + device_id + ' AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time <= ' + new Date(end_time).getTime() + ' ORDER BY start_time';
	}
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('Device.getOverspeedReport', err);
			return callback(err);
		}
		callback(err, result.rows);
	});
};

Device.getAggregatedDAS = function (device_id, start_time, end_time, callback) {
	let query;
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_aggregated_drives_and_stops + ' WHERE imei = ' + device_id + ' AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	}
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err) {
			winston.error('Device.getAggregatedDAS', err);
			return callback(err);
		}
		for (const key in result.rows) {
			if (!result.rows[key].idle) result.rows[key].idle = false;
		}
		callback(err, result.rows);
	});
};

Device.getAdasRefined = function (device_id, start_time, end_time, callback) {
	let query;
    const options = { prepare : true , fetchSize : 3000 };
	if (device_id instanceof Array) {
		query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	} else {
		query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei = ' + device_id + ' AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
	}
	cassandraDbInstance.execute(query, [], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err || !result.rows || result.rows.length === 0) {
			winston.error('Device.getAdasRefined', err);
			return callback(err);
		}
		callback(err, result.rows);
	});
};
Device.getAdasRefinedNew = function (device_id, start_time, end_time, callback) {
    let query;
    if (device_id instanceof Array) {
        query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei IN (' + device_id.join(', ') + ') AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
    } else {
        query = 'SELECT * FROM ' + database.table_adas_refined + ' WHERE imei = ' + device_id + ' AND drive in (true, false) AND start_time >= ' + new Date(start_time).getTime() + ' AND start_time < ' + new Date(end_time).getTime();
    }
    const options = { prepare : true , fetchSize : 3000 };
    let adasData = [];
    cassandraDbInstance.eachRow(query, [],options, function (n, row) {
        adasData.push(row);
        },function (err, result) {
        if (err) {
            winston.error('Device.getAdasRefinedNew', err);
            return callback(err);
        }
		if (result.nextPage) {
            result.nextPage();
        }else{
             callback(err, adasData);
        }
    });
};

Device.getDeviceList = function (request, callback) {
	const oConfig = {
		prepare: 1
	};
	if (request.pageState) {
		oConfig.pageState = new Buffer(request.pageState);
	}
	if (request.row_count) {
		oConfig.fetchSize = request.row_count;
	} else {//default no of rows 30
		oConfig.fetchSize = 30;
	}

	let query = 'SELECT imei,reg_no,user_id,name,device_type,sim_no,status,location_time, positioning_time, lat,lng,speed,expiry_time,activation_time,ip,sn FROM ' + database.table_device_inventory;
	const aParams = [];
	const aQParam = [];
	/***If imei list is not provided ***/
	if (request.imei) {
		//query = query + " imei=? ";
		aParams.push(request.imei);
		aQParam.push(" imei=? ");
	}
	if (request.reg_no) {
		// query = query + " AND reg_no=? ";
		aParams.push(request.reg_no);
		aQParam.push(" reg_no=? ");
	}
	if (request.status) {
		//  query = query + " AND status=? ";
		aParams.push(request.status);
		aQParam.push(" status=? ");
	}
	if (request.user_id) {
		// query = query + " AND user_id=? ";
		aParams.push(request.user_id);
		aQParam.push(" user_id=? ");
	}
	if (request.location_time) {
		// query = query + " AND location_time < ? ";
		aParams.push(new Date(request.location_time).getTime());
		aQParam.push(" location_time < ? ");
	}
	if (request.positioning_time) {
		// query = query + " AND positioning_time < ? ";
		aParams.push(new Date(request.positioning_time).getTime());
		aQParam.push(" positioning_time < ? ");
	}
	for (let q = 0; q < aQParam.length; q++) {
		if (q === 0) {
			query = query + " WHERE " + aQParam[q];
		} else {
			query = query + " AND " + aQParam[q];
		}
	}
	if (request.reg_no || request.status || request.user_id || request.location_time || request.positioning_time) {
		query = query + " ALLOW FILTERING";
	}
	// winston.info(request,query,aParams);
	cassandraDbInstance.execute(query, aParams, oConfig, function (err, result) {
		if (err) {
			winston.error('Device.getDeviceList', err);
			callback(err);
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
			//    winston.info(result.rows.length);
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}
		callback(err, oRes);
	});
};

Device.dailyUptime = function (request, callback) {
	const query = 'select * from ' + database.table_adas_daily + ' where date = ?';
	cassandraDbInstance.execute(query, [dateUtil.getYYYYMMDD(request.date)], {
		prepare: true,
		fetchSize: 0
	}, function (err, result) {
		if (err || !result.rows || result.rows.length === 0) {
			winston.error('Device.dailyUptime', err);
			return callback(err);
		}
		callback(err, result.rows);
	});
};

Device.getDevicesWithinPointRadius = function (request,callback) {
    if(!request.user_id && !request.login_uid) return callback('no user id');
    let radius = request.radius;
    let point = {latitude:Number(request.lat),longitude:Number(request.lng)};
    let user_id = request.user_id;
    let minMaxRectBounds = geozoneCalculator.getBoundingRectangle(point,radius/1000);
    const aParams = [user_id,minMaxRectBounds.minLat,minMaxRectBounds.maxLat,minMaxRectBounds.minLng,minMaxRectBounds.maxLng];
    const query = "SELECT * from " + database.table_device_inventory +" WHERE user_id = ? AND lat >= ? AND lat<= ? AND lng >= ? AND lng <= ? ALLOW FILTERING";
    cassandraDbInstance.execute(query, aParams, {
        prepare: true,
        fetchSize: 0
    }, function (err, result) {
        if (err || !result.rows || result.rows.length === 0) {
            winston.error('Device.getDevicesWithinRadius', err);
            return callback(err);
        }else{
            //refine results
            let finalResult = {data:[]};
            let minDist=Number.POSITIVE_INFINITY;
            let nearest ;
            for (let i=0;i<result.rows.length;i++){
                let loc = {latitude:result.rows[i].lat,longitude:result.rows[i].lng};
                let dist = geozoneCalculator.getDistance(loc,point);
                if (dist<=radius){
                    result.rows[i].dist=dist;finalResult.data.push(result.rows[i]);
                    if (dist<minDist){minDist=dist;nearest=result.rows[i];}
                }

            }
            finalResult.nearest=nearest;
            return callback(err, finalResult);
        }
    });
};

Device.fetchDeviceById = async function (userId , callback) {
	const query = 'SELECT * FROM ' + database.table_device_inventory + " WHERE user_id = "+userId+"";
	cassandraDbInstance.execute(query,[], function (err, result) {
		if (err) {
			winston.error('User.getAllUsers', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null, []);
			return;
		}
		if (result && result.rows) {
			for (const key in result.rows) {
				result.rows[key] = new User(result.rows[key]);
			}
			callback(err, result.rows);
		}
	});
};

Device.fetchDeviceByUserId = async function (userId , callback) {
	const query = 'SELECT * FROM ' + database.table_device_inventory + " WHERE user_id = "+userId+"";
	cassandraDbInstance.execute(query,[], function (err, result) {
		if (err) {
			winston.error('User.getAllUsers', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null, []);
			return;
		}
		if (result && result.rows) {
			for (const key in result.rows) {
				result.rows[key] = new Device(result.rows[key]);
			}
			callback(err, result.rows);
		}
	});
};




module.exports = Device;

