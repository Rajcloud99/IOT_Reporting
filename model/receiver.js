/**
 * @Author: bharath
 * @Date:   2017-01-13
 */

const winston = require('../utils/logger');
const net = require('net');
const split = require('split');
const feedtype = require('../config').feedtype;
const socketmanager = require('../utils/socketmanager');
const config = require("../config");
let locationServer;
if (config.driver && config.driver.startServer) {
	locationServer = require('../locationServer');
}else {
	console.log('locationServer service is NOT connected ' + config.receiverConnect.port);
}

class Receiver {
	constructor(ip) {
		this.ip = ip;
		this.cache = [];
	}

	static get port() {
		return 5000;
	}

	sendMessage(message) {
		if (message) this.cache.push(JSON.stringify(message));
		if (this.socket && this.socket.connecting) return;
		if (!this.socket || this.socket.destroyed) return this.connect();

		while (this.cache.length > 0) {
			// winston.info('sending', this.cache[0]);
			this.socket.write(Buffer.from(this.cache[0] + '\n'));
			this.cache.splice(0, 1);
		}
	}

	connect() {
		const _this = this;
		this.socket = new net.Socket();
		this.socket.connect(Receiver.port, this.ip, function () {
            console.log('Receiver Connected at port and ip ',Receiver.port, this.ip);
			_this.sendMessage(null);
		});
		const stream = this.socket.pipe(split());
		stream.on('data', function (data) {
			// winston.info(data);
			try {
				data = JSON.parse(data);
				_this.handleData(data);
			} catch (err) {
				winston.error('json parse err connect receiver ', err);
			}
		});

		this.socket.on('error', function (err) {
			// do nothing since close will be called after this
			winston.error('rs err', err);
		});

		this.socket.on('close', function (err) {
			winston.error('rs err close', err);
			// _this.connect();
		});

		this.socket.on('end', function (err) {
			winston.error('rs err end', err);
			// _this.connect();
		});

	}

	handleData(data) {
		switch (data.type) {
			case 'message':
				switch (data.msg.request) {
					case "live_feed":
						socketmanager.sendMessageToFeedManager(data.msg);
						if(locationServer && locationServer.sendPingToSocket){
							locationServer.sendPingToSocket(data.msg);
						}

						break;
                    case "live_feedV2":
                        socketmanager.sendMessageToFeedManager(data.msg);
						if(locationServer && locationServer.sendPingToSocket){
							locationServer.sendPingToSocket(data.msg);
						}
                        break;
					case "commands":
						socketmanager.sendMessageToCommandManager(data.msg);
						break;
					case "alerts":
						socketmanager.sendMessageToFeedManager(data.msg);
						break;
				}

				break;
			case 'device_connected':

				break;
			case 'device_disconnected':

				break;
			case 'heartbeat':
				// winston.info('got hb ack', data.msg);
				break;
		}
	}

	sendHeartbeat() {
		const id = Math.floor(Math.random() * 1000);
		// winston.info('sending hb', id);
		this.sendMessage({ft: feedtype.heartbeat, id: id});
	}

}

module.exports = Receiver;
