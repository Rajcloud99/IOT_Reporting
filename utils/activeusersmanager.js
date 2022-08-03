/**
 * Created by Bharath on 12-05-2016.
 */

const BPromise = require('bluebird');
const User = BPromise.promisifyAll(require('../model/user'));
const Device = BPromise.promisifyAll(require('../model/device'));
const winston = require('../utils/logger');

class ActiveUsersManager {

	constructor() {
		this.activeUsers = {};
		this.activeDevices = {};
	}

	checkAuthentication(user_id, token) {
		return !!(this.activeUsers[user_id] && this.activeUsers[user_id].token === token);
	}

	getTokenByUid(user_id) {
		return this.activeUsers[user_id].token;
	}

	addUser(user_id, user) {
		// winston.info('adding user:' + user_id);
		this.activeUsers[user_id] = user;
	}

	addDevice(device) {
		// winston.info('adding user:' + user_id);
		this.activeDevices[device.imei] = device;
	}

	getUser(user_id) {
		return this.activeUsers[user_id];
	}

	getDevice(user_id, imei) {
		let devices = [];
		if (this.activeUsers[user_id]) {
			devices = this.activeUsers[user_id].associatedDevices;
		}
		for (let i = 0; i < devices.length; i++) {
			if (devices[i].imei && devices[i].imei.toString() === imei) {
				return (devices[i]);
			}
		}
		return false;
	}

	getDeviceWithIMEI(imei) {
		return this.activeDevices[parseInt(imei)];
	}

	loadAllUsers(done) {
		User.getAllUsersAsync().then(users => {
			for (let i = 0; i < users.length; i++)
				this.activeUsers[users[i].user_id] = users[i];
			done(null, users.length);
		}).error(err => {
			winston.error('LoadAllUsers', err);
			done(err);
		});
	}

	loadAllDevices(done) {
		Device.getAllDevicesAsync().then(devices => {
			for (let i = 0; i < devices.length; i++)
				this.activeDevices[parseInt(devices[i].imei)] = devices[i];
			done(null, devices.length);
		}).error(err => {
			winston.error('LoadAllDevices', err);
			done(err);
		});
	}

	getAllDevices() {
		return this.activeDevices;
	}

}

const aum = BPromise.promisifyAll(new ActiveUsersManager());

module.exports = aum;
