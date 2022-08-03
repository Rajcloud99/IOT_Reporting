const User = require('../model/user');
const smsUtil = require('../utils/smsUtils');

function getUser(request, callback) {
	User.getUser(request.user_id, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'user not found';
		}else if (res && res.access && res.access===false) {
            response.message = 'access disabled by admin';
        }else if (request.loadUsers || (res.validPassword(request.password))) {
			response.status = 'OK';
			response.message = 'authenticated';
			delete res.password;
			response.data = res;
		} else {
			response.message = 'wrong password';
		}
		return callback(response);
	});
}

function getSubUsers(request, callback) {
	User.getUser(request.sub_user, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'sub users not found';
		} else {
			response.status = 'OK';
			response.message = 'sub user info';
			delete res.password;
			response.data = res;
		}
		return callback(response);
	});
}

function registerUserHelper(request, callback) {
	request.status = 'active';
	User.registerUser(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'user registration failed';
		} else {
			response.status = 'OK';
			response.message = 'User registration done succefully';
			response.data = res;
		}
		return callback(response);
	});
}
function registerUser(request, callback) {
	function checkUserInDBCB(res) {
		if (res.status === 'OK') {
			registerUserHelper(request, callback);
		} else {
			const resp = {status: 'ERROR', meassage: 'user already exist in DB.', data: request};
			callback(resp);
		}
	}

	const oReq = {user_id: request.user_id};
	checkUserId(oReq, checkUserInDBCB);
}
function prepareDeviceData(request, old_user) {
	const aDevices = old_user.devices || [];
	const aIndexToBeRemoved = [], aNewDevices = [], aRemoveDevices = [];
	for (let i = 0; i < aDevices.length; i++) {
		for (let k = 0; k < request.devices.length; k++) {
			if (aDevices[i].imei === request.devices[k]) {
				aIndexToBeRemoved.push(i);
				break;//break inner loop
			}
		}
	}
	for (let n = 0; n < aDevices.length; n++) {
		if (aIndexToBeRemoved.indexOf(n) > -1) {
			//	aDevces[n].user_id = request.new_uid;
			aRemoveDevices.push(aDevices[n]);
		} else {
			aNewDevices.push(aDevices[n]);
		}
	}
	const oDeviceData = {
		'aNewDevices': aNewDevices,
		'aRemoveDevices': aRemoveDevices
	};
	return oDeviceData;
}

function associateDeviceWithUser(request, callback) {
	User.associateDeviceWithUser(request, function (err, res) {
		const response = {};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'associate device request failed';
		} else {
			response.status = 'OK';
			response.message = 'device association done successfully.';
			response.data = res;
			// winston.info(JSON.stringify(response));
			return callback(response);
		}
	});
}

function checkUserId(request, callback) {
	User.getUser(request.user_id, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.status = 'OK';
			response.message = 'user_id is available';
			response.isAvailable = true;
		} else if (res) {
			response.status = 'ERROR';
			response.message = "user id not available";
			response.isAvailable = false;
		}
		return callback(response);
	});
}

function updateUser(request, callback) {
	User.updateUser(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'User update  failed';
		} else {
			response.status = 'OK';
			response.message = 'User update done succefully';
			response.data = res;
		}
		return callback(response);
	});
}

function forgotPassword(request, callback) {
	User.getUser(request.user_id, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'user not found';
		} else {
			response.status = 'OK';
			response.message = 'Your password has been sent to your registered email and  mobile number';
			const message = 'Password  : ' + res.password + ' for GPSGAAGI. Download our android application from  https://goo.gl/r5WJRb';
			smsUtil.sendSMS(res.mobile, message);
		}
		return callback(response);
	});
}

function changePassword(request, callback) {
	User.getUser(request.selected_uid, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'user not found';
			return callback(response);
		} else if (res.password !== request.old_password) {
			response.message = 'Your old password does not match';
			return callback(response);
		} else {
			const fn_cb = function (resss) {
				if (resss.status === 'OK') {
					response.status = 'OK';
					response.message = 'Your password has been changed successfully.';
					return callback(response);
				} else {
					response.message = resss.message;
					return callback(response);
				}
			};
			request.password = request.new_password;
			updateUser(request, fn_cb);
		}

	});
}

function removeSubUser(request, callback) {
	User.getUser(request.selected_uid, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'user not found';
			return callback(response);
		} else {
			// aSubUsers = res.sub_users || [];
			const newSubUsers = [];
			for (let i = 0; i < res.sub_users.length; i++) {
				if (res.sub_users[i].user_id === request.remove_uid) {
					res.sub_users.splice(i, 1);
					break;
				}
			}
			const fn_cb = function (errrr, resss) {
				if (errrr) {
					response.message = errrr.toString();
				} else if (!resss) {
					response.message = 'removal of user is failed.';
				} else {
					response.status = 'OK';
					response.message = 'Removal of user done successfully.';
					response.data = resss;
					return callback(response);
				}
			};
			request.sub_users = res.sub_users;
			User.removeUserRelation(request, fn_cb);
		}
	});
}

module.exports.userMISSettings = function (request, requestType, callback) {
	if (requestType === "get") {
		User.getMISSettings(request.selected_uid, function (err, data) {
			const response = {status: 'ERROR', message: ""};
			if (err) {
				response.message = err.toString();
				return callback(response);
			} else {
				const response = {};
				response.status = "OK";
				response.message = "MIS settings found for user";
				response.data = data;
				return callback(response);
			}
		});
	} else if (requestType === "update" || requestType === "add") {
		User.addOrUpdateMISSettings(request, function (err, data) {
			const response = {status: 'ERROR', message: ""};
			if (err) {
				response.message = err.toString();
				return callback(response);
			} else {
				const response = {};
				response.status = "OK";
				response.message = "MIS settings updated successfully";
				response.data = data;
				return callback(response);
			}
		});
	}
};

module.exports.getUser = getUser;
module.exports.getSubUsers = getSubUsers;
module.exports.registerUser = registerUser;
module.exports.associateDeviceWithUser = associateDeviceWithUser;
module.exports.checkUserId = checkUserId;
module.exports.forgotPassword = forgotPassword;
module.exports.changePassword = changePassword;
module.exports.updateUser = updateUser;
module.exports.removeSubUser = removeSubUser;
