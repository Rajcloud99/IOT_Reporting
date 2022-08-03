/**
 * Created by Bharath on 10-03-2017.
 */

const BPromise = require('bluebird');
const net = require('net');
const split = require('split');
const User = BPromise.promisifyAll(require('./model/user'));
const Device = BPromise.promisifyAll(require('./model/device'));
const winston = require('./utils/logger');
const sockets = {};

const port = 6000;

const server = net.createServer(function (socket) {
    let ip;
	if(socket && socket.remoteAddress && socket.remoteAddress.split){
        ip = socket.remoteAddress.split(':');
        ip = ip[ip.length - 1];
	}else{
        ip =socket.remoteAddress;
	}
	if(ip && ip.length){
        ip = ip[ip.length - 1];
        sockets[ip] = socket;
        fetchAllowedDevices(ip);
        socket.id = Math.floor(Math.random() * 1000);
        winston.info('socket server connected:', socket.id, ip);
	}
	socket.setKeepAlive(true, 1000);

	const stream = socket.pipe(split());
	stream.on('data', function (data) {
		// winston.info(data);
		try {
			data = JSON.parse(data);
			handleData(data, socket);
		} catch (err) {
		}
	});

	socket.on('end', function () {
		// This will emit events error and close, so no need to handle close separately
		socket.destroy('device side end');
	});

	socket.on('error', function (err) {
		winston.error('ss err', err);
		// do nothing
	});

	socket.setTimeout(6 * 60 * 1000, function () {
		// This will emit events error and close, so no need to handle close separately
		socket.destroy('timeout');
	});

}).listen(port);

function fetchAllowedDevices(ip) {
	User.getUserFromIpAsync(ip)
		.then(function (user) {
			// winston.info('user', JSON.stringify(user));
			sockets[ip].user_id = user.user_id;
			const request = {};
			request.request = 'device_by_uid';
			request.selected_uid = user.user_id;
			return Device.getDeviceAsync(request);
		})
		.then(function (devices) {
			sockets[ip].allowed_devices = [];
			for (let i = 0; i < devices.length; i++) {
				sockets[ip].allowed_devices.push(Number(devices[i].imei));
			}
			// winston.info('allowed devices', JSON.stringify(sockets[ip].allowed_devices));
		})
		.error(function () {
		});
}

// close will be immediately followed
server.on('error', function (err) {
	winston.error('socket server error', err);
});

server.on('close', function (err) {
	winston.error('socket server close', err);
});

function handleData(data, socket) {
	sendMessage(socket, 'heartbeat', data);
}

function sendMessage(socket, type, message) {
	if (socket.destroyed) {
		// winston.info('unable to send message to socket', socket.id);
		return;
	}
	message = {type: type, msg: message};
	// winston.info('sending', JSON.stringify(message));
	socket.write(Buffer.from(JSON.stringify(message) + '\n'));
}

class clientData {
	constructor(data) {
		this.imei = data.device_id;
		this.datetime = new Date(data.datetime).toISOString();
		this.lat = data.lat;
		this.lng = data.lng;
		this.speed = data.speed;
		this.course = data.course;
	}
}

exports.sendPingToSocket = function (data, device) {
	for (let key in sockets) {
		if (sockets[key].allowed_devices && sockets[key].allowed_devices.indexOf(Number(data.data.device_id)) > -1) {
			sendMessage(sockets[key], 'location', new clientData(data.data));
			break;
		}
	}
};

exports.disconnect = function () {
	for (const key in sockets)
		sockets[key].end();
};

exports.close = function () {

};

winston.info('===========================================================\nListening for Location Server on 6000\n=================================================================');
