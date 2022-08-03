const feedtype = require('../config').feedtype;

class CommandManager {

	constructor(user_id, cb) {
		this.user_id = user_id;
		this.commandRequestsForDevice = {};
		this.callback = cb;
		this.receivermanager = require('./receivermanager');
	}

	handleCommand(data) {
		// winston.info('commandmanager data:' + JSON.stringify(data));
		if (this.callback && this.commandRequestsForDevice[data.device_id] === data.command_type) {
			this.commandRequestsForDevice[data.device_id] = null;
			delete this.commandRequestsForDevice[data.device_id];
			this.callback(data);
		}
	}

	sendCommand(device_id, command_type, device_type, param) {
		this.commandRequestsForDevice[device_id] = command_type;
		this.receivermanager.sendMessage(device_id, device_type, feedtype.commands, command_type, param);
	}

}

module.exports = CommandManager;
