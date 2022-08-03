/**
 * Created by Kamal on 01-06-2016.
 */
const Excel = require('exceljs');
const tripService = require('../services/tripService');
const alarmService = require('../services/alarmService');
const deviceService = require('../services/deviceService');
const gpsgaadiService = require('../services/gpsgaadiService');
const userService = require('../services/userService');
const activeusersmanager = require('./activeusersmanager');
const winston = require('./logger');

class UploadManager {

	constructor(socket, uploader) {
		this.socket = socket;
		uploader.dir = "./files/trips";
		uploader.listen(socket);
		uploader.on("saved", function (event) {
			const reqData = event.file.meta;
			//reqData.request = 'register_gpsgaadi';
			if (reqData.login_uid) {
				this.active_user = activeusersmanager.getUser(reqData.login_uid);
			}
			const filePath = event.file.pathName;

			setTimeout(UploadManager.parseXlsFile, 2000, filePath, reqData.request, (oJSONFile) => {
				if (oJSONFile && oJSONFile.status === 'OK' && reqData && reqData.request === 'upload_trips') {
					this.createTrips(reqData, oJSONFile.data);
				} else if (oJSONFile && oJSONFile.status === 'OK' && reqData && reqData.request === 'register_device') {
					UploadManager.registerDevice(reqData, oJSONFile.data);
				} else if (oJSONFile && oJSONFile.status === 'OK' && reqData && reqData.request === 'register_user') {
					UploadManager.registerUser(reqData, oJSONFile.data);
				} else if (oJSONFile && oJSONFile.status === 'OK' && reqData && reqData.request === 'register_gpsgaadi') {
					UploadManager.registerGpsgaadi(reqData, oJSONFile.data);
				}
			});
		});
		uploader.on("complete", function (event) {
			// winston.info(event.file);
		});
		uploader.on("start", function (event) {
			//winston.info(event.file);
		});
		uploader.on("progress", function (event) {
			// winston.info(event.file);
		});
		uploader.on("error", function (event) {
			winston.error("Error from uploader", event);
		});
	}

	parseXlsFile(filePath, file_type, createTripCB) {
		const oHeaders = this.getPredefinedXlsHeaders(file_type);
		const predefinedHeaders = oHeaders.predefinedHeaders;
		const sHeaders = oHeaders.sHeaders;
		const workbook = new Excel.Workbook();
		const oJSONSheetHeader = {};
		workbook.xlsx.readFile(filePath)
			.then(function (data) {
				let rss;
				if (data) {
					const worksheet = data.worksheets[0];
					let aJSONSheet = [];
					worksheet.eachRow(function (oRow, rowCount) {
						if (rowCount === 1) {//check headers
							if (predefinedHeaders.toString().search(oRow.values.toString()) > -1) {
								oRow.eachCell(function (oCell, cellCount) {
									oJSONSheetHeader[cellCount] = oCell.value;
								});
							} else {
								rss = {"message": "Headers are not matched with " + sHeaders, "status": 'ERROR'};
								this.socket.emit('message', rss);
								return createTripCB(rss);
							}
						} else {
							const Jrow = {};
							oRow.eachCell(function (oCell, cellCount) {
								Jrow[oJSONSheetHeader[cellCount]] = oCell.value;
							});
							aJSONSheet.push(Jrow);
						}
					});
					return createTripCB({"data": aJSONSheet, "status": 'OK'});
				} else {
					rss = {"message": "Uploaded sheet is empty", "status": 'ERROR'};
					this.socket.emit('message', rss);
					return createTripCB(rss);
				}
			});
	}

	createGeofencesOnTrips(allAlarms, oJSONFileData) {
		let allGeofencesCreated = false;
		const geofence_callback = function (res) {
			if (res.status === 'OK') {
				if (allAlarms[res.index].origin === 1) {
					oJSONFileData[allAlarms[res.index].trip_index].sAlarm = true;
				} else {
					oJSONFileData[allAlarms[res.index].trip_index].dAlarm = true;
				}
			}
			if (allGeofencesCreated) {
				const finalResp = {message: 'trips status', status: 'OK', data: oJSONFileData};
				this.socket.emit('trip', finalResp);
			}
		};
		let interval, counter = allAlarms.length - 1;

		function crtAl() {
			if (counter < 0) {
				clearInterval(interval);
			} else {
				if (counter === 0) {
					allGeofencesCreated = true;
				}
				//create alarm only when trip was created successfully
				if (oJSONFileData[allAlarms[counter].trip_index].tripCreated) {
					allAlarms[counter].index = counter;
					alarmService.createAlarm(allAlarms[counter], geofence_callback);
				}
				counter = counter - 1;
			}
		}

		interval = setInterval(crtAl, 1600);
	}

