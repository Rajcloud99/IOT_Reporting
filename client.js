const fs = require('fs');
let socket;
const isLocal = false;
const winston = require('winston');
if (isLocal) {
	socket = require('socket.io-client')('http://localhost:5001', {
		'reconnection': true,
		'reconnectionDelay': 1000,
		'reconnectionDelayMax': 5000,
		'reconnectionAttempts': 5
	});
} else {
	// socket = require('socket.io-client')('http://truckadda.in:5001');
	socket = require('socket.io-client')('http://trucku.in:5001');
}

let index = 0;
const total = 1;
let num = 0;

socket.on('connect', function () {
	winston.info('Connection Established! Ready to send/receive data!');
	winston.info('new connection: ', socket.id);
	const request = {};
	request.request = 'authentication';
	// request.user_id = 'gpsgaadi';
	// request.password = 'gpsgaadi';
	request.user_id = 'kamal';
	request.password = 'kamal123';
	request.request_id = 18;
	socket.emit('message', JSON.stringify(request));
	winston.info('sending login request');
	//	socket.disconnect();
});

socket.on('message', function (message) {
	num++;
	winston.info('message index: ' + num);
	winston.info(new Date().toString(), 'message: ' + message);
	fs.writeFile('log.txt', message, function (err) {
		if (err) return winston.info(err);
	});
	if (JSON.parse(message).message === 'live feed') {
		// socket.emit('message', JSON.stringify(getSotpFeedRequest(message)));
	}


	if (index === total) return;

	// socket.emit('message', JSON.stringify(getLiveFeedRequest(message)));
	// socket.emit('message', JSON.stringify(getLandmark(message)));
	// socket.emit('message', JSON.stringify(gteLocationRequest(message)));
	// socket.emit('message', JSON.stringify(getLocationRequest(message)));
	// socket.emit('message', JSON.stringify(getAccReportRequest(message)));
	// socket.emit('message', JSON.stringify(getOverspeedReportRequest(message)));
	// socket.emit('message', JSON.stringify(getDownloadActivityReportRequest(message)));
	// socket.emit('message', JSON.stringify(getReportRequest(message)));
	// socket.emit('message', JSON.stringify(getDownloadParkingReportRequest(message)));
	// socket.emit('message', JSON.stringify(getActivityIntervalReportRequest(message)));
	// socket.emit('message', JSON.stringify(getPlaybackRequest(message)));
	//	socket.emit('message', JSON.stringify(getPlaybackZoomRequest(message)));
	// socket.emit('message', JSON.stringify(getDeviceByUID(message)));
	// socket.emit('message', JSON.stringify(getDeviceInfo(message)));
	// socket.emit('message', JSON.stringify(getFeature(message)));
	socket.emit('message', JSON.stringify(getGpsgaadiList(message)));
	// socket.emit('message', JSON.stringify(updateFeature(message)));

	index++;
});


function getLiveFeedRequest(message) {
	winston.info('sending live feed request');
	const request = {};
	request.request = 'live_feed';
	request.device_id = 358899058436653;


	request.user_id = 'abr';
	request.device_type = 'crx';
	request.login_uid = 'abr';
	request.request_id = 19;
	request.token = message.token;
	return request;
}

function getStopFeedRequest(message) {
	winston.info('sending stop feed request');
	const request = {};
	request.request = 'stop_feed';
	request.device_id = 358899056145926;


	request.user_id = 'gpsgaadi';
	request.device_type = 'tr06';
	request.login_uid = 'gpsgaadi';
	request.request_id = 19;
	request.token = message.token;
	return request;
}

