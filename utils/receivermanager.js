/**
 * @Author: bharath
 * @Date:   2017-01-13
 */

const gpsService = require('../services/gpsService');
const Receiver = require('../model/receiver');
const serverConfig = require('../config');
const BPromise = require('bluebird');
const activeusersmanager = require('./activeusersmanager');
const feedtype = require('../config').feedtype;

class ReceiverManager {

	constructor() {
		this.receivers = {};
	}

	sendMessage(device_id, device_type, type, command_type, param) {
		BPromise.promisify(this.getServerIp)(device_id).then(server_ip => {
			// winston.info('serverip: '+server_ip);
			if (!server_ip) return;

			let message = {
				d: device_id,
				t: device_type,
				ft: type,
				c: command_type,
				p: param
			};

			// winston.info('sending to receiver', JSON.stringify(message));

			if (!this.receivers[server_ip]) {
				this.receivers[server_ip] = new Receiver(server_ip);
			}

			this.receivers[server_ip].sendMessage(message);

		});
	}

	getServerIp(device_id, callback) {
		if (serverConfig.isLocalReceiver) return callback(null, 'localhost');
		gpsService.getDeviceIp(device_id, server_ip => {
			callback(null, server_ip);
		});
	}

	sendHeartbeat() {
		for (let key in this.receivers) {
			this.receivers[key].sendHeartbeat();
		}
	}

	unregisterDeviceFeed(device_id, device_type) {
	}

	sendTripUpdate(imei) {
		this.sendUpdate(imei, feedtype.update_trip);
	}

	sendAlarmUpdate(imei) {
		this.sendUpdate(imei, feedtype.update_alarm);
	}

	sendUpdate(imei, type) {
		if(activeusersmanager.getDeviceWithIMEI(imei) &&  activeusersmanager.getDeviceWithIMEI(imei).device_type){
			require('../utils/receivermanager').sendMessage(imei, activeusersmanager.getDeviceWithIMEI(imei).device_type, type);
		}
	}

}

//const instance =  new ReceiverManager();
const instance = BPromise.promisifyAll(new ReceiverManager());
module.exports = instance;