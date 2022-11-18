/**
 * Created by Bharath on 03-05-2016.
 */
const userService = require('../services/userService');
const deviceService = require('../services/deviceService');
const gpsgaadiService = require('../services/gpsgaadiService');
const mDeviceService = require('../services/mobileDeviceService');
const authUtil = require('./authUtil');
const jwt = require('jwt-simple');
const activeusersmanager = require('../utils/activeusersmanager');
const constants = require('../constants');
const requests = require('../config').requests;
const receivermanager = require('../utils/receivermanager');
const serverConfig = require('../config');
const feedtype = serverConfig.feedtype;

class AuthorizationManager {

	constructor() {
		this.authenticated = false;
		this.user = null;
	}

	authorize(request, callback) {
		const _this = this;
        this.authenticated = true;
		if (request.request === 'forgot_password' || request.request === 'get_shared_locaion' || request.request === 'playback') {
			this.authenticated = true;
			return callback(true, true);
		}
		if (request.request !== requests.authentication && !this.authenticated) {
			this.authenticated = this.checkAuthentication(request);
			if (!this.authenticated) return callback(false);
		}
		if (!this.user) {
			this.user = activeusersmanager.getUser(request.login_uid);
		}
		switch (request.request) {
			case requests.authentication:
				userService.getUser(request, function (response) {
					response.minReqAppVersion = constants.minReqAppVersion;
					response.minReqAppVersionCode = constants.minReqAppVersionCode;
					response.request = request.request;
					response.request_id = request.request_id;
					if (response.message === 'authenticated') {
						if (!request.loadUsers) {
							response.data.token = _this.generateToken(request);
							_this.authenticated = true;
							_this.user = response.data;
						}
						if (request.imei) {
							const oMdeviceUpdate = {user_id: request.user_id, imei: request.imei};
							mDeviceService.updateMobile(oMdeviceUpdate, () => {
							});
							if (!response.data.mobile_imeis) {
								const oUsrReq = {
									mobile_imeis: [request.imei.toString()],
									login_uid: request.user_id
								};
								userService.updateUser(oUsrReq, () => {
								});
							} else if (response.data.mobile_imeis.indexOf(request.imei.toString()) < 0) {
								//response.data.mobile_imeis.indexOf(request.imei)
								response.data.mobile_imeis.push(request.imei.toString());
								const oUsrReq = {
									mobile_imeis: response.data.mobile_imeis,
									login_uid: request.user_id
								};
								userService.updateUser(oUsrReq, () => {
								});
							}
						}
						if (response.data.role !== 'user') {
							const deviceRequest = {
								request: 'device_by_uid',
								selected_uid: request.user_id
							};
							deviceService.getDevice(deviceRequest, function (err, deviceresponse) {
								callback(true, true, response);
								response.data.associatedDevices = deviceresponse.data;
								activeusersmanager.addUser(request.user_id, response.data);
								_this.startAlerts();
							});
						} else {
                            callback(true, true, response);
							/*
                            const vehicleRequest = {
								request: 'gpsgaadi_by_uid',
								selected_uid: request.user_id
							};
							gpsgaadiService.getGpsGaadi(vehicleRequest, function (err, vehicleResponse) {
								callback(true, true, response);
								response.data.associatedDevices = vehicleResponse.data;
								activeusersmanager.addUser(request.user_id, response.data);
								_this.startAlerts();
							});
							*/
						}

					} else {
						return callback(false, true, response);
					}
				});
				break;
			case requests.forgot_password:
				userService.forgotPassword(request, function (response) {
					response.public_service = true;
					return callback(true, true, response);
				});
				break;
			case requests.heartbeat:
				callback(this.authenticated);
				break;

			case requests.stop_feed:
			case requests.get_shared_locaion:
			case requests.get_activation_sms:
				callback(true, true);
				break;
			case requests.report_parking:
			case requests.download_report_parking:
			case requests.report_mileage:
			case requests.download_report_mileage:
			case requests.get_geozone_download:
			case requests.report_mileage2:
			case requests.download_report_mileage2:
			case requests.report_overspeed:
			case requests.download_report_overspeed:
			case requests.report_acc:
            case requests.report_ac:
			case requests.download_report_acc:
			case requests.report_activity:
			case requests.download_report_activity:
			case requests.download_report_activity_trip:
			case requests.playback:
			case requests.playback_zoom:
			case requests.commands:
			case requests.live_feed:
            case requests.live_feedV2:
			case requests.share_location:
			case requests.remove_gpsgaadi:
			case requests.get_notif_prefs:
			case requests.update_notif_prefs:
			case requests.report_activity_interval:
			case requests.download_report_activity_interval:
			case requests.report_geofence_schedule:
            case requests.download_report_geofence_schedule:
            case requests.report_activity_slot:
			case requests.report_driver_activity:
			case requests.download_report_driver_activity:
            case requests.driver_day_activity:
            case requests.download_driver_day_activity:
            case requests.vehicle_exceptions:
            case requests.download_vehicle_exceptions:

				return callback(true, true);
			// if (request.device_id instanceof Array) {
			//     for (const i = 0; i < request.device_id.length; i++) {
			//         if (!this.authorizeDevice(this.user.user_id, request.device_id[i])) {
			//             request.device_id.splice(i, 1);
			//             i--;
			//         }
			//     }
			//     // winston.info(request.device_id);
			//     callback(true, request.device_id.length > 0);
			// } else {
			//     request.device_id = request.device_id || request.imei;
			//     callback(true, this.authorizeDevice(this.user.user_id, request.device_id));
			// }
			// break;
			case requests.usrReg:
			case requests.add_geozone:
			case requests.get_geozone:
			case requests.update_geozone:
			case requests.remove_geozone:
			case requests.create_alarm:
			case requests.get_alarm:
			case requests.update_alarm:
			case requests.remove_alarm:
			case requests.get_notification:
			case requests.user_id_availability:
			case requests.associate_device:
			case requests.update_device:
			case requests.device_by_uid:
			case requests.register_device:
			case requests.sub_users:
			case requests.get_user:
			case requests.gpsgaadi_by_uid:
			case requests.get_devide_types:
			case requests.gpsgaadi_by_reg_no:
			case requests.device_by_imei:
			case requests.add_vehicle:
			case requests.add_imei:
			case requests.change_password:
			case requests.update_user:
			case requests.remove_sub_user:
			case requests.get_device_config:
			case requests.get_device_info:
			case requests.gpsgaadi_by_uid_list:
			case requests.gpsgaadi_by_uid_mongo:
			case requests.gpsgaadi_by_uid_map_mongo:
			case requests.tracksheetData:
			case requests.update_user_notif:
			case requests.get_user_notif:
			case requests.download_tracking_sheet:
			case requests.download_tracking_sheet_mongo:
			case requests.get_device_data:
			case requests.get_user_mis_pref:
			case requests.update_user_mis_pref:
			case requests.get_malfunction:
			case requests.create_malfunction:
			case requests.update_malfunction:
			case requests.remove_malfunction:
			case requests.download_report_malfunction:
			case requests.download_notification:
			case requests.add_landmark:
			case requests.get_landmark:
			case requests.update_landmark:
			case requests.remove_landmark:
			case requests.upsert_feature:
			case requests.update_feature:
			case requests.get_feature:
			case requests.remove_feature:
			case requests.daily_uptime:
			case requests.last_online:
			case requests.gpsgaadi_by_uid_web:
			case requests.remove_alarm_schedule:
			case requests.update_alarm_schedule:
			case requests.create_alarm_schedule:
			case requests.get_alarm_schedule:
            case requests.get_device_alerts:
            case requests.get_nearest_geofence_for_point:
            case requests.get_nearest_landmark_for_point:
            case requests.get_nearest_vehicle_for_point:
                if (this.user && request.login_uid === this.user.user_id)
					return callback(true, true);
				return callback(true, true);
				break;
			default:
				callback(true, false);
				break;
		}
	}

