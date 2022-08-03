const RequestManager = require('./requestmanager');
const ss = require('socket.io-stream');
const requests = require('../config').requests;
const activeusersmanager = require('./activeusersmanager');

class SocketManager {

	constructor() {
		this.sockets = {};
	}

	sendMessageToCommandManager(msg) {
		for (let key in this.sockets) {
			if (!this.sockets[key].requestmanager) continue;
			this.sockets[key].requestmanager.commandManager.handleCommand(msg);
		}
	}

	sendMessageToFeedManager(msg) {
		for (let key in this.sockets) {
			if (!this.sockets[key].requestmanager) continue;
			this.sockets[key].requestmanager.feedManager.handleFeed(msg);
		}
	}

	manage(socket) {
		// winston.info('managing socket:'+socket.id);
		this.sockets[socket.id] = socket;
		let ar;
		let loadUsersCount = 0;
		socket.getRequestCallback = response => {
			if (response) {
				if (response.request !== requests.authentication)
					return socket.emit('message', JSON.stringify(response));
				ar = response;
			}
		};

		socket.loadUsers = user => {
			if (!user) {
				socket.emit('message', JSON.stringify(ar));
			} else {
				if (user.sub_users === null) {
					if (loadUsersCount === 0) {
						socket.emit('message', JSON.stringify(ar));
					}
					return;
				}
				loadUsersCount++;
				let allSubusersLoaded = true;
				for (const key in user.sub_users) {
					if (activeusersmanager.getUser(user.sub_users[key].user_id)) {
						continue;
					}
					allSubusersLoaded = false;
					const request = {};
					request.request = requests.authentication;
					request.loadUsers = true;
					request.user_id = user.sub_users[key].user_id;
					socket.authorizationmanager.authorize(request,
						(authenticated, authorized, authenticationResponse) => {
							loadUsersCount--;
							socket.loadUsers(authenticationResponse.data);
						});
				}
				if (allSubusersLoaded) {
					return socket.emit('message', JSON.stringify(ar));
				}
			}

		};

		socket.on('message', oMessage => {
			oMessage = JSON.parse(oMessage);
			// winston.info('new request from socket id'+ socket.id);
			if (oMessage.request === requests.authentication) oMessage.loadUsers = null;
			socket.authorizationmanager.authorize(oMessage, (authenticated, authorized, authenticationResponse) => {
				if (authenticationResponse !== undefined) {
					if (authenticationResponse.public_service) {
						delete authenticationResponse.public_service;
						socket.getRequestCallback(authenticationResponse);
						return;
					}
					/*
					if (authenticationResponse.message === 'authenticated') {
						// winston.info('new requestmanager on login');
						socket.requestmanager = new RequestManager(authenticationResponse.data.user_id, socket.getRequestCallback);
					}*/
					socket.getRequestCallback(authenticationResponse);
					loadUsersCount = 0;
					socket.loadUsers(null);
					return;
				}
				if (!authenticated) {
					socket.emit('message', JSON.stringify({
						status: 'ERROR',
						message: 'not authenticated'
					}));
					return;
				}
				if (socket.requestmanager === undefined) {
					// winston.info('new requestmanager without login',socket.id);
					socket.requestmanager = new RequestManager(oMessage.login_uid, socket.getRequestCallback);
				}
				if (!authorized) {
					socket.emit('message', JSON.stringify({
						status: 'ERROR',
						message: 'not authorized',
						request: oMessage.request
					}));
					return;
				}
				// winston.info('handling request to socke id',socket.id);
				socket.requestmanager.handleRequest(oMessage);
			});

		});

		socket.on('disconnect', () => {
			// winston.info('socket disconnected',socket.id);
			delete this.sockets[socket.id];
			socket.authorizationmanager.stopAlerts();
			if (!socket.requestmanager) return;
			socket.requestmanager.stopAllFeeds();
		});
	}

}

const sm = new SocketManager();

module.exports = sm;
