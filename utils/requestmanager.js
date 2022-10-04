const BPromise = require('bluebird');
const gpsService = require('../services/gpsService');
const gps = require('../model/gps');
const device = require('../model/device');
const userService = require('../services/userService');
const deviceService = BPromise.promisifyAll(require('../services/deviceService'));
const geozoneService = require('../services/geozoneService');
const alarmService = require('../services/alarmService');
const notificationService = require('../services/notificationService');
const FeedManager = require('./feedmanager');
const CommandManager = require('./commandmanager');
const gpsgaadiService = BPromise.promisifyAll(require('../services/gpsgaadiService'));
const landmarkService = BPromise.promisifyAll(require('../services/landmarkService'));
const featureService = BPromise.promisifyAll(require('../services/featureService'));
const excelService = require('../services/excelService');
const shared_locationsService = require('../services/shared_locationsService');
const mDeviceService = require('../services/mobileDeviceService');
const NotifPrefs = require('../services/notifPrefService');
const malfunctionService = require('../services/deviceMalfunctionService');
const mathutils = require('../utils/mathutils');
const otherUtils = require('../utils/otherutils');
const devices = require('../config').devices;
const requests = require('../config').requests;
const winston = require('./logger');
const brs = require('../services/booleanReportService');
const alarmScheduleService = require('../services/alarmSchedulerService');
const deviceServiceV2 = BPromise.promisifyAll(require('../services/deviceServiceV2'));
const reportService = require('../services/reportService');
const async = require('async');
const addressService = BPromise.promisifyAll(require('../services/addressService'));

class RequestManager {

	constructor(user_id, cb) {
		this.user_id = user_id;
		this.feedManager = new FeedManager(user_id, cb);
		this.commandManager = new CommandManager(user_id, cb);
		this.cb = cb;
	}

	callback(request, response) {
		if(response && request){
			response.request_id = request.request_id;
			response.request = request.request;
			//winston.info(new Date(), 'sending response', JSON.stringify(response.request));
			// this.cb(otherUtils.pruneEmpty(response));
		}
		this.cb(response);
	}