	checkAuthentication(request) {
		return activeusersmanager.checkAuthentication(request.login_uid, request.token);
	}

	getMMDDYYYY() {
		let dateNow = new Date(),
			dMonth, dDate;
		if (dateNow.getMonth() < 9) {
			dMonth = "0" + (dateNow.getMonth() + 1).toString();
		} else {
			dMonth = (dateNow.getMonth() + 1).toString();
		}
		if (dateNow.getDate() < 10) {
			dDate = "0" + dateNow.getDate().toString();
		} else {
			dDate = dateNow.getDate().toString();
		}
		return dMonth + "-" + dDate + "-" + dateNow.getFullYear().toString();
	}

	generateToken(request) {
		let old_token_date, new_token, new_date;
		if (this.checkAuthentication(request)) {
			old_token_date = jwt.decode(activeusersmanager.getTokenByUid(request.login_uid), serverConfig.app_secret).date;
			new_date = this.getMMDDYYYY();
			if (new_date !== old_token_date) {
				new_token = authUtil.generateSocketToken(request.user_id || request.login_uid, new_date);
			} else {
				new_token = activeusersmanager.getTokenByUid(request.login_uid);
			}
		} else {
			new_token = authUtil.generateSocketToken(request.user_id || request.login_uid, new_date);
		}
		return new_token;
	}

	startAlerts() {
		const devices = this.user.associatedDevices;
		if (devices) {
			for (let i = 0; i < devices.length; i++) {
				// winston.info('AM registering for alerts:'+devices[i].imei);
				if (devices[i].imei) {
					receivermanager.sendMessage(devices[i].imei, devices[i].device_type, feedtype.alerts);
				}
			}
		}

	}

	stopAlerts() {
		if (!this.user || !this.user.associatedDevices) return;
		const devices = this.user.associatedDevices;
		for (let i = 0; i < devices.length; i++) {
			// winston.info('AM deregistering alerts:'+devices[i].imei);
			receivermanager.unregisterDeviceFeed(this.user.user_id, devices[i].imei, devices[i].model);
		}
	}

	authorizeDevice(user_id, device_id) {
		const user = activeusersmanager.getUser(user_id);
		if (user.associatedDevices && user.associatedDevices.length !== 0) {
			for (const key in user.associatedDevices) {
				if (device_id === user.associatedDevices[key].imei) return true;
			}
		}
		if (user.sub_users && user.sub_users.length > 0) {
			for (const key in user.sub_users) {
				if (this.authorizeDevice(user.sub_users[key].user_id, device_id)) return true;
			}
		}
		return false;
	}

}

module.exports = AuthorizationManager;
