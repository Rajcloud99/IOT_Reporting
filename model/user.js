const bcrypt = require('bcrypt-nodejs');
const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;

function User(oUser) {
	this.mobile = oUser.mobile;
	this.user_id = oUser.user_id;
	this.email = oUser.email;
	this.name = oUser.name;
	this.role = oUser.role;
	this.status = oUser.status;
	this.password = oUser.password;
	this.sub_users = oUser.sub_users;
	this.type = oUser.type;
	this.pan = oUser.pan;
	this.mobile_imeis = oUser.mobile_imeis;
	this.user_token = oUser.user_token;
	this.access = oUser.access;
	this.gps_view = oUser.gps_view;
	this.lms_token = oUser.lms_token;
	this.lms_url = oUser.lms_url;
	this.beat = oUser.beat;
	this.vehicle_groups = oUser.vehicle_groups;
	this.total_device = oUser.total_device;
	this.stock = oUser.stock;

	User.prototype.validPassword = function (pw) {
		console.log(pw,this.password);
		return pw === this.password;
	};
}
const allowedFieldsForCreate = ['user_id', 'comapany_name', 'email', 'last_modified', 'mobile', 'name', 'pan', 'password', 'role',
	'status', 'type', 'access'];
/*
const allowedFieldsForUpdate = ['mobile_imeis', 'comapany_name', 'email', 'last_modified', 'mobile', 'name', 'pan', 'password', 'role',
	'status', 'type', 'access','sub_user'
];
*/
const allowedFieldsForUpdate = ['sub_users','password'];