function getLocationRequest(message) {
	winston.info('sending location request');
	const request = {};
	request.request = 'commands';
	// request.command_type = 'petrol_restore';
	request.command_type = 'location';
	// request.command_type = 'location_url';
	// request.command_type = 'param';
	// request.command_type = 'gprs_param';
	// request.command_type = 'set_time_interval';
	request.param = 15;

	request.request_id = 1;

	// request.device_type = 'tr06';
	// request.device_id = 358899056145926;
	// request.device_id = 358899056163473;
	// request.device_id = 358899056156451;
	// request.device_id = 359704070000355;

	// request.device_type = 'tr02';
	// request.device_id = ;

	// request.device_type = 'crx';
	// request.device_id = 358899057980370;

	// request.device_type = 'tr06n';
	// request.device_id = 358899052018135;

	// request.device_type = 'meitrack2';
	// request.device_id = 359704070000355;

	request.device_type = 'avl500';
	request.device_id = 355780006928723;

	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getAccReportRequest(message) {
	winston.info('sending acc request');
	const request = {};
	request.request = 'report_acc';
	request.request_id = 1;
	request.device_id = 358899056145173;
	request.start_time = '2016-07-07 00:00:01+0530';
	request.end_time = '2016-07-07 23:59:59+0530';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getOverspeedReportRequest(message) {
	winston.info('sending overspeed request');
	const request = {};
	request.request = 'report_overspeed';
	request.request_id = 1;
	request.device_id = 358899056145173;
	request.start_time = '2016-05-30 12:30:00+0530';
	request.end_time = '2016-05-30 13:00:00+0530';
	request.login_uid = 'gpsgaadi';
	request.speed_limit = 50;
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getReportRequest(message) {
	winston.info('sending getReportRequest');
	const request = {};
	// request.request = 'report_parking';
	// request.request = 'report_mileage';
	// request.request = 'download_report_activity';
	// request.request = 'download_report_mileage';
	request.request = 'download_tracking_sheet';
	request.request_id = 1;
	// request.device_id = 351608080783991;
	request.device_id = [358899056156451];
	// request.minimum_time_in_mins = 15;
	request.start_time = '2016-11-30 00:00:00+0530';
	request.end_time = '2016-11-30 23:59:00+0530';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getDownloadParkingReportRequest(message) {
	winston.info('sending download parking request');
	const request = {};
	// request.request = 'report_parking';
	// request.request = 'download_report_mileage';
	// request.request = 'report_overspeed';
	request.request = 'report_activity';
	request.request_id = 1;
	request.device_id = [358899056156451, 358899056145926];
	// request.device_id = [358899056145173, 358899056145926, 358899056156451];
	request.start_time = '2016-11-09 00:00:00+0530';
	request.end_time = '2016-11-10 00:00:00+0530';
	request.speed_limit = 55;
	request.minimum_time_in_mins = 15;
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getActivityIntervalReportRequest(message) {
	winston.info('sending getActivityIntervalReportRequest');
	const request = {};
	// request.request = 'report_activity_interval';
	request.request = 'download_report_activity_interval';
	request.request_id = 1;
	request.device_id = 358899056145926;
	// request.device_id = [358899056145173, 358899056145926, 358899056156451];

	// request.start_time = "2016-11-18T10:45:00.000Z";
	// request.end_time = "2016-11-18T12:00:00.000Z";

	request.start_time = ["2016-11-18T10:00:00.000Z", "2016-11-18T11:00:00.000Z"];
	request.end_time = ["2016-11-18T10:30:00.000Z", "2016-11-18T11:30:00.000Z"];

	request.time_interval = 10;
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getDownloadActivityReportRequest(message) {
	winston.info('sending download activity request');
	const request = {};
	// request.request = 'download_report_parking';
	// request.request = 'download_report_activity';
	request.request = 'download_report_activity_trip';
	// request.request = 'download_report_acc';
	request.request_id = 1;
	// request.device_id = 358899056068102;
	request.device_id = [358899056068102];
	request.start_time = '2016-07-8 12:13:16+0530';
	request.end_time = '2016-07-10 20:51:22+0530';
	request.speed_limit = 60;
	request.login_uid = 'gpsgaadi';
	request.token = message.token;


	winston.info(JSON.stringify(request));
	return request;
}

function getPlaybackRequest(message) {
	winston.info('sending playback request');
	const request = {};
	request.request = 'playback';
	request.request_id = 1;
	// request.device_id = 358899056161063;
	// request.device_id = 359704070000355;
	request.device_id = 358899057984398;


	request.start_time = '2016-10-06 00:00:00+0530';
	request.end_time = '2016-10-06 23:00:00+0530';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	request.version = 2;
	winston.info(JSON.stringify(request));
	return request;
}

function getPlaybackZoomRequest(message) {
	winston.info('sending playback zom request');
	const request = {};
	request.request = 'playback_zoom';
	request.request_id = 1;
	request.device_id = 358899056145975;
	request.start_time = '2016-05-26 12:00:00+0530';
	request.end_time = '2016-05-26 16:00:00+0530';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getDeviceByUID(message) {
	winston.info('sending get device by uid request');
	const request = {};
	request.request = 'device_by_uid';
	request.selected_uid = 'gpsgaadi';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getDeviceInfo(message) {
	winston.info('sending get device by uid request');
	const request = {};
	request.request = 'get_device_info';
	// request.request = 'get_commands_info';
	request.selected_uid = 'gpsgaadi';
	request.login_uid = 'gpsgaadi';
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getLandmark(message) {
	winston.info('sending getLandmark');
	const request = {};
	// request.request = 'get_landmark';
	request.user_id = 'gpsgaadi';
	request.login_uid = 'gpsgaadi';

	request.request = 'remove_landmark';
	request.created_at = "2016-12-14T11:35:39.574Z";


	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function getGpsgaadiList(message) {
	// const request = {};
	// request.request = 'gpsgaadi_by_uid_list';
	// request.login_uid = "abr";
	// request.user_id = "abr";
	// request.user_id = "selected_uid";
	// request.page = 0;
	// request.sort = 'location_time';

	const request = {
		"login_uid": "kamal",
		"request": "gpsgaadi_by_uid_list",
		"row_count": 50,
		"search": {"branch": "govindpuri"},
		"page": 0,
		"selected_uid": "kamal"
	};


	request.token = message.token;
	winston.info(new Date().toString(), JSON.stringify(request));
	return request;
}

function getFeature(message) {
	const request = {};
	request.request = 'get_feature';
	request.login_uid = "kamal";
	request.user_id = "kamal";
	request.feature = "trip";
	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}

function updateFeature(message) {
	const request = {};
	request.request = 'update_feature';
	request.login_uid = "kamal";
	request.user_id = "kamal";
	request.feature = 'trip';
	request.shown_fields = ["created_at", "consignor", "destination", "driver_no", "est_dist", "forworder", "imei", "last_tracking", "manager", "remark1", "remark2", "remark3", "source", "start_time", "status", "trip_id", "trip_no", "unloading"];
	request.allowed_fields = ["created_at", "consignee", "consignor", "created_by", "destination", "driver", "driver_no", "end_time", "est_dist", "etoa", "forworder", "gps_status", "imei", "journey", "last_tracking", "loading", "manager", "remark1", "remark2", "remark3", "source", "start_time", "status", "trip_id", "trip_no", "unloading", "vehicle_no", "cur_location"];

	request.token = message.token;
	winston.info(JSON.stringify(request));
	return request;
}