	prepareAlarmData(request, aAlarms) {
		const geofenceReq = {};
		geofenceReq.selected_uid = request.selected_uid;
		geofenceReq.login_uid = request.login_uid;
		geofenceReq.token = request.token;
		geofenceReq.name = aAlarms.name;
		geofenceReq.trip_index = request.index;
		geofenceReq.request = 'create_alarm';
		geofenceReq.atype = 'geofence';
		const start_time = new Date();
		geofenceReq.start_time = request.start_time || start_time;
		const end_time = new Date(start_time);
		end_time.setDate(end_time.getDate() + 7);// TODO temporary calculate it from duration
		geofenceReq.end_time = request.end_time || end_time;
		geofenceReq.imei = request.imei;
		geofenceReq.entry = request.entry || 1;
		geofenceReq.exit = request.exit || 1;
		if (this.active_user && this.active_user.mobile) {
			geofenceReq.mobiles = [this.active_user.mobile];
		}
		if (this.active_user && this.active_user.email) {
			geofenceReq.emails = [this.active_user.email];
		}
		geofenceReq.vehicle_no = request.vehicle_no;
		geofenceReq.origin = aAlarms.origin;
		if (geofenceReq.origin === 1) {
			geofenceReq.milestone = 'loading';
		} else {
			geofenceReq.milestone = 'unloading';
		}
		geofenceReq.trip_id = request.trip_id;
		return geofenceReq;
	}

	getPredefinedXlsHeaders(type) {
		const oHeaders = {};
		if (type === 'upload_trips') {
			oHeaders.predefinedHeaders = [null, 'vehicle', 'source', 'destination', 'duration'];
			oHeaders.sHeaders = "vehicle,source,destination,duration";
		} else if (type === 'register_device') {
			oHeaders.predefinedHeaders = [null, 'reg_no', 'imei', 'name', 'sim_no', 'device_type', 'password', 'user_id', 'dealer_id', 'admin_id'];
			oHeaders.sHeaders = "reg_no,imei,name,sim_no,device_type,password,user_id,dealer_id,admin_id";
		} else if (type === 'register_user') {
			oHeaders.predefinedHeaders = [null, 'reg_no', 'imei', 'name', 'sim_no', 'device_type', 'password', 'user_id', 'dealer_id', 'admin_id'];
			oHeaders.sHeaders = "reg_no,imei,name,sim_no,device_type,password,user_id,dealer_id,admin_id";
		} else if (type === 'register_gpsgaadi') {
			oHeaders.predefinedHeaders = [null, 'reg_no', 'imei', 'name', 'sim_no', 'device_type', 'password', 'user_id', 'dealer_id', 'admin_id'];
			oHeaders.sHeaders = "reg_no,imei,name,sim_no,device_type,password,user_id,dealer_id,admin_id";
		}
		return oHeaders;
	}

	createTrips(request, oJSONFileData) {
		let allTripsCreated = false;
		const allAlarms = [];
		const trip_callback = function (res) {
			oJSONFileData[request.index].reason = res.message;
			if (res.status === 'OK' && res.data) {
				oJSONFileData[res.data.index].tripCreated = true;
				allAlarms.push(this.prepareAlarmData(res.data, res.data.alarms[0]));
				allAlarms.push(this.prepareAlarmData(res.data, res.data.alarms[1]));
			}
			if (allTripsCreated) {
				//const finalResp = {message:'trips status',status:'OK',data:oJSONFileData};
				this.createGeofencesOnTrips(allAlarms, oJSONFileData);
				//this.socket.emit('trip',finalResp);
			}
		};
		let interval, counter = oJSONFileData.length - 1;

		function crtrp() {
			if (counter < 0) {
				clearInterval(interval);
			} else {
				const tripReq = {};
				if (oJSONFileData[counter].vehicle) {
					oJSONFileData[counter].tripCreated = false;
					tripReq.vehicle_no = oJSONFileData[counter].vehicle.replace(/[^0-9a-z]/gi, '').toUpperCase();
				}
				if (counter === 0) {
					allTripsCreated = true;
				}
				request.index = counter;
				tripReq.selected_uid = request.selected_uid;
				tripReq.login_uid = request.login_uid;
				tripReq.token = request.token;
				tripReq.destination = oJSONFileData[counter].destination;
				tripReq.source = oJSONFileData[counter].source;
				tripReq.duration = oJSONFileData[counter].duration;
				tripReq.index = counter;
				tripReq.request = 'create_trip';
				//create start time and end time here
				tripReq.alarms = [{name: oJSONFileData[counter].source, atype: 'geofence', enabled: 1, origin: 1},
					{name: oJSONFileData[counter].destination, atype: 'geofence', enabled: 1, origin: 0}];
				tripService.createTrip(tripReq, trip_callback);
				counter = counter - 1;
			}
		}

		interval = setInterval(crtrp, 1600);
	}