const prepareCreateQuery = function (oRequest) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oRequest) {
		if (allowedFieldsForCreate.indexOf(key) > -1) {
			aParam.push(oRequest[key]);
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

const prepareCreateQuery2 = function (createObj, allowedFieldsForCreation) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in createObj) {
		if (allowedFieldsForCreation.indexOf(key) > -1) {
			aParam.push(createObj[key]);
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

const prepareUpdateQuery = function (oAlarm) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oAlarm) {
		if (allowedFieldsForUpdate.indexOf(key) > -1) {
			aParam.push(oAlarm[key]);
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

const prepareUpdateQuery2 = function (oUpdate, allowedFieldsArray) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oUpdate) {
		if (allowedFieldsArray.indexOf(key) > -1) {
			aParam.push(oUpdate[key]);
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

User.getUser = function (user_id, callback) {
	const query = 'SELECT * FROM ' + database.table_users + ' WHERE user_id = ?';
	cassandraDbInstance.execute(query, [user_id], function (err, result) {
		if (err) {
			winston.error('User.getUser', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null);
			return;
		}
		if (result && result.rows) {
			const user = new User(result.rows[0]);
			callback(err, user);
		}

	});
};

User.getAllUsers = function (callback) {
	const query = 'SELECT user_id,role,access,type,company_name,ip,name,mobile,total_device,stock  FROM ' + database.table_users;
	cassandraDbInstance.execute(query, [], function (err, result) {
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

function addUserRelation(user, callback) {
	const sUser_relation = "[{mobile:" + user.mobile + ",user_id:'" + user.user_id + "',type:'" + user.type + "',role:'" + user.role + "',name:'" + user.name + "'}]";
	const query = 'UPDATE ' + database.table_users + ' SET sub_users = sub_users + ' + sUser_relation + ' WHERE user_id = ?';
	cassandraDbInstance.execute(query, [user.selected_uid], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('User.addUserRelation', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		const newUser = user;
		newUser.parent_user = user.selected_uid;
		delete newUser.password;
		return callback(err, newUser);
	});
}

User.removeUserRelation = function (user, callback) {
	const query = 'UPDATE ' + database.table_users + ' SET sub_users = ? WHERE user_id = ?';
	cassandraDbInstance.execute(query, [user.sub_users, user.selected_uid], {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('User.removeUserRelation', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		delete user.password;
		return callback(err, user);
	});
};

User.registerUser = function (user, callback) {
	user.created_at = Date.now();
	const oRet = prepareCreateQuery(user);
	const query = 'INSERT INTO ' + database.table_users + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		// winston.info('register user result', result);
		if (err) {
			callback(err, null);
			winston.error('User.registerUser', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return addUserRelation(user, callback);
		//return callback(err, result);
	});
};

User.updateUser = function (request, callback) {
	if (request.request !== 'change_password') {
		delete request.password;
		delete request.user_id;
	}
	request.selected_uid = request.update_uid || request.selected_uid || request.login_uid;
	request.last_modified = Date.now();
	request.last_modified_by = request.login_uid;
	const oQueryParam = prepareUpdateQuery(request);
	let sQuery = oQueryParam.sQuery;
	const aParam = oQueryParam.aParam;
	aParam.push(request.update_uid || request.selected_uid || request.login_uid);
	sQuery = 'UPDATE ' + database.table_users + ' SET ' + sQuery + ' WHERE user_id = ?';
	cassandraDbInstance.execute(sQuery, aParam, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('User.updateUser', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, User);
	});
};

User.updateUserRelation = function (user, callback) {
    const sUser_relation = "[{mobile:" + user.mobile + ",user_id:'" + user.user_id + "',type:'" + user.type + "',role:'" + user.role + "',name:'" + user.name + "'}]";
    const query = 'UPDATE ' + database.table_users + ' SET sub_users = sub_users + ' + sUser_relation + ' WHERE user_id = ?';
    cassandraDbInstance.execute(query, [user.selected_uid], {
        prepare: true
    }, function (err, result) {
        if (err) {
            callback(err, null);
            winston.error('User.addUserRelation', err);
            return;
        }
        if (!result) {
            return callback(err, null);
        }
        const newUser = user;
        newUser.parent_user = user.selected_uid;
        delete newUser.password;
        return callback(err, newUser);
    });
}
User.associateDeviceWithUser = function (request, oDeviceData, callback) {
	const aQueries = [];
	const aRemoveDevices = oDeviceData.aRemoveDevices;
	const aNewDevices = oDeviceData.aNewDevices;
	const removeDeviceQuery = 'UPDATE ' + database.table_users + ' SET devices = ? WHERE user_id = ?';
	const removeDeviceParams = [aNewDevices, request.old_uid];
	aQueries.push({
		query: removeDeviceQuery,
		params: removeDeviceParams
	});
	const addDeviceQuery = 'UPDATE ' + database.table_users + ' SET devices = devices + ? WHERE user_id = ?';
	const addDeviceParams = [aRemoveDevices, request.new_uid];
	aQueries.push({
		query: addDeviceQuery,
		params: addDeviceParams
	});
	const updateDeviceInventoryQuery = 'UPDATE ' + database.table_device_inventory + ' SET user_id = ? WHERE imei = ?';
	for (let dev = 0; dev < aRemoveDevices.length; dev++) {
		aQueries.push({
			query: updateDeviceInventoryQuery,
			params: [request.new_uid, parseInt(aRemoveDevices[dev].imei)]
		});
	}
	cassandraDbInstance.batch(aQueries, {
		prepare: true
	}, function (err, result) {
		if (err) {
			callback(err, null);
			winston.error('User.associateDeviceWithUser', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});

};

User.getAllAssociatedDevicesForUser = function (user_id, callback) {
	const query = 'SELECT * FROM ' + database.table_device_inventory + ' WHERE user_id = ' + "'" + user_id + "'";
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('User.getAllAssociatedDevices', err);
			callback(err, []);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null, []);
			return;
		}
		if (result && result.rows) {
			const imeiList = [];
			for (let i = 0; i < result.rows.length; i++) {
				imeiList[i] = result.rows[i].imei;
			}
			callback(err, imeiList);
		}
	});
};

User.getUsersWithReportSubscription = function (user_id, callback) {
	let query,aParams=[];
	if (user_id) {
		query = 'SELECT * FROM ' + database.table_report_user_config + ' WHERE user_id = ?';
        aParams.push(user_id);
	} else {
		query = 'SELECT * FROM ' + database.table_report_user_config;
	}
	cassandraDbInstance.execute(query, aParams, function (err, result) {
		if (err) {
			winston.error('User.getUsersWithActiveReportSubscritption', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null);
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows);
		}
	});
};

User.getMISSettings = function (user_id, callback) {
	const query = 'SELECT * FROM ' + database.table_report_user_config + ' WHERE user_id = ' + "'" + user_id + "'";
	// winston.info(query);
	cassandraDbInstance.execute(query, [], function (err, result) {
		if (err) {
			winston.error('User.getMISSettings', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback(null, {});
			return;
		}
		if (result && result.rows) {
			callback(err, result.rows[0]);
		}
	});
};

const allowedFieldsForUserMISInfoCreation = ['user_id', 'daily_activity', 'daily_hault', 'daily_mileage',
	'daily_over_speed', 'daily_track_sheet', 'weekly_hault', 'weekly_mileage',
	'weekly_overspeed',
	'emails', 'monthly_hault', 'monthly_mileage'];

User.addOrUpdateMISSettings = function (request, callback) {
	request.user_id = request.selected_uid || request.login_uid;
	request.created_at = Date.now();
	const oRet = prepareCreateQuery2(request, allowedFieldsForUserMISInfoCreation);
	const query = 'INSERT INTO ' + database.table_report_user_config + ' (' + oRet.sQuery + ') VALUES(' + oRet.sValues + ')';
	cassandraDbInstance.execute(query, oRet.aParam, {
		prepare: true
	}, function (err, result) {
		// winston.info('register user mis result', result);
		if (err) {
			callback(err, null);
			winston.error('User.registerUserMIS', err);
			return;
		}
		if (!result) {
			return callback(err, null);
		}
		return callback(err, result);
	});

};

User.getUserFromIp = function (ip, callback) {
	const query = 'SELECT * FROM ' + database.table_users + ' WHERE ip = ?';
	cassandraDbInstance.execute(query, [ip], function (err, result) {
		if (err) {
			winston.error('User.getUserFromIp', err);
			callback(err);
			return;
		}
		if (result && result.rows && result.rows.length === 0) {
			callback('not found');
			return;
		}
		if (result && result.rows) {
			const user = new User(result.rows[0]);
			callback(err, user);
		}
	});
};

User.getUserById = function (request, callback) {
	request.selected_uid = request.selected_uid || request.login_uid;
	const oConfig = {
		prepare: 1
	};
	const aParams = [prepareString(request.subUser)];
	let query = "SELECT mobile,type, user_id ,email,name, total_device,stock , password FROM  " + database.table_users +  " WHERE user_id IN ("+aParams+")";
	cassandraDbInstance.execute(query,oConfig, function (err, result) {
		if (err) {
			winston.error('User.getUserById', err);
			callback(err);
			return;
		}
		callback(err, result.rows);

	});
};

function prepareString(aUsers){
	str='';
	for(let i=0;i<aUsers.length;i++){
		if(i==0){
			str= "'"+aUsers[i]+"'";
		} else{
			str= str+",'"+aUsers[i]+"'";
		}
	}
	return str;
}

User.getAllUsers1 = function (callback) {
	let str1 = 'harsh';
	let str = "'" + str1 + "'";
	const query1 = 'SELECT user_id,type,name,sub_users,total_device,stock  FROM users WHERE user_id = ' + str;
	// const query = 'SELECT user_id,type,name,sub_users,total_device,stock  FROM ' + database.table_users;
	console.log(query1);
	cassandraDbInstance.execute(query1, [], function (err, result) {
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

module.exports = User;