	handleRequest(request) {
		//winston.info(new Date(), 'got request', JSON.stringify(request));
		let response;
		switch (request.request) {
			case requests.authentication:
				break;
			case requests.heartbeat:
				this.callback(null);
				break;
			case requests.forgot_password:
				userService.forgotPassword(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.change_password:
				userService.changePassword(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.update_user:
				userService.updateUser(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.remove_sub_user:
				userService.removeSubUser(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.usrReg:
				userService.registerUser(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.user_id_availability:
				userService.checkUserId(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.live_feed:
				setTimeout(() => {
					gps.getCurrentLocation(request.device_id, (err, dev) => {
						if (!dev) {
							return;
						}
							const response = {
								status: 'OK',
								request: request.request,
								message: 'live feed',
								data: dev
							};
							this.callback(request, response);
							this.feedManager.startFeed(dev, request.device_type);
					});
				}, mathutils.getRandomArbitrary(50, 100));


				break;

            case requests.live_feedV2:
                setTimeout(() => {
                    gps.getCurrentLocation(request.device_id, (err, dev) => {
                        if (!dev) {
                            return;
                        }
                        device.getDeviceStatus(request.device_id, (err, res) => {
                            dev.status = res[0].status;
                            dev.positioning_time = res[0].positioning_time;
                            dev.location_time = res[0].location_time;
                            dev.speed = res[0].speed;
                            otherUtils.setStatus(dev);
                            const response = {
                                status: 'OK',
                                request: request.request,
                                message: 'live feed v2',
                                data: dev
                            };
                            this.callback(request, response);
                            this.feedManager.startFeedV2(dev, request.device_type);
                        });

                    });
                }, mathutils.getRandomArbitrary(50, 100));


                break;

			case requests.stop_feed:
				this.feedManager.stopFeed(request.device_id, request.device_type);
				break;
			case requests.sub_users:
				userService.getSubUsers(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_user:
				userService.getUser(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.register_device:
				deviceService.registerDevice(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.device_by_imei:
				deviceService.getDeviceAsync(request)
					.then(res => {
						response = res;
					})
					.then(() => {
						return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						this.callback(request, response);
					});
				break;
			case requests.device_by_uid:
				deviceService.getDevice(request, (err, response) => {
					this.callback(request, response);
				});
				break;
			case requests.update_device:
				deviceService.updateDevice(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.associate_device:
				deviceService.associateDeviceWithUser(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.report_parking:
				deviceService.getParkingReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, request.client)
					.then(res => {
						response = res;
						response.device_id = request.device_id;
					})
					.then(() => {
						return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						this.callback(request, response);
					});
				break;
			case requests.download_report_parking:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
				deviceService.getParkingReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, "web")
					.then(res => {
						response = res;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
                        response.timezone = request.timezone;
					})
					.then(() => {
						return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						if (response.status === 'ERROR') {
							return this.callback(request, response);
						}
						excelService.getParkingReport(response, obj => {
							response.data = obj.url;
							this.callback(request, response);
						});
					});
				break;
			case requests.report_mileage:
				deviceService.getMileageReport(request.device_id, request.start_time, request.end_time, request.client, (err, response) => {
					response.device_id = request.device_id;
					this.callback(request, response);
				});
				break;
			case requests.report_mileage2:
				deviceService.getMileageReport2(request.device_id, request.start_time, request.end_time, request.client, (err, response) => {
					response.device_id = request.device_id;
					this.callback(request, response);
				});
				break;
			case requests.download_report_mileage:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
				// winston.info(request);
				request.start_time = new Date(request.start_time).getTime();
				request.end_time = new Date(request.end_time).getTime();
				// winston.info(request);
				deviceService.getMileageReport(request.device_id, request.start_time, request.end_time, "web", (err, response) => {
					response.device_id = request.device_id;
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
                    response.timezone = request.timezone;
					excelService.getMileageReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
			case requests.download_report_mileage3:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
				// winston.info(request);
				request.start_time = new Date(request.start_time).getTime();
				request.end_time = new Date(request.end_time).getTime();
				// winston.info(request);

				deviceService.getMileageReport2(request.device_id, request.start_time, request.end_time, "download", (err, response) => {
					response.device_id = request.device_id;
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
                    response.timezone = request.timezone;
					excelService.getMileageReport2(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
            case requests.download_report_mileage2:
            	if(!request.device_id){
            		let resp = resquest;
            		resp.status = 'ERROR';
            		resp.message = 'device id not found';
            		return this.callback(request,resp);
				}
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
                // winston.info(request);
                request.start_time = new Date(request.start_time).getTime();
                request.end_time = new Date(request.end_time).getTime();
                // winston.info(request);
				request.download = true;
                reportService.getMileageReport(request, (err, response) => {
                    response.device_id = request.device_id;
                    response.login_uid = request.login_uid;
                    response.start_time = request.start_time;
                    response.end_time = request.end_time;
                    response.timezone = request.timezone;
                    if (response.status === 'ERROR') {
                        return this.callback(request, response);
                    }
                    excelService.getMileageReport2(response, obj => {
                        response.data = obj.url;
                        this.callback(request, response);
                    });
                });
                break;
			case requests.report_overspeed:
                deviceService.getOverspeedReport(request.device_id, request.start_time, request.end_time, request.speed_limit, request.client, response => {
                //gpsService.getOverspeedReportV2(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.download_report_overspeed:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
				deviceService.getOverspeedReport(request.device_id, request.start_time, request.end_time, request.speed_limit, "web", response => {
					response.device_id = request.device_id;
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
                    response.timezone = request.timezone;
					excelService.getOverspeedReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
			case requests.report_activity:
				if (request.device_id instanceof Array) {
					let tempD = [];
					for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
						if (request.device_id[k] && request.device_id[k].toString().length < 16) {
							tempD.push(request.device_id[k]);
						}
					}
					request.device_id = tempD;
				}
				//request.client = 'web';
				if ((request.device_id instanceof Array) && request.device_id.length < 5) {
					deviceService.getPlaybackV4ReportAsync(request)
						.then(resp => {
							response = resp;
							response.device_id = request.device_id;
							response.login_uid = request.login_uid;
							response.start_time = request.start_time;
							response.end_time = request.end_time;
							response.timezone = request.timezone;
							response.status = 'OK';
						}).then(() => {
						 if (response.status === 'ERROR') {
							return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
						 }
					    }).then(() => {
						 this.callback(request, response);
					    });
				} else {
					deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, request.client, false)
						.then(res => {
							response = res;
						})
						.then(() => {
							return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
						})
						.then(() => {
							this.callback(request, response);
						});
				}

				break;

			case requests.download_report_activity:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                if (request.device_id instanceof Array) {
                    let tempD = [];
                    for(let k=0;k<request.device_id.length;k++){//remove null imeis
                        if(request.device_id[k]) tempD.push(request.device_id[k]);
                    }
                    request.device_id = tempD;
                }
				deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, request.client, false)
					.then(res => {
						response = res;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
						response.timezone = request.timezone;
					})/* for DGFC TODO remove it
					.then(() => {
						return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
					})*/
					.then(() => {
						if (response.status === 'ERROR') {
							return this.callback(request, response);
						}
						console.log('before excel gen', new Date());
						excelService.getActivityReport(response, obj => {
                            console.log('after excel gen', new Date(),obj.url);
							response.data = obj.url;
							this.callback(request, response);
						});
					});
				break;

			case requests.report_driver_activity:
				deviceService.getPlaybackV4DriverReportAsync(request)
					.then(resp => {
						response = resp;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
						response.timezone = request.timezone;
						response.status = 'OK';
						this.callback(request, response);
					});
				break;

            case requests.driver_day_activity:
                deviceService.getDriverDayReportAsync(request)
                    .then(resp => {
                        response = resp;
                        response.device_id = request.device_id;
                        response.login_uid = request.login_uid;
                        response.start_time = request.start_time;
                        response.end_time = request.end_time;
                        response.timezone = request.timezone;
                        response.status = 'OK';
                        this.callback(request, response);
                    });
                break;

            case requests.download_report_driver_activity:
				if(!request.device_id){
					let resp = resquest;
					resp.status = 'ERROR';
					resp.message = 'device id not found';
					return this.callback(request,resp);
				}
				if (request.device_id instanceof Array) {
					let tempD = [];
					for(let k=0;k<request.device_id.length;k++){//remove null imeis
						if(request.device_id[k]) tempD.push(request.device_id[k]);
					}
					request.device_id = tempD;
				}

				deviceService.getPlaybackV4DriverReportAsync(request)
					.then(resp => {
						response = resp;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
						response.timezone = request.timezone;
						response.status = 'OK';
					}).then(() => {
					if (response.status === 'ERROR') {
						return res.status(500).json(response);
					}
					excelService.getDriverActivityReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;

            case requests.download_driver_day_activity:
				if(!request.device_id){
					let resp = resquest;
					resp.status = 'ERROR';
					resp.message = 'device id not found';
					return this.callback(request,resp);
				}
				if (request.device_id instanceof Array) {
					let tempD = [];
					for(let k=0;k<request.device_id.length;k++){//remove null imeis
						if(request.device_id[k]) tempD.push(request.device_id[k]);
					}
					request.device_id = tempD;
				}

				deviceService.getDriverDayReportAsync(request)
					.then(resp => {
						response = resp;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
						response.timezone = request.timezone;
						response.status = 'OK';
					}).then(() => {
					if (response.status === 'ERROR') {
						return res.status(500).json(response);
					}
					excelService.getDriverDayWiseActivityReportVertically(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;

            case requests.report_activity_slot:
                request.isAddrReqd = true;
                deviceServiceV2.getSlotActivityReportAsync(request)
                    .then(res => {
                        response = res;
                        response.device_id = request.device_id;
                        response.login_uid = request.login_uid;
                        response.start_time = request.start_time;
                        response.end_time = request.end_time;
                        response.timezone = request.timezone;
                        this.callback(request, response);
                    });
                break;
            case requests._download_report_activity:
                if(!request.device_id){
                    let resp = resquest;
                    resp.status = 'ERROR';
                    resp.message = 'device id not found';
                    return this.callback(request,resp);
                }
                request.isAddrReqd = true;
                deviceServiceV2.getSlotActivityReportAsync(request)
                    .then(res => {
                        response = res;
                        response.device_id = request.device_id;
                        response.login_uid = request.login_uid;
                        response.start_time = request.start_time;
                        response.end_time = request.end_time;
                        response.timezone = request.timezone;
                    })
                .then(() => {
                    if (response.status === 'ERROR') {
                        return this.callback(request, response);
                    }
                    excelService.getSlotActivityReport(response, obj => {
                        response.data = obj.url;
                        this.callback(request, response);
                    });
                });
                break;
			case requests.download_report_activity_trip:
				request.device_id = parseInt(request.device_id[0]);
				deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, request.client, false)
					.then(res => {
						response = res;
						response.device_id = request.device_id;
						response.login_uid = request.login_uid;
						response.start_time = request.start_time;
						response.end_time = request.end_time;
						response.trip_no = request.trip_no;
						response.driver = request.driver;
						response.route = request.route;
                        response.timezone = request.timezone;
					})
					.then(() => {
						return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						if (response.status === 'ERROR') {
							return this.callback(request, response);
						}
						excelService.getTripActivityReport(response, obj => {
							response.data = obj.url;
							this.callback(request, response);
						});
					});
				break;
			case requests.get_notification:
				return notificationService.getNotification(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.download_vehicle_exceptions:
			case requests.vehicle_exceptions:
			    let that = this;
				if (request.device_id instanceof Array) {
					let tempD = [];
					for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
						if (request.device_id[k] && request.device_id[k].toString().length < 16) {
							tempD.push(request.device_id[k]);
						}
					}
					request.device_id = tempD;
				}
				request.client = 'web';
				reportService.getIdleData(request, (err, resp) => {
					if (err) {
						return res.status(200).json(err);
					} else if (!resp || resp.status === 'ERROR') {
						return res.status(200).json(resp);
					}
					//TODO for sinlge device only
					let deviceInv, lastHaltRfid, lastHaltDriver;
					let device = request;
					let aAlertsResp = [];
					deviceService.processRawDataAsync(request.device_id, resp.data)
						.then(function (das) {
							device.data = das;
							return BPromise.promisify((adas, callback) => {
                                async.eachSeries(adas.data, function (datum, done) {
                                    BPromise.resolve()
                                        .then(function () {
                                            if (datum.start_addr) return BPromise.resolve(datum.start_addr);
                                            if(!datum.start || !datum.start.latitude) return BPromise.resolve(" ");
                                            return addressService.getAddressAsync(datum.start.latitude, datum.start.longitude);
                                        })
                                        .then(function (addr) {
                                            datum.start_addr = addr;
                                            done();
                                        })
                                        .error(err => {
                                            done();
                                        });
                                }, function (err) {
                                    callback(null, true);
                                });
                            })(device);
						}).then(function () {

						return deviceService.getDeviceStatusAsync(request.device_id[0]);
					}).then(function (oDevice) {
						if (oDevice.status == 'OK') {
							deviceInv = oDevice.data[0];
							lastHaltRfid = deviceInv.rfid1;
							lastHaltDriver = deviceInv.driver_name;
						}
						let reqIni = {imeis: request.device_id, code: 'rfid', end_date: request.start_time, row_count: 1};
						return deviceService.getDeviceAlertsAsync(reqIni);
					}).then(function (aAlLast) {
						if (aAlLast && aAlLast.data && aAlLast.data.length) {
							let lastDr = aAlLast.data[0];
							lastHaltRfid = lastDr.extra;
							lastHaltDriver = lastDr.driver;
						}
						let req = {
							imeis: request.device_id,
							code: 'rfid',
							start_date: request.start_time,
							end_date: request.end_time
						};
						return deviceService.getDeviceAlertsAsync(req);
					}).then(function (aAl) {
						if (aAl && aAl.data && aAl.data.length) {
							let aDeviceAlerts = aAl.data;
							for (let i = 0; i < device.data.length; i++) {
								device.data[i].rfid = lastHaltRfid;
								device.data[i].driver = lastHaltDriver;
								device.data[i].code = 'Excessive Idle';
								for (let a = 0; a < aAl.data.length; a++) {
									if (device.data[i].start_time <= aAl.data[a].datetime && aAl.data[a].datetime <= device.data[i].end_time) {
										device.data[i].rfid = aAl.data[a].extra;
										lastHaltRfid = aAl.data[a].extra;
										device.data[i].driver = aAl.data[a].driver;
										lastHaltDriver = aAl.data[a].driver;
										console.log('a', i);
										break;
									}
								}
								let oAlert = {
									imei: deviceInv.imei,
									datetime: device.data[i].start_time,
									code: 'Excessive Idle',
									duration: device.data[i].duration,
									driver: device.data[i].driver,
									extra: device.data[i].rfid,
									address: device.data[i].start_addr
								};
								aAlertsResp.push(oAlert);
							}
						}
						let reqAll = {
							imeis: request.device_id,
							start_date: request.start_time,
							end_date: request.end_time,
							row_count: 100
						};
						return deviceService.getDeviceAlertsAsync(reqAll);
					}).then(function (aAlLastAll) {
						let allowedCode = ['power_cut','sos','emergency','ha','hb','rt'];
						for(let k=0;k<aAlLastAll.data.length;k++){
							if(allowedCode.indexOf(aAlLastAll.data[k].code) == -1){
								aAlLastAll.data.splice(k,1);
								k--;
							}else{
								aAlLastAll.data[k].address = aAlLastAll.data[k].location && aAlLastAll.data[k].location.address;
								aAlertsResp.push(aAlLastAll.data[k]);
							}
						}
						response = device;
						if(request.download){
							excelService.getVehicleExceptionReport(response, obj => {
								response.data = obj.url;
                                that.callback(request, response);
							});
						}else{
							response.data = aAlertsResp;
							response.device_id = request.device_id;
							response.login_uid = request.login_uid;
							response.start_time = request.start_time;
							response.end_time = request.end_time;
							response.timezone = request.timezone;
                            that.callback(request, response);
						}

					});
				});
				break;
			case requests.add_geozone:
				return geozoneService.addGeozone(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.remove_geozone:
				return geozoneService.removeGeozone(request, response => {
					this.callback(request, response);
				});
			case requests.get_geozone:
				// winston.info(request);
				return geozoneService.getGeozone(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.update_geozone:
				return geozoneService.updateGeozone(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.create_alarm:
				return alarmService.createAlarm(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.remove_alarm:
				return alarmService.removeAlarm(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.get_alarm:
				return alarmService.getAlarm(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.update_alarm:
				return alarmService.updateAlarm(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.get_notification:
				return notificationService.getNotification(request, response => {
					this.callback(request, response);
				});
			// break;
            case requests.get_device_alerts:
                return notificationService.getDeviceAlerts(request, response => {
                    this.callback(request, response);
                });
            // break;
			case requests.download_notification:
				request.row_count =5000;
				return notificationService.downloadNotifications(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.playback:
				// winston.info(JSON.stringify(request));
				if (request.version && request.version === 2) {
					deviceService.getPlaybackV4Async(request)
						.then(res => {
							response = res;
							response.device_id = request.device_id;
							response.login_uid = request.login_uid;
							response.start_time = request.start_time;
							response.end_time = request.end_time;
							response.timezone = request.timezone;
							response.status = 'OK';
						})
						.then(() => {
							return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
						})
						.then(() => {
							this.callback(request, response);
						});
					break;
				}
				/*
                if (request.version && request.version === 2) {
                    deviceService.getPlaybackV3Async(request.device_id, request.start_time, request.end_time)
                        .then(res => {
                            response = res;
                        })
                        .then(() => {
                            return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
                        })
                        .then(() => {
                            this.callback(request, response);
                        });
                    break;
                }
				if (request.version && request.version === 2) {
					deviceService.getPlaybackV2Async(request.device_id, request.start_time, request.end_time)
						.then(res => {
							response = res;
						})
						.then(() => {
							return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
						})
						.then(() => {
							this.callback(request, response);
						});
					break;
				}
				 */
				deviceService.getPlaybackAsync(request.device_id, request.start_time, request.end_time)
					.then(res => {
						response = res;
					})
					.then(() => {
						return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						this.callback(request, response);
					});
				break;
			case requests.playback_zoom:
				gpsService.getPlayback(request.device_id, request.start_time, request.end_time, response => {
					this.callback(request, response);
				});
				break;
				//android map
			case requests.gpsgaadi_by_uid:
			case requests.gpsgaadi_by_reg_no:
				gpsgaadiService.getGpsGaadiAsync(request)
					.then(res => {
						response = res;
					})
					.then(() => {
						return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						this.callback(request, response);
					});
				break;
            //web map
			case requests.gpsgaadi_by_uid_web:
				gpsgaadiService.getGpsGaadiWebAsync(request)
					.then(res => {
						response = res;
					})
					.then(() => {
						return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
					})
					.then(() => {
						this.callback(request, response);
					});
				break;
			case requests.gpsgaadi_by_uid_mongo:
				console.log('Mongo tracksheet request arrive', new Date());
				// request.all = true;
				delete request.no_of_rows;
				request.feature = 'tracksheet';
				gpsgaadiService.getGpsGaadiListFromMongo(request, response => {
					response = otherUtils.pruneEmpty(response);
					this.callback(request, response);
					//console.log('tracksheet request end_time', new Date());
				});
				break;
			//web tracksheet packetwise
			case requests.tracksheetData:
				request.feature = 'tracksheet';
				gpsgaadiService.getTracksheetData(request, response => {
					response = otherUtils.pruneEmpty(response);
					if(response.request){
						response.request_id = request.request_id;
						this.cb(response);
					}else {
						this.callback(request, response);
					}
				});
				break;
			case requests.gpsgaadi_by_uid_map_mongo:
				console.log('Mongo tracksheet request arrive', new Date());
				request.all = true;
				delete request.no_of_rows;
				request.feature = 'tracksheet';
				gpsgaadiService.getGpsGaadiListFromMongo(request, response => {
					response = otherUtils.pruneEmpty(response);
					this.callback(request, response);
					console.log('tracksheet request end_time', new Date());
				});
				break;
			case requests.gpsgaadi_by_uid_list:
				console.log('tracksheet request arrive', new Date());
				// request.all = true;
				delete request.no_of_rows;
				request.feature = 'tracksheet';
				gpsgaadiService.getGpsGaadiList(request, response => {
					response = otherUtils.pruneEmpty(response);
					this.callback(request, response);
					/*
					 let no_of_rows = 10;
					 copyResponse = JSON.parse(JSON.stringify(response));
					 var splitedData, i = 0;
					 /* poc start for first chunk
					 splitedData = copyResponse.data.splice(0, no_of_rows);
					 response.data = splitedData;
					 this.callback(request, response);
					 //poc end
					 */
					/*
					 while (copyResponse.data.length > 0) {
					 splitedData = copyResponse.data.splice(0, no_of_rows);
					 response.data = splitedData;
					 if (i > 0) response.addMore = true;
					 //console.log(splitedData.length,copyResponse.data.length);
					 this.callback(request, response);
					 i++;
					 }
					 */
					console.log('tracksheet request end_time', new Date());
				});
				break;
			case requests.remove_gpsgaadi:
				gpsgaadiService.removeGpsGaadi(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.add_vehicle:
			case requests.add_imei:
				gpsgaadiService.addGpsGaadiFromPool(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_devide_types:
				deviceService.getDeviceTypes(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_device_config:
				deviceService.getDeviceInfo(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_device_info:
				deviceService.getCommandsInfo(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_trips:
				request.feature = 'trips';
				return tripService.getTrip(request, response => {
					this.callback(request, response);
				});
    		case requests.get_vehicle_trips:
		        //console.log(request);
        		request.feature = 'trips';
        		return tripService.getTripForVehicle(request, response => {
            	this.callback(request, response);
				});
			case requests.create_trip:
				request.feature = 'trips';
				return tripService.createTripWithAlarms(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.update_trip:
				request.feature = 'trips';
				return tripService.updateTrip(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.remove_trip:
				request.feature = 'trips';
				return tripService.removeTrip(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.download_report_trip:
				tripService.getTrip(request, response => {
					response.device_id = request.device_id;
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
                    response.timezone = request.timezone;
					response.created_at = request.created_at || new Date();
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
					excelService.getTripReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
			case requests.share_location:
				return shared_locationsService.createSharedLocation(request, response => {
					this.callback(request, response);
				});
			    break;
			case requests.get_shared_locaion:
				return shared_locationsService.getSharedLocation(request, res => {
					//TODO validate timings
					if (res.status === 'OK' && res.data && res.data.imei) {
						gps.getCurrentLocation(parseInt(res.data.imei), (err, dev) => {
							if (!dev) {
								return;
							}
							dev.vehicle_no = res.data.vehicle_no;
							let oReq = {vehicle_no:res.data.vehicle_no,public_link:request.lid,imei:res.data.imei,selected_uid:res.data.user_id};
							alarmService.getAlarm(oReq, resp => {
								if(resp && resp.data && resp.data[0]){
									dev.dest_id = resp.data[0].dest_id;
									dev.gid = resp.data[0].gid;
									let oGReqStop ={gid:dev.gid,selected_uid:res.data.user_id,request:'get_zeozone_by_gid'};
									geozoneService.getGeozone(oGReqStop, resp2 => {
										if(resp2 && resp2.data && resp2.data[0]){
											dev.stop = resp2.data[0].geozone && resp2.data[0].geozone[0] || {};
											dev.stop.name =resp2.data[0].name;
										}
										let oGReqDest ={gid:dev.dest_id || 'dest',selected_uid:res.data.user_id,request:'get_zeozone_by_gid'};
										if(!dev.dest_id ){
											const response = {
												status: 'OK',
												request: request.request,
												message: 'shared location',
												data: dev
											};
											this.callback(request, response);
											return this.feedManager.startFeedForDestAndStops(dev, res.data.device_type);

										}
										geozoneService.getGeozone(oGReqDest, resp3 => {
											if(resp3 && resp3.data && resp3.data[0]){
												dev.destination = resp3.data[0].geozone && resp3.data[0].geozone[0] || {};
												dev.destination.name =resp3.data[0].name;
											}
											const response2 = {
												status: 'OK',
												request: request.request,
												message: 'shared location',
												data: dev
											};
											this.callback(request, response2);
											this.feedManager.startFeedForDestAndStops(dev, res.data.device_type);
										});
									});
								}else{
									const response3 = {
										status: 'OK',
										request: request.request,
										message: 'shared location',
										data: dev
									};
									this.callback(request, response3);
									this.feedManager.startFeedForDestAndStops(dev, res.data.device_type);
								}

							});
						});
					} else {
                        this.callback(request, res);
					}
				});
				break;
			case requests.get_activation_sms:
				return deviceService.getSMSForActivation(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.get_notif_prefs:
				return NotifPrefs.getNotif_pref(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.update_notif_prefs:
				return NotifPrefs.createNotif_pref(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.update_user_notif:
				return mDeviceService.updateMobile(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.get_user_notif:
				return mDeviceService.getMobile(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.download_tracking_sheet:
				request.all = true;
				request.feature = 'tracksheet';
				// winston.info("1");
				gpsgaadiService.getGpsGaadiList(request, response => {
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
					response.login_uid = request.login_uid;
                    response.timezone = request.timezone;
					excelService.getTrackingSheetReport(response, obj => {
						response.data = obj.url;
						response.message = "Tracking sheet generated successfully";
						this.callback(request, response);
					});
				});
				break;
			case requests.download_tracking_sheet_mongo:
				request.all = true;
				request.feature = 'tracksheet';
				// winston.info("1");
				gpsgaadiService.getGpsGaadiListFromMongo(request, response => {
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
					response.login_uid = request.login_uid;
                    response.timezone = request.timezone;
					excelService.getTrackingSheetReport(response, obj => {
						response.data = obj.url;
						response.message = "Tracking sheet generated successfully";
						this.callback(request, response);
					});
				});
				break;
			case requests.get_device_data:
				return deviceService.getDeviceList(request, response => {
					this.callback(request, response);
				});
			// break;
			case requests.get_user_mis_pref:
				// winston.info(request);
				userService.userMISSettings(request, "get", response => {
					this.callback(request, response);
				});
				break;
			case requests.update_user_mis_pref:
				userService.userMISSettings(request, "update", response => {
					this.callback(request, response);
				});
				break;
			case requests.get_malfunction:
				malfunctionService.getMalfunction(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.create_malfunction:
				malfunctionService.createMalfunction(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.update_malfunction:
				malfunctionService.updateMalfunction(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.remove_malfunction:
				malfunctionService.removeMalfunction(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.download_report_malfunction:
				malfunctionService.getMalfunction(request, response => {
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
                    response.timezone = request.timezone;
					excelService.getMalfunctionReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
			case requests.report_activity_interval:
			//case requests.report_activity:
				deviceService.getActivityIntervalReport(request.device_id, request.start_time, request.end_time, request.time_interval, request.client, (err, response) => {
					this.callback(request, response);
				});
				break;
			case requests.download_report_activity_interval:
			//case requests.download_report_activity:
				deviceService.getActivityIntervalReport(request.device_id, request.start_time, request.end_time, request.time_interval, request.client, (err, response) => {
					response.device_id = request.device_id;
					response.login_uid = request.login_uid;
					response.start_time = request.start_time;
					response.end_time = request.end_time;
					if (response.status === 'ERROR') {
						return this.callback(request, response);
					}
                    response.timezone = request.timezone;
					excelService.getActivityReport(response, obj => {
						response.data = obj.url;
						this.callback(request, response);
					});
				});
				break;
			case requests.add_landmark:
				landmarkService.addLandmark(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_landmark:
				landmarkService.getLandmark(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.update_landmark:
				landmarkService.updateLandmark(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.remove_landmark:
				landmarkService.removeLandmark(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.report_geofence_schedule:
				notificationService.getGeofenceScheduleReport(request, response => {
					this.callback(request, response);
				});
				break;
            case requests.download_report_geofence_schedule:
                notificationService.downloadGeofenceScheduleReport(request, response => {
                    this.callback(request, response);
                });
                break;
			case requests.upsert_feature:
				featureService.upsertFeature(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.update_feature:
				featureService.updateFeature(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.get_feature:
				featureService.getFeature(request, (err, response) => {
					this.callback(request, response);
				});
				break;
			case requests.remove_feature:
				featureService.removeFeature(request, response => {
					this.callback(request, response);
				});
				break;
			case requests.daily_uptime:
				deviceService.dailyUptimeAsync(request)
					.then(response => {
						this.callback(request, response);
					});
				break;
			case requests.last_online:
				deviceService.lastOnlineAsync(request)
					.then(response => {
						this.callback(request, response);
					});
				break;
			case requests.report_ac:
				if(request.device_id instanceof Array){
					request.device_id = request.device_id[0];
				}
               brs.getReportForDevice(request.device_id, 'ac', request.start_time, request.end_time, resp => {
					this.callback(request, resp);
				});
				break;
			case requests.report_acc:
				brs.getReportForDevice(request.imei, 'acc', request.start_time, request.end_time, resp => {
					this.callback(request, resp);
				});
				break;
            case requests.create_alarm_schedule:
                alarmScheduleService.createAlarmSchedule(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.get_alarm_schedule:
                alarmScheduleService.getAlarmSchedule(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.update_alarm_schedule:
                alarmScheduleService.updateAlarmSchedule(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.remove_alarm_schedule:
                alarmScheduleService.removeAlarmSchedule(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.get_nearest_geofence_for_point:
                geozoneService.getNearestGeozoneForPoint(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.get_nearest_landmark_for_point:
                landmarkService.getNearestLandmarkForPoint(request, resp => {
                    this.callback(request, resp);
                });
                break;
            case requests.get_nearest_vehicle_for_point:
                deviceService.getNearestVehicleForPoint(request, resp => {
                    this.callback(request, resp);
                });
                break;
			case requests.commands:
				if(request.device_type == 'tk103' || request.device_type == 'ks199' || request.device_type == 'crxv5'){
					this.commandManager.sendCommand(request.device_id, request.command_type, request.device_type, request.param);
					this.callback(request, request);
				}else{
					const oMsg = {
						'status': 'ERROR',
						'message': 'Wrong command blocked for device'
					};
					this.callback(request,oMsg);
				}
				break;

			default:
				const oMsg = {
					'status': 'ERROR',
					'message': 'Wrong emit id'
				};
				this.callback(request,oMsg);
				break;
		}
	}

	stopAllFeeds() {
		this.feedManager.stopAllFeeds();
	}

}

module.exports = RequestManager;