	registerDevice(request, oJSONFileData) {
		let allDevicesRegistered = false;
		const device_callback = function (res) {
			oJSONFileData[request.index].reason = res.message;
			if (res.status === 'OK' && res.data) {
				oJSONFileData[res.data.index].deviceReg = true;
			}
			if (allDevicesRegistered) {
				winston.info('allDevicesRegistered');
				//this.createGeofencesOnTrips(allAlarms,oJSONFileData);
				//this.socket.emit('trip',finalResp);
			}
		};
		let interval, counter = oJSONFileData.length - 1;

		function regDev() {
			if (counter < 0) {
				clearInterval(interval);
			} else {
				const devReq = {};
				oJSONFileData[counter].deviceReg = false;
				if (oJSONFileData[counter].reg_no) {
					devReq.reg_no = oJSONFileData[counter].reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
					devReq.user_id = devReq.reg_no;
				}
				if (counter === 0) {
					allDevicesRegistered = true;
				}
				request.index = counter;
				devReq.selected_uid = request.selected_uid;
				devReq.login_uid = request.login_uid;
				devReq.token = request.token;
				devReq.index = counter;
				devReq.request = 'register_device';
				devReq.imei = oJSONFileData[counter].imei;
				devReq.name = oJSONFileData[counter].name;
				devReq.device_type = oJSONFileData[counter].device_type;
				devReq.sim_no = oJSONFileData[counter].sim_no;
				deviceService.registerDevice(devReq, device_callback);
				counter = counter - 1;
			}
		}

		interval = setInterval(regDev, 500);
	}

	registerGpsgaadi(request, oJSONFileData) {
		let allDevicesRegistered = false;
		const device_callback = function (res) {
			oJSONFileData[request.index].reason = res.message;
			if (res.status === 'OK') {
				oJSONFileData[res.data.index].deviceReg = true;
				// winston.info(oJSONFileData[request.index].reg_no);
			} else {
				// winston.info(res.message);
			}
			if (allDevicesRegistered) {
				winston.info('allGPSGaadiRegistered');
				//this.createGeofencesOnTrips(allAlarms,oJSONFileData);
				//this.socket.emit('trip',finalResp);
			}
		};
		let interval, counter = oJSONFileData.length - 1;

		function regDev() {
			if (counter < 0) {
				clearInterval(interval);
			} else {
				const devReq = {};
				oJSONFileData[counter].deviceReg = false;
				if (oJSONFileData[counter].reg_no) {
					devReq.reg_no = oJSONFileData[counter].reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
					devReq.new_uid = devReq.reg_no;
				}
				if (counter === 0) {
					allDevicesRegistered = true;
				}
				request.index = counter;
				devReq.selected_uid = request.selected_uid;
				devReq.login_uid = request.login_uid;
				devReq.token = request.token;
				devReq.index = counter;
				devReq.request = 'associate_device';
				devReq.imei = oJSONFileData[counter].imei;
				devReq.name = oJSONFileData[counter].name;
				devReq.device_type = oJSONFileData[counter].device_type;
				devReq.devices = [oJSONFileData[counter].imei];
				devReq.ownership = 'owner';
				devReq.sim_no = oJSONFileData[counter].sim_no;
				deviceService.associateDeviceWithUser(devReq, device_callback);
				counter = counter - 1;
			}
		}

		interval = setInterval(regDev, 2000);
	}

	registerUser(request, oJSONFileData) {
		let allUsersRegistered = false;
		const user_callback = function (res) {
			oJSONFileData[request.index].reason = res.message;
			if (res.status === 'OK' && res.data) {
				oJSONFileData[res.data.index].userReg = true;
			}
			if (allUsersRegistered) {
				winston.info('allUsersRegistered');
				//this.createGeofencesOnTrips(allAlarms,oJSONFileData);
				//this.socket.emit('trip',finalResp);
			}
		};
		let interval, counter = oJSONFileData.length - 1;

		function regUsr() {
			if (counter < 0) {
				clearInterval(interval);
			} else {
				const usrReq = {};
				if (oJSONFileData[counter].reg_no) {
					usrReq.name = oJSONFileData[counter].reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
					usrReq.user_id = usrReq.name;
				}
				oJSONFileData[counter].userReg = false;
				if (counter === 0) {
					allUsersRegistered = true;
				}
				request.index = counter;
				usrReq.selected_uid = oJSONFileData[counter].dealer_id || request.selected_uid;
				usrReq.login_uid = request.login_uid;
				usrReq.token = request.token;
				usrReq.index = counter;
				usrReq.request = 'usrReg';
				if (oJSONFileData[counter].password) {
					usrReq.password = oJSONFileData[counter].password.toString();
				} else {
					usrReq.password = '888888';
				}
				usrReq.type = oJSONFileData[counter].type || 'user';
				usrReq.role = oJSONFileData[counter].role || 'user';
				usrReq.mobile = 0;
				userService.registerUser(usrReq, user_callback);
				counter = counter - 1;
			}
		}

		interval = setInterval(regUsr, 500);
	}


}

module.exports = UploadManager;
