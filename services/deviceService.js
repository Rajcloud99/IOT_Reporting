const BPromise = require('bluebird');
const Device = BPromise.promisifyAll(require('../model/device'));
const Gps = BPromise.promisifyAll(require('../model/gps'));
const User = require('../model/user');
const GpsGaadi = require('../model/gpsgaadi');
const dateutils = require('../utils/dateutils');
const geozoneCalculator = require('./geozoneCalculator');
const winston = require('../utils/logger');
const async = require('async');
const addressService = BPromise.promisifyAll(require('../services/addressService'));
const requests = require('../config').requests;
const devices = require('../config').devices;
const commands = require('../config').commands;
const alerts = require('../config').alerts;
const limit = require('../config').limit;
const activeusersmanager = require('../utils/activeusersmanager');
const Alerts = BPromise.promisifyAll(require('../model/deviceAlerts'));

exports.getDevice = function (request, callback) {
	Device.getDevice(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'device not found';
		} else {
			response.status = 'OK';
			response.message = 'device found.';
			response.data = res;
		}
		return callback(null, response);
	});
};

exports.updateDevice = function (request, callback) {
	if (request.reg_no) {
		request.reg_no = request.reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
	}
	Device.updateDevice(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'device update failed';
		} else {
			response.status = 'OK';
			response.message = 'Device update done succefully';
			response.data = res;
			activeusersmanager.addDevice(res);
			let cb = function (err, res) {
				winston.error(err);
			};
			let new_req = Object.assign({}, request);
			GpsGaadi.updateGpsGaadi(new_req, cb);
		}
		return callback(response);
	});
};

let registerGpsGaadi = function (err, res) {
	let callback = function (err, res) {
		if (err) {
			winston.error(err);
		}
	};
	if (err) {
		return callback(err);
	} else if (res) {
		GpsGaadi.registerGpsGaadi(res, callback);
	}
};

exports.associateDeviceWithUser = function (request, callback) {
	if (request.reg_no) {
		request.reg_no = request.reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
	}
	if (!request.pooled) {
		request.pooled = 0;
	}
	User.getUser(request.new_uid, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'user not found';
			return callback(response);
		} else {
			request.user_role = res.role;
			if (res.type === 'dealer' || res.type === 'admin') {
				request.pooled = 0;
			}
			Device.associateDeviceWithUser(request, function (err, res) {
				let response = {
					status: 'ERROR',
					message: ""
				};
				if (err) {
					response.message = err.toString();
				} else if (!res) {
					response.message = `device already allocate to ${request.new_uid} you can not allocate again to same account`;
				} else {
					response.status = 'OK';
					response.message = 'Device update done succefully';
					if (request.user_role === 'user') {
						Device.getDevices(request, registerGpsGaadi);
					}
				}
				return callback(response);
			});
		}

	});
};

function registerDeviceHelper(request, callback) {
	if (request.reg_no) {
		request.reg_no = request.reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
	}
	Device.registerDevice(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: "",
			data: request
		};
		if (err) {
			response.message = err;
		} else if (!res) {
			response.message = 'device registration failed';
		} else {
			response.status = 'OK';
			response.message = 'Device registration done succefully';
			activeusersmanager.addDevice(request);
		}
		return callback(response);
	});
}

exports.registerDevice = function (request, callback) {
	function checkDeviceInDBCB(res) {
		if (res.status === 'OK' && res.data.length > 0) {
			let resp = {
				status: 'ERROR',
				meassage: 'imei already exist in DB.',
				data: request
			};
			callback(resp);
		} else {
			registerDeviceHelper(request, callback);
		}
	}

	let oReq = {
		request: "device_by_imei",
		imei: request.imei
	};
	checkDevice(oReq, checkDeviceInDBCB);
};

exports.getAggregatedDASTest = function (device_id, start_time, end_time, callback) {
	const asyncTasks = [];
	let adasold, adasnew;
	asyncTasks.push(function (done) {
		getAggregatedDASOld(device_id, start_time, end_time, false, function (err, res) {
			adasold = res;
			done();
		});
	});
	asyncTasks.push(function (done) {
		getAggregatedDASNew(device_id, start_time, end_time, false, function (err, res) {
			adasnew = res;
			done();
		});
	});
	async.parallel(asyncTasks, function () {
		callback(adasold, adasnew);
	});
};

function getAggregatedDAS(device_id, start_time, end_time, isAddrReqd, callback) {
	const old = false;
	if (old) getAggregatedDASOld(device_id, start_time, end_time, isAddrReqd, callback);
	else getAggregatedDASNew(device_id, start_time, end_time, isAddrReqd, callback);
}

function getAggregatedDASNew(device_id, start_time, end_time, isAddrReqd, callback) {
    let asyncTasks = [];
    let adasRefined, adas;

    if (new Date(start_time).getTime() < dateutils.getMorning(new Date()).getTime()) {
        asyncTasks.push(function (cb) {
            Device.getAdasRefinedNewAsync(device_id, start_time,
                new Date(end_time).getTime() < dateutils.getMorning(new Date()).getTime() ? end_time : dateutils.getMorning(new Date()))
                .then(function (res) {
                    adasRefined = res;
                    // winston.info('adasRefined', JSON.stringify(adasRefined));
                })
                .error(function (err) {
                })
                .then(function () {
                    cb();
                });
        });
    }

    if (new Date(end_time).getTime() > dateutils.getMorning(new Date()).getTime()) {
        asyncTasks.push(function (cb) {
            Device.getAggregatedDASAsync(device_id,
                dateutils.getMorning(new Date()),
                end_time)
                .then(function (res) {
                    adas = res;
                })
                .error(function (err) {
                })
                .then(function () {
                    cb();
                });
        });
    }

    async.parallel(asyncTasks, function () {
        let res;
        let data = [];
        if (adasRefined) data = data.concat(adasRefined);
        if (adas) data = data.concat(adas);
        BPromise.promisify(processADASReport)(data, isAddrReqd)
            .then(function (response) {
                res = response;
            })
            .error(function (err) {
            })
            .then(function () {
                callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
            });
    });
}

function getAggregatedDASV2(device_id, start_time, end_time, isAddrReqd, callback) {
	let asyncTasks = [];
	let adasRefined, adas;
    //console.log('before getAggregatedV2 ',new Date());
	if (new Date(start_time).getTime() < dateutils.getMorning(new Date()).getTime()) {
		asyncTasks.push(function (cb) {
			Device.getAdasRefinedNewAsync(device_id, start_time,
				new Date(end_time).getTime() < dateutils.getMorning(new Date()).getTime() ? end_time : dateutils.getMorning(new Date()))
				.then(function (res) {
					adasRefined = res;
             	})
				.error(function (err) {
					winston.error('getAggregatedDASV2 ', err.toString());
				})
				.then(function () {
					cb();
				});
		});
	}

	if (new Date(end_time).getTime() > dateutils.getMorning(new Date()).getTime()) {
		asyncTasks.push(function (cb) {
			Gps.getGPSDataBetweenTimeAsync(device_id,
                new Date(start_time).getTime() < dateutils.getMorning(new Date()).getTime() ? dateutils.getMorning(new Date()) : start_time,
				end_time)
				.then(function (res) {
                    return processRawDataAsync(device_id,res);
				}).then(function (das) {
                for (let i = 0; i < das.length; i++) {
                    if ((das[i].distance / das[i].duration * 3.6 > 100) || (das[i].distance / das[i].duration * 3.6 < 3)) {
                        das[i].distance = 0;
                        das[i].drive = false;
                    }else if(das[i].distance < 250 && (das[i].distance / das[i].duration * 3.6 < 10)){
                        das[i].distance = 0;
                        das[i].drive = false;
					}else{
                    	//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
					}
                }
                   adas = das;
                }).error(function (err) {
                    console.log('err'+err.toString());
				})
				.then(function () {
                  //  console.log('after getGPSDataBetween time ',new Date());
					cb();
				});
		});
	}

	async.parallel(asyncTasks, function () {
		let res;
		let data = [];
		if (adasRefined) data = data.concat(adasRefined);
		if (adas) data = data.concat(adas);
     	BPromise.promisify(processADASReportV2)(data, isAddrReqd)
			.then(function (response) {
                //console.log('after processADASReportV2 time ',new Date());
				res = response;
			})
			.error(function (err) {
			})
			.then(function () {
				callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
			});
	});
}


function getAggregatedDASV3(device_id, start_time, end_time, isAddrReqd, callback) {
	let asyncTasks = [];
	let adasRefined, adas;
	//console.log('before getAggregatedV2 ',new Date());
	if (new Date(start_time).getTime() < dateutils.getMorning(new Date()).getTime()) {
		asyncTasks.push(function (cb) {
			Device.getAdasRefinedNewAsync(device_id, start_time,
				new Date(end_time).getTime() < dateutils.getMorning(new Date()).getTime() ? end_time : dateutils.getMorning(new Date()))
				.then(function (res) {
					adasRefined = res;
				})
				.error(function (err) {
					winston.error('getAggregatedDASV3 ', err.toString());
				})
				.then(function () {
					cb();
				});
		});
	}

	if (new Date(end_time).getTime() > dateutils.getMorning(new Date()).getTime()) {
		asyncTasks.push(function (cb) {
			Gps.getGPSDataBetweenTimeAsync(device_id,
				new Date(start_time).getTime() < dateutils.getMorning(new Date()).getTime() ? dateutils.getMorning(new Date()) : start_time,
				end_time)
				.then(function (res) {
					return processRawDataAsync(device_id, res);
				}).then(function (das) {
					checkAnomaly(das);
					let oSettings = { removePoints: true };
					checkIdlingFromADAS(das, oSettings);
					adas = das;
				}).error(function (err) {
					console.log('err' + err.toString());
				})
				.then(function () {
					//  console.log('after getGPSDataBetween time ',new Date());
					cb();
				});
		});
	}

	async.parallel(asyncTasks, function () {
		let res;
		let data = [];
		if (adasRefined) data = data.concat(adasRefined);
		if (adas) data = data.concat(adas);
		BPromise.promisify(processADASForIdleSummaryReport)(data, isAddrReqd)
			.then(function (response) {
				//console.log('after processADASForIdleSummaryReport time ',new Date());
				res = response;
			})
			.error(function (err) {
			})
			.then(function () {
				callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
			});
	});
}

exports.getAggregatedDASVForHalts = function(request, callback) {
	let asyncTasks = [];
	let adasRefinedPre ,adasRefinedPost, adasRefined;
	//console.log('before getAggregatedV2 ',new Date());
	//pre data fetch condition on date
	let dayBeforeToday = new Date(request.start_time).getTime() < dateutils.getMorning(new Date()).getTime()  ? true : false;
	let startOfDayBefore = new Date(request.start_time).getHours() ==  dateutils.getMorning(new Date()).getHours() ? false : true;
	let next_day_of_start = new Date(request.start_time);
	next_day_of_start.setDate(next_day_of_start.getDate() + 1);
    let isLessThanDayEnd = new Date(request.end_time).getTime() <  dateutils.getMorning(next_day_of_start) ? true : false;
	if (dayBeforeToday && startOfDayBefore) {
		//check if end time is also in past
		asyncTasks.push(function (cb) {
			Gps.getGPSDataBetweenTimeAsync(request.device_id,request.start_time,
				isLessThanDayEnd ? request.end_time : dateutils.getMorning(next_day_of_start))
				.then(function (resPre) {
					return processRawDataAsync(request.device_id,resPre);
				}).then(function (das) {
				for (let i = 0; i < das.length; i++) {
					if ((das[i].distance / das[i].duration * 3.6 > 100) || (das[i].distance / das[i].duration * 3.6 < 3)) {
						das[i].distance = 0;
						das[i].drive = false;
					}else if(das[i].distance < 250 && (das[i].distance / das[i].duration * 3.6 < 10)){
						das[i].distance = 0;
						das[i].drive = false;
					}else{
						//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
					}
				}
				adasRefinedPre = das;
			}).error(function (err) {
				console.log('err in adasRefinedPre'+err.toString());
			}).then(function () {
					cb();
				});
		});
	}
	if(!isLessThanDayEnd && dayBeforeToday){
        let req = {
            start_time : dateutils.getMorning(request.start_time),
            end_time : dateutils.getMorning(request.end_time),
            device_id : request.device_id
        };
        asyncTasks.push(function (cb) {
            Gps.dailyData(req, function (err, res) {
                if (err) {
                    console.log('err dailyData',err);
                } else if (!res || res.length === 0) {
                   // response.message = 'location not found in DB for ';
                    //return callback(null,response);
                } else {
                    adasRefined = res;
                }
                cb();
            });
        });
    }

	if (new Date(request.end_time).getTime() > dateutils.getMorning(new Date()).getTime()) {
		asyncTasks.push(function (cb) {
			Gps.getGPSDataBetweenTimeAsync(device_id,
				new Date(request.start_time).getTime() < dateutils.getMorning(new Date()).getTime() ? dateutils.getMorning(new Date()) : request.start_time,
				request.end_time)
				.then(function (res) {
					return processRawDataAsync(device_id,res);
				}).then(function (das) {
				for (let i = 0; i < das.length; i++) {
					if ((das[i].distance / das[i].duration * 3.6 > 100) || (das[i].distance / das[i].duration * 3.6 < 3)) {
						das[i].distance = 0;
						das[i].drive = false;
					}else if(das[i].distance < 250 && (das[i].distance / das[i].duration * 3.6 < 10)){
						das[i].distance = 0;
						das[i].drive = false;
					}else{
						//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
					}
				}
                adasRefinedPost = das;
			}).error(function (err) {
				console.log('err'+err.toString());
			})
				.then(function () {
					//  console.log('after getGPSDataBetween time ',new Date());
					cb();
				});
		});
	}

	async.parallel(asyncTasks, function () {
		let res;
		let data = [];
		if (adasRefinedPre) data = data.concat(adasRefinedPre);
		if (adasRefined) data = data.concat(adasRefined);
		if (adasRefinedPost) data = data.concat(adasRefinedPost);
		BPromise.promisify(processHaltSummary)(data)
			.then(function (response) {
				//console.log('after processADASReportV2 time ',new Date());
				res = response;
			})
			.error(function (err) {
			})
			.then(function () {
				callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
			});
	});
}

function getAggregatedDASOld(device_id, start_time, end_time, isAddrReqd, callback) {
	let res;
	Device.getAggregatedDASAsync(device_id, start_time, end_time)
		.then(function (data) {
			for (let i = 0; i < data.length; i++) {
				if ((data[i].distance / data[i].duration * 3.6 > 160) || (data[i].distance / data[i].duration * 3.6 < 2)) {
					data[i].distance = 0;
					data[i].drive = false;
				}
			}
			return BPromise.promisify(processADASReport)(data, isAddrReqd);
		})
		.then(function (response) {
			res = response;
		})
		.error(function (err) {
		})
		.then(function () {
			callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
		});
}

exports.getParkingReport = function (device_id, start_time, end_time, minimum_time_in_mins, client, callback) {
	getAggregatedDASV2(device_id, start_time, end_time, true, function (err, res) {
		let response = {
			device_id: device_id,
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'data not found for given time duration and vehicle';
		} else {
			response.status = 'OK';

			for (let key in res) {
				let device = res[key];
				let num_stops = 0;
				let dur_stop = 0;
				if(device.data[0] && !device.data[0].drive){
					//exclude start halt
					num_stops = num_stops - 1;
				}

				if(device.data.length > 1 && device.data[device.data.length-1] && !device.data[device.data.length-1].drive){
					//exclude end halt
					num_stops = num_stops - 1;
				}
				for (let i = 0; i < device.data.length; i++) {
					if (device.data[i].drive || (minimum_time_in_mins && device.data[i].duration < minimum_time_in_mins * 60)) {
						device.data.splice(i, 1);
						i--;
					} else {
						num_stops++;
						dur_stop += device.data[i].duration;
					}
				}

				device.num_stops = num_stops;
				device.dur_stop = dur_stop;
			}

			response.data = res;
			response.message = 'parking report';
			if (client === 'android') {
				let aRes = [];
				for (let dev in res) {
					res[dev].device_id = dev;
					res[dev].data = null;
					aRes.push(res[dev]);
				}
				response.data = aRes;
			}
		}
		callback(null, response);
	});
};

exports.getHaltViewReport = function (device_id, start_time, end_time, minimum_time_in_mins, client, callback) {
	getAggregatedDASV2(device_id, start_time, end_time, true, function (err, res) {
		let response = {
			device_id: device_id,
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'data not found for given time duration and vehicle';
		} else {
			response.status = 'OK';

            for (let key in res) {
                let device = res[key];
                let num_stops = 0;
                let dur_stop = 0;
                for (let i = 0; i < device.data.length; i++) {
                    if (device.data[i].drive || (minimum_time_in_mins && device.data[i].duration < minimum_time_in_mins * 60)) {
                        device.data.splice(i, 1);
                        i--;
                    } else {
                        num_stops++;
                        dur_stop += device.data[i].duration;
                    }
                }
                device.num_stops = num_stops;
                device.dur_stop = dur_stop;
                //
                device.start = device.data && device.data[0];
                device.end = device.data && device.data[device.data.length -1];
                delete device.data;
            }

			response.data = res;
			response.message = 'Halt Summary';
		}
		callback(null, response);
	});
};

function  combineADASData(device, callback) {
	for (let i = 1; i < device.data.length; i++) {
		//don't club drives and stops together
		if (device.data[i].drive !== device.data[i - 1].drive) continue;
		//don't club idle and stop together
		if (device.idling && device.data[i].idle != device.data[i - 1].idle) continue;
        //don't club 30 min and more predicted data
		//if((device.data[i].pr && device.data[i].duration > 1800 && device.data[i].distance > 5000) || (device.data[i-1].pr && device.data[i-1].duration > 1800 && device.data[i - 1].distance > 5000))  continue;
		//can't club more than 30 min diff
		if ((new Date(device.data[i].start_time).getTime() - new Date(device.data[i - 1].end_time).getTime()) > 30 * 60 * 1000) continue;

		device.data[i - 1].end_time = device.data[i].end_time;
		device.data[i - 1].stop = device.data[i].stop;
		device.data[i - 1].stop_addr = device.data[i].stop_addr;

		device.data[i - 1].duration = parseInt((new Date(device.data[i].end_time).getTime() - new Date(device.data[i - 1].start_time).getTime()) / 1000);
		device.data[i - 1].idle_duration =(device.data[i - 1].idle_duration|| 0) + ( device.data[i].idle_duration || 0);
		device.data[i - 1].distance = (device.data[i - 1].distance || 0) + (device.data[i].distance || 0);
		if (device.data[i].googleaddr) {
			device.data[i - 1].start_addr = device.data[i].start_addr;
			device.data[i - 1].googleaddr = true;
		}
		//copy points from removable ADAS to prev ADAS
		if(device.data[i-1].points && device.data[i-1].points.length){
			if(device.data[i].points && device.data[i].points.length){
				device.data[i-1].points = device.data[i-1].points.concat(device.data[i].points);
			}
		}else if(device.data[i].points && device.data[i].points.length){
			device.data[i-1].points = device.data[i].points;
		}
		device.data.splice(i, 1);
		i--;
	}
	callback(null, true);
}

function  checkDriverChange(device,options, callback) {
	let deviceInv,aDeviceAlerts=[],lastDr,lastHaltDriver,lastHaltRfid;
	getDeviceStatusAsync(device.imei)
		.then(function (oDevice) {
			if(oDevice.status == 'OK'){
				deviceInv = oDevice.data[0];
				lastHaltRfid = deviceInv.rfid1;
				lastHaltDriver = deviceInv.driver || deviceInv.driver_name;
			}
			/*
			//last rfid swapped
			let reqIni = {imeis:device.imei,code:'rfid',end_date:options.start_time,row_count:1};
			return getDeviceAlertsAsync(reqIni);
			 */
			let reqIni = {imei:[device.imei],code:'rfid',to:options.start_time,no_of_docs:1};
			return getDeviceAlertsFromGeographyAsync(reqIni)
		})
		.then(function (aAlLast) {
			if(aAlLast && aAlLast.length){
				lastDr = aAlLast[0];
				lastHaltRfid = lastDr.extra;
				lastHaltDriver = lastDr.driver || deviceInv.driver || deviceInv.driver_name;
			}
			/*
			let req = {imeis:device.imei,code:'rfid',start_date:options.start_time,end_date:options.end_time};
			return getDeviceAlertsAsync(req);
			*/
			let reqIni2 = {imei:[device.imei],code:'rfid',from:options.start_time,to:options.end_time,sort:{_id:1}};
			return getDeviceAlertsFromGeographyAsync(reqIni2)
		}).then(function (aAl) {
			if(aAl && aAl.length){
				aDeviceAlerts = aAl;
				for (let i = 0; i < device.data.length; i++) {
					device.data[i].rfid = lastHaltRfid;
					device.data[i].driver = lastHaltDriver;
					for(a=0;a<aAl.length;a++){
						if(device.data[i].start_time <= new Date(aAl[a].datetime) && new Date(aAl[a].datetime) <= device.data[i].end_time){
							device.data[i].rfid = aAl[a].extra;
                            lastHaltRfid = aAl[a].extra;
							device.data[i].driver = aAl[a].driver;
                            lastHaltDriver = aAl[a].driver;
							break;
						}
					}
				}
			}
			callback(null, device);
	    });
}

// clubs drive-stop-drive to drive
function clubDrivesAndStops(device, callback) {
	for (let i = 2; i < device.data.length; i++) {
		if (!device.data[i - 2].drive) continue;
		if (device.data[i - 1].drive) continue;
		if (!device.data[i].drive) continue;
		//don't club id idle situation occurs
		if (device.idling && (device.data[i - 2].idle || device.data[i - 1].idle || device.data[i].idle)) continue;
		
		if(device.data[i - 1].duration > 180) continue;

		if ((new Date(device.data[i - 2].end_time).getTime() - new Date(device.data[i - 1].start_time).getTime()) > 3 * 60 * 1000) continue;
		
		if ((new Date(device.data[i - 1].end_time).getTime() - new Date(device.data[i].start_time).getTime()) > 3 * 60 * 1000) continue;
	
		device.data[i - 2].end_time = device.data[i].end_time;
		device.data[i - 2].stop = device.data[i].stop;
		device.data[i - 2].stop_addr = device.data[i].stop_addr;

		device.data[i - 2].duration = parseInt((new Date(device.data[i].end_time).getTime() - new Date(device.data[i - 2].start_time).getTime()) / 1000);
		device.data[i - 2].distance += device.data[i].distance;
		//copy points from removable ADAS to prev ADAS
		if(device.data[i-2].points && device.data[i-2].points.length){
			if(device.data[i].points && device.data[i].points.length){
				device.data[i-2].points = device.data[i-2].points.concat(device.data[i].points);
			}
		}else if(device.data[i].points && device.data[i].points.length){
			device.data[i-2].points = device.data[i].points;
		}
		device.data.splice(i - 1, 2);
		i--;
	}
	callback(null, true);
}

function processADASReport(data, isAddrReqd, callback) {
	for (let i = 0; i < data.length; i++) {
		if (!data[i].drive && (data[i].distance / data[i].duration * 3.6) > 10) {
			data[i].drive = true;
        }
		if (data.idle === undefined) continue;
		data[i].idle_duration = data[i].idle ? data[i].duration : 0;
		delete data[i].idle;
	}

	let devices = {};
	let allDevices = activeusersmanager.getAllDevices();

	for (let i = 0; i < data.length; i++) {
		data[i].imei = parseInt(data[i].imei);
		if (!devices[data[i].imei]) {
			devices[data[i].imei] = {
				data: []
			};
		}
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
		devices[data[i].imei].data.push(data[i]);
	}

	async.each(devices, function (device, done) {
		device.data.sort(function (a, b) {
			let keyA = new Date(a.start_time),
				keyB = new Date(b.start_time);
			// Compare the 2 dates
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			return 0;
		});

		BPromise.promisify(removeUnrealisticSpeeds)(device.data).then(function () {
			return BPromise.promisify(predictOfflineDistance)(device.data);
		}).then(function () {
			return BPromise.promisify(calculateDatewiseDist)(device);
		}).then(function () {
			return BPromise.promisify(combineADASData)(device);
		}).then(function () {
			return BPromise.promisify(clubDrivesAndStops)(device);
		}).then(function () {
			return BPromise.promisify(combineADASData)(device);
		}).then(function () {
			if (isAddrReqd) return BPromise.promisify(fillAddressIfRequired)(device);
		}).then(function () {
			for (let i = 0; i < device.data.length; i++) {
				device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
			}

			let dist = 0;
			let num_idle = 0;
			let num_stops = 0;
			let dur_stop = 0;
			let dur_total = 0;
			let dur_idle = 0;
			let topSpeed = 0;
			for (let key in device.data) {
				if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
					topSpeed = device.data[key].top_speed;
				}
				dist += device.data[key].distance;
				if (!device.data[key].drive) {
					if (device.data[key].status === 'idle') {
						num_idle++;
					}
					dur_idle += device.data[key].idle_duration;
					num_stops++;
					dur_stop += device.data[key].duration;
				} else {
					device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
					if(device.data[key].average_speed > 65){
						device.data[key].average_speed = device.data[key].top_speed;
					}
				}
				dur_total += device.data[key].duration;
			}
			device.top_speed = topSpeed;
			device.num_stops = num_stops;
			device.num_idle = num_idle;
			device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
			device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
			device.tot_dist = dist;
			device.dur_total = dur_total;
			device.dur_idle = dur_idle || 0;
			device.dur_stop = dur_stop;
			device.dur_wo_stop = dur_total - dur_stop;
			device.engine_hours = dur_total - dur_stop + device.dur_idle;
			done();
		});
	}, function (err) {
		callback(null, devices);
	});
}
function processADASReportV2(data, isAddrReqd, callback) {
    for (let i = 0; i < data.length; i++) {
		data[i].duration = (new Date(data[i].end_time).getTime() - new Date(data[i].start_time).getTime())/1000;
		if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
            data[i].drive = false;
            data[i].distance = 0;
		}
        if (data.idle === undefined) continue;
        data[i].idle_duration = data[i].idle ? data[i].duration : 0;
        delete data[i].idle;
    }

    let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
    for (let i = 0; i < data.length; i++) {
        data[i].imei = parseInt(data[i].imei);
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: []
            };
        }
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
        devices[data[i].imei].data.push(data[i]);
    }

    async.each(devices, function (device, done) {
        device.data.sort(function (a, b) {
            let keyA = new Date(a.start_time),
                keyB = new Date(b.start_time);
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

        BPromise.promisify(predictOfflineDistance)(device.data).then(function () {
            return BPromise.promisify(calculateDatewiseDist)(device);
        }).then(function () {
            return BPromise.promisify(combineADASData)(device);
        }).then(function () {
            //return;
            return BPromise.promisify(clubDrivesAndStops)(device);
        }).then(function () {
            //return;
            return BPromise.promisify(combineADASData)(device);
        }).then(function () {
            if (isAddrReqd) return BPromise.promisify(fillAddressIfRequired)(device);
        }).then(function () {
			// if (options && options.isAddrReqd){
			if(device.user_id == 'kd'){
				return BPromise.promisify(fillLandmarkIfRequired)(device);
			}else{
				return;
			}
		}).then(function () {
            for (let i = 0; i < device.data.length; i++) {
                device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
            }

            let dist = 0;
            let num_idle = 0;
            let num_stops = 0;
            let dur_stop = 0;
            let dur_total = 0;
            let dur_idle = 0;
            let topSpeed = 0;
            for (let key in device.data) {
                if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
                    topSpeed = device.data[key].top_speed;
                }
                dist += device.data[key].distance;
                if (!device.data[key].drive) {
                    if (device.data[key].status === 'idle') {
                        num_idle++;
                    }
                    dur_idle += device.data[key].idle_duration;
                    num_stops++;
                    dur_stop += device.data[key].duration;
                } else {
                    device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
					if(device.data[key].average_speed > 65){
						device.data[key].average_speed = device.data[key].top_speed;
					}

                }
                dur_total += device.data[key].duration;
            }
            if(device.data[0] && !device.data[0].drive){
            	//exclude start halt
				num_stops = num_stops - 1;
			}

			if(device.data.length > 1 && device.data[device.data.length-1] && !device.data[device.data.length-1].drive){
				//exclude end halt
				num_stops = num_stops - 1;
			}

            device.top_speed = topSpeed;
            device.num_stops = num_stops;
            device.num_idle = num_idle;
            device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
            device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
            device.tot_dist = dist;
            device.dur_total = dur_total;
            device.dur_idle = dur_idle || 0;
            device.dur_stop = dur_stop;
            device.dur_wo_stop = dur_total - dur_stop;
            device.engine_hours = dur_total - dur_stop + device.dur_idle;
            done();
        });
    }, function (err) {
        callback(null, devices);
    });
}

function processADASForIdleSummaryReport(data,options, callback) {
    for (let i = 0; i < data.length; i++) {
        if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
            data[i].drive = false;
            //data[i].distance = 0;
		}
    }

    let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
    for (let i = 0; i < data.length; i++) {
        data[i].imei = parseInt(data[i].imei);
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: [],
				idling:options.idling
            };
        }
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
        devices[data[i].imei].data.push(data[i]);
    }

    async.each(devices, function (device, done) {
		/*
        device.data.sort(function (a, b) {
            let keyA = new Date(a.start_time),
                keyB = new Date(b.start_time);
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
       */
		BPromise.promisify(predictOfflineDistance)(device.data)
			.then(function () {
				return BPromise.promisify(combineADASData)(device);
			})
			.then(function () {
			    return BPromise.promisify(clubDrivesAndStops)(device);
		    }).then(function () {
			   return BPromise.promisify(combineADASData)(device);
		    })
			.then(function () {
              for (let i = 0; i < device.data.length; i++) {
				device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
				if(device.data[i+1] && device.data[i].status == 'idle'){
					if(device.data[i+1].drive){
						device.data[i].aist = 'running';
					}else{
						device.data[i].aist = 'stopped';
					}	
				}  
				if(device.data[i].status != 'idle' || device.data[i].duration == 0){
					device.data.splice(i,1);
					i--;
				}
            }
            let dist = 0;
            let num_idle = 0;
            let num_stops = 0;
            let dur_stop = 0;
            let dur_total = 0;
            let dur_idle = 0;
            let topSpeed = 0;
            for (let key in device.data) {
                if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
                    topSpeed = device.data[key].top_speed;
                }
                dist += device.data[key].distance;
                if (!device.data[key].drive) {
                    if (device.data[key].status === 'idle') {
                        num_idle++;
                    }
                    dur_idle = dur_idle + (device.data[key].idle_duration || 0);
                    num_stops++;
                    dur_stop += device.data[key].duration;
                }
                dur_total += device.data[key].duration;
            }
            device.num_stops = num_stops;
            device.num_idle = num_idle;
            device.dur_total = dur_total;
            device.dur_idle = dur_idle || 0;
            device.dur_stop = dur_stop;
            device.engine_hours = dur_total - dur_stop + device.dur_idle;
        }).then(function () {
			if (options && options.isAddrReqd){
			//	return BPromise.promisify(fillAddressIfRequired)(device);
			}
        }).then(function () {
			done();		
        });
    }, function (err) {
        callback(err, devices);
    });
}

function processHaltSummary(data, callback) {
	let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
	for (let i = 0; i < data.length; i++) {
		data[i].imei = parseInt(data[i].imei);
		if (!devices[data[i].imei]) {
			devices[data[i].imei] = {
				data: []
			};
		}
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
		devices[data[i].imei].data.push(data[i]);
	}

	async.each(devices, function (device, done) {
			let dist = 0;
			let num_idle = 0;
			let num_stops = 0;
			let dur_stop = 0;
			let dur_total = 0;
			let dur_idle = 0;
			let topSpeed = 0;
			for (let key in device.data) {
				if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
					topSpeed = device.data[key].top_speed;
				}
				dist += device.data[key].distance;
				if (!device.data[key].drive) {
					if (device.data[key].status === 'idle') {
						num_idle++;
					}
					dur_idle += device.data[key].idle_duration;
					num_stops++;
					dur_stop += device.data[key].duration;
				} else {
					device.data[key].average_speed = ((device.data[key].distance / (device.data[key].duration ||  device.data[key].dur_stop)) * 3.6).toFixed(2);
					if(device.data[key].average_speed > 65){
						device.data[key].average_speed = device.data[key].top_speed;
					}
				}
				dur_total += device.data[key].duration || device.data[key].dur_stop;
			}
			device.top_speed = topSpeed;
			device.num_stops = num_stops;
			device.num_idle = num_idle;
			device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
			device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
			device.tot_dist = dist;
			device.dur_total = dur_total;
			device.dur_idle = dur_idle || 0;
			device.dur_stop = dur_stop;
			device.dur_wo_stop = dur_total - dur_stop;
			device.engine_hours = dur_total - dur_stop + device.dur_idle;
			done();
	}, function (err) {
		callback(null, devices);
	});
}

function processADASReportForPlayBack(data,options, callback) {
    for (let i = 0; i < data.length; i++) {
		let spd = data[i].distance / data[i].duration * 3.6;
        if (!data[i].drive && data[i].distance > 200 && spd > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || spd < 3)){
            data[i].drive = false;
            //data[i].distance = 0;
		}
        if (data[i].idle){
			data[i].idle_duration =  data[i].duration;
			//delete data[i].idle;
		}
    }

    let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
    for (let i = 0; i < data.length; i++) {
        data[i].imei = parseInt(data[i].imei);
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: [],
				idling:options.idling
            };
        }
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
        devices[data[i].imei].data.push(data[i]);
    }

    async.each(devices, function (device, done) {
        device.data.sort(function (a, b) {
            let keyA = new Date(a.start_time),
                keyB = new Date(b.start_time);
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

		BPromise.promisify(predictOfflineDistance)(device.data)
			.then(function () {
				return BPromise.promisify(combineADASData)(device);
			}).then(function () {
			    return BPromise.promisify(clubDrivesAndStops)(device);
		    }).then(function () {
			   return BPromise.promisify(combineADASData)(device);
		    }).then(function () {
            for (let i = 0; i < device.data.length; i++) {
				if(options.haltDuration && !device.data[i].drive && (device.data[i].duration < options.haltDuration)){
					device.data.splice(i,1);
					continue;
				}
				//stop distane added in next running
				if(device.data[i-1] && !device.data[i-1].drive && device.data[i].drive ){
					device.data[i].distance = device.data[i].distance + device.data[i-1].distance;
				}
				//if last is halt add its distance in last running
				if(i == device.data.length-1){
					if(device.data[i-1] && device.data[i-1].drive && !device.data[i].drive ){
						device.data[i-1].distance = device.data[i].distance + device.data[i-1].distance;
					}
				}				
                device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
            }

            let dist = 0;
            let num_idle = 0;
            let num_stops = 0;
            let dur_stop = 0;
            let dur_total = 0;
            let dur_idle = 0;
            let topSpeed = 0;
            for (let key in device.data) {
                if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
                    topSpeed = device.data[key].top_speed;
                }
                //dist += device.data[key].distance;
                if (!device.data[key].drive) {
                    if (device.data[key].status === 'idle') {
                        num_idle++;
                    }
					dur_idle += device.data[key].idle_duration || 0;
                    num_stops++;
                    dur_stop += device.data[key].duration;
                } else {
					dist += device.data[key].distance;
                    device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
                    if(device.data[key].average_speed > 65){
						device.data[key].average_speed = device.data[key].top_speed;
					}
                }
                dur_total += device.data[key].duration;
            }
            device.top_speed = topSpeed;
            device.num_stops = num_stops;
            device.num_idle = num_idle;
            device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
            device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
            device.tot_dist = dist;
            device.dur_total = dur_total;
            device.dur_idle = dur_idle || 0;
            device.dur_stop = dur_stop;
            device.dur_wo_stop = dur_total - dur_stop;
            device.engine_hours = dur_total - dur_stop + device.dur_idle;
        }).then(function () {
			if (options && options.isAddrReqd){
				return BPromise.promisify(fillAddressIfRequired)(device);
			}
        }).then(function () {
			// if (options && options.isAddrReqd){
			if(device.user_id == 'kd'){
				return BPromise.promisify(fillLandmarkIfRequired)(device);
			}else{
				return;
			}
		}).then(function () {
			done();		
        });
    }, function (err) {
        callback(err, devices);
    });
}

function processADASReportForIdling(data,options, callback) {
    for (let i = 0; i < data.length; i++) {
        if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
            data[i].drive = true;
        }else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
            data[i].drive = false;
            //data[i].distance = 0;
		}
    }

    let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
    for (let i = 0; i < data.length; i++) {
        data[i].imei = parseInt(data[i].imei);
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: [],
				idling:options.idling
            };
        }
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].user_id = allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
        devices[data[i].imei].data.push(data[i]);
    }

    async.each(devices, function (device, done) {
        device.data.sort(function (a, b) {
            let keyA = new Date(a.start_time),
                keyB = new Date(b.start_time);
            // Compare the 2 dates
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

		BPromise.promisify(predictOfflineDistance)(device.data)
			.then(function () {
				return BPromise.promisify(combineADASData)(device);
			})
			.then(function () {
			    return BPromise.promisify(clubDrivesAndStops)(device);
		    }).then(function () {
			   return BPromise.promisify(combineADASData)(device);
		    })
			.then(function () {
              for (let i = 0; i < device.data.length; i++) {
				if(device.data[i+1] && device.data[i].status == 'idle'){
					if(device.data[i+1].drive){
						device.data[i].aist = 'running';
					}else{
						device.data[i].aist = 'stopped';
					}	
				} 
				if(device.data[i].drive){
					device.data.splice(i,1);
					i--;
				}
				if(device.data[i].duration == 0){
					device.data.splice(i,1);
					i--;
				}
                device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
				
              }
            let dist = 0;
            let num_idle = 0;
            let num_stops = 0;
            let dur_stop = 0;
            let dur_total = 0;
            let dur_idle = 0;
            let topSpeed = 0;
            for (let key in device.data) {
                if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
                    topSpeed = device.data[key].top_speed;
                }
                dist += device.data[key].distance;
                if (!device.data[key].drive) {
                    if (device.data[key].status === 'idle') {
                        num_idle++;
                    }
                    dur_idle = dur_idle + (device.data[key].idle_duration || 0);
                    num_stops++;
                    dur_stop += device.data[key].duration;
                }
                dur_total += device.data[key].duration;
            }
            device.num_stops = num_stops;
            device.num_idle = num_idle;
            device.dur_total = dur_total;
            device.dur_idle = dur_idle || 0;
            device.dur_stop = dur_stop;
            device.engine_hours = dur_total - dur_stop + device.dur_idle;
        }).then(function () {
			if (options && options.isAddrReqd){
			//	return BPromise.promisify(fillAddressIfRequired)(device);
			}
        }).then(function () {
			done();		
        });
    }, function (err) {
        callback(err, devices);
    });
}

function processADASDriverReportForPlayBack(data,options, callback) {
	for (let i = 0; i < data.length; i++) {
		if (!data[i].drive && data[i].distance > 200 && (data[i].distance / data[i].duration * 3.6) > 10) {
			data[i].drive = true;
		}else if(data[i].drive && (data[i].distance < 200 || (data[i].distance / data[i].duration * 3.6) < 3)){
			data[i].drive = false;
			//data[i].distance = 0;
		}
		if (data.idle === undefined) continue;
		data[i].idle_duration = data[i].idle ? data[i].duration : 0;
		delete data[i].idle;
	}

	let devices = {};
	let allDevices = activeusersmanager.getAllDevices();
	for (let i = 0; i < data.length; i++) {
		data[i].imei = parseInt(data[i].imei);
		if (!devices[data[i].imei]) {
			devices[data[i].imei] = {
				data: []
			};
		}
		devices[data[i].imei].imei = allDevices[data[i].imei] && allDevices[data[i].imei].imei;
		devices[data[i].imei].reg_no = allDevices[data[i].imei] && allDevices[data[i].imei].reg_no;
		devices[data[i].imei].driver = allDevices[data[i].imei] && allDevices[data[i].imei].driver;
		devices[data[i].imei].driver_name = allDevices[data[i].imei] && allDevices[data[i].imei].driver_name;
		devices[data[i].imei].driver_name2 = allDevices[data[i].imei] && allDevices[data[i].imei].driver_name2;
		devices[data[i].imei].user_id = options.login_uid || device.user_id || allDevices[data[i].imei] && allDevices[data[i].imei].user_id;
		devices[data[i].imei].data.push(data[i]);
	}

	async.each(devices, function (device, done) {
		device.data.sort(function (a, b) {
			let keyA = new Date(a.start_time),
				keyB = new Date(b.start_time);
			// Compare the 2 dates
			if (keyA < keyB) return -1;
			if (keyA > keyB) return 1;
			return 0;
		});

		BPromise.promisify(predictOfflineDistance)(device.data)
			.then(function () {
				return BPromise.promisify(combineADASData)(device);
		}).then(function () {
			return BPromise.promisify(clubDrivesAndStops)(device);
		}).then(function () {
			return BPromise.promisify(combineADASData)(device);
		}).then(function () {
			return BPromise.promisify(getGpsGaadiInfo)(device);
		}).then(function () {
			return BPromise.promisify(checkDriverChange)(device,options);
		}).then(function () {
			for (let i = 0; i < device.data.length; i++) {
				if(options.haltDuration && !device.data[i].drive && (device.data[i].duration < options.haltDuration)){
					device.data.splice(i,1);
					continue;
				}
				device.data[i].status = device.data[i].drive ? 'running' : (device.data[i].idle_duration / device.data[i].duration) > 0.7 ? 'idle' : 'stopped';
			}

			let dist = 0;
			let num_idle = 0;
			let num_stops = 0;
			let dur_stop = 0;
			let dur_total = 0;
			let dur_idle = 0;
			let topSpeed = 0;
			for(let i=0;i<device.data.length;i++){
				if (topSpeed < device.data[i].top_speed && device.data[i].top_speed < limit.speed) {
					topSpeed = device.data[i].top_speed;
				}
				dist += device.data[i].distance;
				if (!device.data[i].drive) {
					if (device.data[i].status === 'idle') {
						num_idle++;
					}
					dur_idle += device.data[i].idle_duration;
					num_stops++;
					dur_stop += device.data[i].duration;
				} else {
					device.data[i].average_speed = ((device.data[i].distance / device.data[i].duration) * 3.6).toFixed(2);
					if(device.data[i].average_speed > 65){
						device.data[i].average_speed = device.data[i].top_speed;
					}
					if(device.data[i-1] && !device.data[i-1].drive){
						device.data[i].pre_halt_dur = device.data[i-1].duration;
					}
				}
				dur_total += device.data[i].duration;
			}
			/*
			for (let key in device.data) {
				if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < limit.speed) {
					topSpeed = device.data[key].top_speed;
				}
				dist += device.data[key].distance;
				if (!device.data[key].drive) {
					if (device.data[key].status === 'idle') {
						num_idle++;
					}
					dur_idle += device.data[key].idle_duration;
					num_stops++;
					dur_stop += device.data[key].duration;
				} else {
					device.data[key].average_speed = ((device.data[key].distance / device.data[key].duration) * 3.6).toFixed(2);
				}
				dur_total += device.data[key].duration;
			}
			*/
			device.top_speed = topSpeed;
			device.num_stops = num_stops;
			device.num_idle = num_idle;
			device.avg_speed_w_stops = ((dist / dur_total) * 3.6).toFixed(2);
			device.avg_speed_wo_stops = ((dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
			device.tot_dist = dist;
			device.dur_total = dur_total;
			device.dur_idle = dur_idle || 0;
			device.dur_stop = dur_stop;
			device.dur_wo_stop = dur_total - dur_stop;
			device.engine_hours = dur_total - dur_stop + device.dur_idle;
		}).then(function () {
			if (options && options.isAddrReqd){
				return BPromise.promisify(fillAddressIfRequired)(device);
			}
		}).then(function () {
			// if (options && options.isAddrReqd){
			if(options.getLandmark){
				device.user_id =  options.login_uid || device.user_id;
			//if((device.user_id == 'castrol_dgfc'  || device.user_id == 'SHELL') && options.getLandmark){
				return BPromise.promisify(fillLandmarkIfRequired)(device);
			}else{
				return;
			}
		}).then(function () {
			done();
		});
	}, function (err) {
		callback(err, devices);
	});
}

function calculateDatewiseDist(device, callback) {
	let datewiseDistance = [];
	let datewiseRunningDur = [];
	let datewiseTopSpeed = [];
	for (let key in device.data) {
		if (!datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)]) {
			datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] = 0;
			datewiseRunningDur[dateutils.getDDMMYYYY(device.data[key].start_time)] = 0;
			datewiseTopSpeed[dateutils.getDDMMYYYY(device.data[key].start_time)] = 0;
		}
		datewiseDistance[dateutils.getDDMMYYYY(device.data[key].start_time)] += device.data[key].distance;
		datewiseRunningDur[dateutils.getDDMMYYYY(device.data[key].start_time)] += device.data[key].drive ? device.data[key].duration : 0;
		datewiseTopSpeed[dateutils.getDDMMYYYY(device.data[key].start_time)] = datewiseTopSpeed[dateutils.getDDMMYYYY(device.data[key].start_time)] > device.data[key].top_speed ? datewiseTopSpeed[dateutils.getDDMMYYYY(device.data[key].start_time)] : device.data[key].top_speed;
	}
	device.datewise_dist = [];
	for (let key in datewiseDistance) {
		device.datewise_dist.push({
			date: key,
			dist: datewiseDistance[key],
			dur: datewiseRunningDur[key],
			top_speed: datewiseTopSpeed[key]
		});
	}
	callback(null, true);
}

function removeUnrealisticSpeeds(adas, callback) {
	for (let i = 0; i < adas.length; i++) {
		if (adas[i].distance / adas[i].duration * 3.6 > 120) {
			adas.splice(i, 1);
			i--;
		}
	}
	callback();
}

function predictOfflineDistance(adas, callback) {
	// callback(null, true);
	for (let i = 1; i < adas.length; i++) {
	//	if (new Date(adas[i].start_time).getDate() !== new Date(adas[i - 1].start_time).getDate()) continue;
		let dur = dateutils.getSecs(adas[i].start_time) - dateutils.getSecs(adas[i - 1].end_time);
		if (dur > 60) {
			let prediction = {};
			prediction.pr = true;
			prediction.start_time = adas[i - 1].end_time;
			prediction.end_time = adas[i].start_time;
			prediction.imei = adas[i].imei;
			prediction.start = adas[i - 1].stop;
			prediction.stop = adas[i].start;
			if (!prediction.start || !prediction.stop) continue;
			prediction.distance = geozoneCalculator.getDistance(prediction.start, prediction.stop);
			prediction.duration = dur;
			prediction.idle_duration = 0;
			prediction.idle = false;
			if(prediction.distance >100 && prediction.distance/dur*3.6 >20){
                prediction.drive = true;
				/*
				if(dur>1800){//30 min or more
					 //45 km per hour== mean 750 meter per min
                 let avgSpeed = 750;// meter/min
				 let expected_endtime = prediction.distance/avgSpeed;//in minutes
				 let exEndTime = dateutils.add(prediction.start_time,expected_endtime,'minutes');
				 if(exEndTime.getTime() > prediction.end_time.getTime()){
					 console.error('wrong prediction');
				 }else{
					prediction.end_time = exEndTime;
					prediction.duration =  expected_endtime * 60;//converted to sec
				 }
				}*/
			}else{
                prediction.drive = false;
                //prediction.distance = 0;
			}
            prediction.top_speed = prediction.drive ? parseInt(prediction.distance/prediction.duration):0;
			if(prediction.top_speed > limit.speed){
                prediction.top_speed = 45;
			}
			prediction.status = prediction.drive ? 'running' : 'stopped';
			adas.splice(i, 0, prediction);
			i++;
		}
	}
	callback(null, true);
}

function fillAddressIfRequired(adas, callback) {
	async.eachSeries(adas.data, function (datum, done) {
		BPromise.resolve()
			.then(function () {
				if (datum.start_addr) return BPromise.resolve(datum.start_addr);
				if(!datum.start || !datum.start.latitude) return BPromise.resolve(" ");
				return addressService.getAddressAsync(datum.start.latitude, datum.start.longitude);
			})
			.then(function (addr) {
				datum.start_addr = addr;
			})
			.then(function () {
				if (datum.stop_addr || !datum.stop) return BPromise.resolve(datum.stop_addr);
				return addressService.getAddressAsync(datum.stop.latitude, datum.stop.longitude);
			})
			.then(function (addr) {
				datum.stop_addr = addr;
				done();
			}).error(err => {
				if(err && err.meassage){
                   console.error(err.message);
				}
			   done();
		});
	}, function (err) {
		callback(null, true);
	});
};

function getGpsGaadiInfo(oDevice, callback) {
	
		BPromise.resolve()
			.then(function () {
				if(oDevice.driver || oDevice.driver_name || oDevice.driver_name2){
					return  callback(null, true);
				}
				let oReq = {
					request : 'gpsgaadi_by_imei_user',
					imei:oDevice.imei,
					user_id:oDevice.user_id
				};
				return GpsGaadi.getGpsGaadiAsync(oReq);
			})
			.then(function (oGpsGaadi) {
				oDevice.driver = oGpsGaadi.driver;
				oDevice.driver_name = oGpsGaadi.driver_name;
				oDevice.driver_name2 = oGpsGaadi.driver_name2;
				callback(null, oGpsGaadi);
			})
			.error(err => {
				if(err && err.meassage){
                   console.error(err.message);
				}
			    callback(null, true);
		});
};

function fillLandmarkIfRequired(adas, callback) {
	async.eachSeries(adas.data, function (datum, done) {
		Promise.resolve()
			.then(function () {
				if (datum.landmark) return BPromise.resolve(datum);
				if(!datum.drive){
					let oQuery = {location:datum.start,user_id:adas.user_id,no_of_docs:1,projection:{name:1,location:1},radius:5};
					return addressService.getLandmarkFromGeographyAsync(oQuery);
				}else{
					return {};
				}
			})
			.then(function (lm) {
				if(lm && lm.name){
					let distLand = geozoneCalculator.getDistance(datum.start,lm.location);
					datum.ldist = distLand || 0; //in Mtr
					datum.landmark = lm && lm.name;
					datum.lmark = lm && lm.location;
				}
				done();
			})
			.catch(err => {
				done();
			});
	}, function (err) {
		callback(null, true);
	});
};

exports.getMileageReport = function (device_id, start_time, end_time, client, callback) {
	let response = {
		device_id: device_id,
		status: 'ERROR',
		message: ""
	};
	//BPromise.promisify(exports.getActivityReport)(device_id, start_time, end_time, null, false)
	BPromise.promisify(exports.getActivityReportV2)(device_id, start_time, end_time, false, false)
		.then(function (activity) {
			response.status = 'OK';
			response.message = 'mileage report';
			let fRes = processMileageReport(activity, device_id);
			response.data = fRes;
			if (client === 'android' && fRes.Summary) {
				let aRes = [];
				for (let dev in fRes.Summary) {
					fRes.Summary[dev].device_id = dev;
					aRes.push(fRes.Summary[dev]);
				}
				response.data = aRes;
			}
			callback(null, response);
		})
		.error(function (err) {
			response.message = err.toString();
			callback(null, response);
		});
};

exports.getMileageReport2 = function (device_id, start_time, end_time, client, callback) {
	exports.getMileageReport(device_id, start_time, end_time, client, function (err, res) {
		let vehs;
		if (res.status === 'ERROR') return callback(err, res);
		res.headers = dateutils.getDateArray(start_time, end_time);
		if (res.data.Summary) res.headers.splice(0, 0, 'Summary');
		for (let date in res.data) {
			if (!vehs) {
				vehs = {};
				for (let veh in res.data[date]) {
					vehs[veh] = {};
				}
			}
			if (date === 'Summary') {
				vehs[date] = res.data[date];
				continue;
			}
			for (let veh in res.data[date]) {
				vehs[veh][date] = res.data[date][veh];
			}
		}
		if (client === 'download') {
			res.data = vehs;
		} else {
			let aVehicles = [];
			for (let imei in vehs) {
				if (imei !== 'Summary') {
					let oVeh = {};
					oVeh.imei = imei;
					if (vehs.Summary && vehs.Summary[imei]) {
						oVeh.total_dist = vehs.Summary[imei].distance;
						oVeh.total_dur = vehs.Summary[imei].duration;
						oVeh.top_speed = vehs.Summary[imei].top_speed;
						oVeh.average_speed = vehs.Summary[imei].average_speed;
					}
					for (let date in vehs[imei]) {
						oVeh[date] = vehs[imei][date].distance;
					}
					aVehicles.push(oVeh);
				}
			}
			res.data = aVehicles;
		}
		callback(err, res);
	});
};

function processMileageReport(activity, device_id) {
	let days = {};
	let s = 'Summary';
	days[s] = {};

	let shouldShowSummary = false;

	for (let device in activity.data) {
		if (activity.data[device].datewise_dist.length > 0) {
			shouldShowSummary = true;
		}else{
			console.log(device,activity.data[device].datewise_dist);
		}
		for (let i = 0; i < activity.data[device].datewise_dist.length; i++) {
			const dwd = activity.data[device].datewise_dist[i];
			if (!days[dwd.date]) days[dwd.date] = {};
			if (device_id instanceof Array) {
				for (let j = 0; j < device_id.length; j++) {
					if (!days[dwd.date][device_id[j]]) days[dwd.date][device_id[j]] = {
						distance: 0,
						duration: 0,
						top_speed: 0
					};
					if (!days[s][device_id[j]]) days[s][device_id[j]] = {
						distance: 0,
						duration: 0,
						top_speed: 0
					};
				}
			} else {
				if (!days[dwd.date][device_id]) days[dwd.date][device_id] = {
					distance: 0,
					duration: 0,
					top_speed: 0
				};
				if (!days[s][device_id]) days[s][device_id] = {
					distance: 0,
					duration: 0,
					top_speed: 0
				};
			}
			days[dwd.date][device] = {
				distance: dwd.dist,
				duration: dwd.dur,
				top_speed: dwd.top_speed
			};
            if(days[s] && days[s][device]){
                days[s][device].distance += days[dwd.date][device].distance;
                days[s][device].duration += days[dwd.date][device].duration;
			}
			if(days[s] &&days[s][device] && days[dwd.date] && days[dwd.date][device] && (days[dwd.date][device].top_speed > days[s][device].top_speed) && days[dwd.date][device].top_speed < limit.speed){
                days[s][device].top_speed = days[dwd.date][device].top_speed;
			}
		}
	}
	// if(!shouldShowSummary) delete days[s];
	return days;
}

exports.getPlaybackV3 = function (device_id, start_time, end_time, callback) {
    let activity;
    let gpsData;
    let asyncTasks = [];
    asyncTasks.push(function (cb) {
        BPromise.promisify(exports.getActivityReportV2)(device_id, start_time, end_time, null, true)
            .then(function (res) {
                activity = res;
                cb();
            });
    });
    asyncTasks.push(function (cb) {
        Gps.getGPSDataBetweenTimeAsync(device_id, start_time, end_time)
            .then(function (res) {
                // calculateSpeedFromRaw(res);
                gpsData = res;
                cb();
            })
            .error(function () {
                cb();
            });
    });
    async.parallel(asyncTasks, function () {
        if (activity.status === 'ERROR') return callback(null, activity);
        const rdev = activity.data[device_id];
        for (const key in rdev) {
            activity[key] = rdev[key];
        }
        activity.message = 'playback data';

        if (gpsData && gpsData[0]) gpsData[0].cum_dist = 0;
        for (let i = 0; i < gpsData.length; i++) {
            for (let j = 0; j < activity.data.length; j++) {
                if (gpsData[i].datetime >= activity.data[j].start_time && gpsData[i].datetime <= activity.data[j].end_time) {
                    if (!activity.data[j].points) activity.data[j].points = [];
                    activity.data[j].points.push(gpsData[i]);
                    break;
                }
            }
        }
        let last_cum = 0;
        let copyNpoint = 2;
        for (let i = 0; i<activity.data.length; i++) {
            if (!activity.data[i].drive || !activity.data[i].points) {
            	if(activity.data[i].points && activity.data[i].points.length>(2*copyNpoint+1)){
            		let aPoint = [];
            		for(let x=0;x<activity.data[i].points.length;x++){
            			if(x<copyNpoint){
                            aPoint.push(activity.data[i].points[x]);
						}
						if(x==copyNpoint){
            				x = activity.data[i].points.length - copyNpoint;
						}
						if(x>copyNpoint){
                            aPoint.push(activity.data[i].points[x]);
						}
					}
                    activity.data[i].points = aPoint;
				}
                continue;
            }
            let countExtra,lastCumDistJ;
            for(let j=1;j<activity.data[i].points.length;j++){
            	if(!activity.data[i].points[j-1].cum_dist){
                    activity.data[i].points[j-1].cum_dist = last_cum;
				}
				p2pDist = geozoneCalculator.getDistance({latitude: activity.data[i].points[j-1].lat,longitude: activity.data[i].points[j-1].lng},
				{latitude: activity.data[i].points[j].lat, longitude: activity.data[i].points[j].lng});
            	dur = (new Date(activity.data[i].points[j].datetime).getTime() - new Date(activity.data[i].points[j-1].datetime).getTime() )/1000;

				let speed = 0;
				if (p2pDist > 0 && dur > 0) speed = p2pDist / dur * 3.6;

                if(p2pDist < 100){
                    activity.data[i].points.splice(j,1);
                    j--;
                }else{
                    activity.data[i].points[j].cum_dist = activity.data[i].points[j-1].cum_dist + p2pDist;
                    last_cum = activity.data[i].points[j].cum_dist;
                }
            	if(p2pDist>2000 && speed > 100){
            		if(countExtra && (j-countExtra)==1){//2 consecutive point has anomoly then remove mid one
                        activity.data[i].points.splice(j-1,1);
                        j--;
                        activity.data[i].points[j].cum_dist = activity.data[i].points[j].cum_dist - p2pDist - lastCumDistJ;
                        last_cum = activity.data[i].points[j].cum_dist;
					}else{
                        countExtra = j;
                        lastCumDistJ = p2pDist;
					}
				}
                delete activity.data[i].points[j].device_id;
			}
        }
        for (let i = activity.data.length - 1; i >= 0; i--) {
            if (!activity.data[i].drive || !activity.data[i].points) {
                continue;
            }
            activity.data[i].points[activity.data[i].points.length - 1].cum_dist = activity.tot_dist;
            break;
        }
     callback(null, activity);
    });
};
exports.getPlaybackV2 = function (device_id, start_time, end_time, callback) {
	let activity;
	let gpsData;
	let asyncTasks = [];
	asyncTasks.push(function (cb) {
		BPromise.promisify(exports.getActivityReport)(device_id, start_time, end_time, null, true)
			.then(function (res) {
				activity = res;
				cb();
			});
	});
	asyncTasks.push(function (cb) {
		Gps.getGPSDataBetweenTimeAsync(device_id, start_time, end_time)
			.then(function (res) {
				gpsData = res;
				cb();
			})
			.error(function () {
				cb();
			});
	});
	async.parallel(asyncTasks, function () {
		if (activity.status === 'ERROR') return callback(null, activity);
		const rdev = activity.data[device_id];
		// winston.info(JSON.stringify(rdev));
		for (const key in rdev) {
			activity[key] = rdev[key];
		}
		activity.message = 'playback data';
		// winston.info('length of gps data', gpsData.length);
		let inserted = 0;
		let notDrive = 0;
		if (gpsData && gpsData[0]) gpsData[0].cum_dist = 0;

		for (let i = 0; i < gpsData.length; i++) {
			if (i > 0) {
				let newDist = gpsData[i - 1].cum_dist + geozoneCalculator.getDistance({
					latitude: gpsData[i - 1].lat,
					longitude: gpsData[i - 1].lng
				}, {latitude: gpsData[i].lat, longitude: gpsData[i].lng});
				let dist = newDist - gpsData[i - 1].cum_dist;
				let dur = gpsData[i].datetime - gpsData[i - 1].datetime;
				dur = dur / 1000;
				if (dist / dur * 3.6 > limit.speed || gpsData[i].speed < 1.5) {
					gpsData.splice(i, 1);
					i--;
				}else{
                    gpsData[i].cum_dist = newDist;
				}
			}
		}

		for (let i = 0; i < gpsData.length; i++) {
			if (i > 0) {
				gpsData[i].cum_dist *= activity.tot_dist / gpsData[gpsData.length - 1].cum_dist;
			}
			// if(i == gpsData.length-1) activity.tot_dist = gpsData[i].cum_dist;
			for (let j = 0; j < activity.data.length; j++) {
				if (gpsData[i].datetime >= activity.data[j].start_time && gpsData[i].datetime <= activity.data[j].end_time) {
					if (!activity.data[j].drive) {
						// notDrive++;
						activity.data[j].start.cum_dist = gpsData[i].cum_dist;
						break;
					}
					if (!activity.data[j].points) activity.data[j].points = [];
					activity.data[j].points.push(gpsData[i]);
					// inserted++;
					break;
				}
			}
		}

		for (let i = activity.data.length - 1; i >= 0; i--) {
			if (!activity.data[i].drive || !activity.data[i].points) {
				continue;
			}
			activity.data[i].points[activity.data[i].points.length - 1].cum_dist = activity.tot_dist;
			break;
		}

		// winston.info('inserted', inserted);
		// winston.info('notDrive', notDrive);
		callback(null, activity);
	});
};

exports.getPlayback = function (device_id, start_time, end_time, callback) {
	let playback = null;
	let parking = null;
	exports.getParkingReport(device_id, start_time, end_time, 20, null, function (err, res) {
		parking = res;
		if (parking && playback) processPlayback(parking, playback, callback);
	});
	Device.getPlayback(device_id, start_time, end_time, function (err, res) {
		let response = {
			device_id: device_id,
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res || res.length === 0) {
			response.message = 'not found';
		} else {
			response.data = res;
		}
		playback = response;
		if (parking && playback) processPlayback(parking, playback, callback);
	});
};

function processPlayback(parking, playback, callback) {
	if (parking.status === 'OK') {
		playback.data = playback.data ? playback.data.concat(parking.data[Object.keys(parking.data)[0]].data) : parking.data[Object.keys(parking.data)[0]].data;
	}
	playback.data.sort(function (a, b) {
		let keyA = new Date(a.start_time),
			keyB = new Date(b.start_time);
		// Compare the 2 dates
		if (keyA < keyB) return -1;
		if (keyA > keyB) return 1;
		return 0;
	});
	if (playback.data && playback.data.length > 0) {
		playback.status = 'OK';
		playback.message = 'playback';
	}
	callback(null, playback);
}

exports.getOverspeedReport = function (device_id, start_time, end_time, speed_limit, client, callback) {
    //console.log('before get overspped', new Date());
	Device.getOverspeedReport(device_id, start_time, end_time, function (err, res) {
		let response = {
			device_id: device_id,
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res || res.length === 0) {
			response.message = 'not found';
		} else {
			response.status = 'OK';
			let oSResp = processOverspeedReport(res, speed_limit);
			response.data = oSResp;
			response.message = 'overspeed report';
			if (client === 'android') {
				let aRes = [];
				for (let dev in oSResp) {
					oSResp[dev].device_id = dev;
					oSResp[dev].data = null;
					aRes.push(oSResp[dev]);
				}
				response.data = aRes;
			}
		}
		callback(response);
	});
};

function processOverspeedReport(data, speed_limit) {
	let devices = {};

	for (let i = 0; i < data.length; i++) {
		if (!devices[data[i].imei]) {
			devices[data[i].imei] = {
				data: []
			};
		}
		if (data[i].top_speed >= speed_limit && data[i].top_speed<=limit.speed) {
			devices[data[i].imei].data.push(data[i]);
		}
	}

	for (let key in devices) {
		let device = devices[key];
		let dist = 0;
		for (let i; i < device.data.length; i++) {
			dist += device.data[key].distance;
		}
		device.dist_with_overspeed = dist;
		device.num_of_overspeed = device.data.length;
	}
	return devices;
}
exports.getActivityReportV2 = function (device_id, start_time, end_time, client, isAddrReqd, callback) {
    let das = null;
    let overspeed = null;
    getAggregatedDASV2(device_id, start_time, end_time, isAddrReqd, function (err, res) {
        //console.log('after getAggregatedDASV2 ',new Date());
        let response = {
            device_id: device_id,
            status: 'ERROR',
            message: "",
            start_time: start_time,
            end_time: end_time
        };
        if (err) {
            winston.error('deviceService.getActivityReportV2', err);
            response.message = err;
        } else if (!res || res.length === 0) {
            response.message = 'not found';
        } else {
            response.status = 'OK';
            response.data = res;
            response.message = 'drives and stops report';
        }
        das = response;
        // winston.info(JSON.stringify(das));
        if (das && overspeed) return processActivityReport(das, overspeed, client, callback);
    });
    exports.getOverspeedReport(device_id, start_time, end_time, 0, "web", function (res) {
        //console.log('after getOverspeedReport',new Date());
        overspeed = res;
        if (das && overspeed) return processActivityReport(das, overspeed, client, callback);
    });
};
exports.getVehicleSummary = function (request, callback) {
    getAggregatedDASV2(request.device_id, request.start_time, request.end_time, false, function (err, res) {
        //console.log('after getAggregatedDASV2 ',new Date());
        let response = {
            device_id: request.device_id,
            status: 'ERROR',
            message: "",
            start_time: request.start_time,
            end_time: request.end_time
        };
        if (err) {
            winston.error('deviceService.getActivityReportV2', err);
            response.message = err;
        } else if (!res || res.length === 0) {
            response.message = 'not found';
        } else {
            response.status = 'OK';
            response.data = res;
            response.message = 'drives and stops report';
        }
		callback(null, response);
     });
};

exports.getIdleSummary = function (request, callback) {
    getAggregatedDASV3(request.device_id, request.start_time, request.end_time, false, function (err, res) {
        //console.log('after getAggregatedDASV2 ',new Date());
        let response = {
            device_id: request.device_id,
            status: 'ERROR',
            message: "",
            start_time: request.start_time,
            end_time: request.end_time
        };
        if (err) {
            winston.error('deviceService.getActivityReportV2', err);
            response.message = err;
        } else if (!res || res.length === 0) {
            response.message = 'not found';
        } else {
            response.status = 'OK';
            response.data = res;
            response.message = 'drives and stops report';
        }
		callback(null, response);
     });
};


exports.getActivityReport = function (device_id, start_time, end_time, client, isAddrReqd, callback) {
	let das = null;
	let overspeed = null;
	getAggregatedDAS(device_id, start_time, end_time, isAddrReqd, function (err, res) {
		// winston.info(JSON.stringify(res));
		let response = {
			device_id: device_id,
			status: 'ERROR',
			message: "",
			start_time: start_time,
			end_time: end_time
		};
		if (err) {
			winston.error('deviceService.getActivityReport', err);
			response.message = err;
		} else if (!res || res.length === 0) {
			response.message = 'not found';
		} else {
			response.status = 'OK';
			response.data = res;
			response.message = 'drives and stops report';
		}
		das = response;
		// winston.info(JSON.stringify(das));
		if (das && overspeed) return processActivityReport(das, overspeed, client, callback);
	});
	exports.getOverspeedReport(device_id, start_time, end_time, 0, "web", function (res) {
		overspeed = res;
		if (das && overspeed) return processActivityReport(das, overspeed, client, callback);
	});
};

// time_interval should be in mins
exports.getActivityIntervalReport = function (device_id, start_time, end_time, time_interval, client, callback) {
	if (!(start_time instanceof Array)) return getActivityIntervalReportInternal(device_id, start_time, end_time, time_interval, client, callback);
	let res = {};
	res.status = 'OK';
	res.device_id = device_id;
	res.start_time = start_time;
	res.end_time = end_time;
	res.time_interval = time_interval;
	res.data = {};
	res.data[device_id] = {};
	let dev = res.data[device_id];
	dev.data = [];
	dev.top_speed = 0;
	dev.num_stops = 0;
	dev.tot_dist = 0;
	dev.dur_total = 0;
	dev.dur_stop = 0;
	dev.dur_wo_stop = 0;

	async.eachSeries(start_time, function (st, cb) {
		BPromise.promisify(getActivityIntervalReportInternal)(device_id, st, end_time[start_time.indexOf(st)], time_interval, client)
			.then(function (r) {
				if (r.status === 'OK') {
					let rdev = r.data[device_id];
					dev.data = dev.data.concat(rdev.data);
					if(rdev.top_speed > dev.top_speed && rdev.top_speed < limit.speed){
                        dev.top_speed = rdev.top_speed;
					}
					dev.num_stops += rdev.num_stops;
					dev.tot_dist += rdev.tot_dist;
					dev.dur_total += rdev.dur_total;
					dev.dur_stop += rdev.dur_stop;
					dev.dur_wo_stop += rdev.dur_wo_stop;
				}
				cb();
			});
	}, function (err) {
		dev.avg_speed_w_stops = ((dev.tot_dist / dev.dur_total) * 3.6).toFixed(2);
		dev.avg_speed_wo_stops = ((dev.tot_dist / (dev.dur_total - dev.dur_stop)) * 3.6).toFixed(2);
		callback(null, res);
	});
};

function getActivityIntervalReportInternal(device_id, start_time, end_time, time_interval, client, callback) {
	time_interval = time_interval ? time_interval : 30;
	let res;
	BPromise.promisify(exports.getPlaybackV3)(device_id, start_time, end_time).then((r) => {
		res = r;
		// winston.info(JSON.stringify(res));
		res.request = requests.report_activity_interval;
		res.message = 'detailed activity report';
		if (res.status === 'ERROR') {
			return callback(null, res);
		}
		start_time = new Date(start_time).getTime();
		end_time = new Date(end_time).getTime();
		time_interval *= 60 * 1000;
		const data = [];

		while ((start_time + time_interval) < end_time) {
			data.push({
				start_time: new Date(start_time),
				end_time: new Date(start_time + time_interval),
				points: [],
				distance: 0,
				drive: false,
				top_speed: 0,
				imei: device_id
			});
			start_time += time_interval;
		}

		data.push({
			start_time: new Date(start_time),
			end_time: new Date(end_time),
			points: [],
			distance: 0,
			drive: false,
			top_speed: 0,
			imei: device_id
		});

		for (let i = 0; i < res.data.length; i++) {
			if (res.data[i].points) {
				// winston.info(res.data[i].points.length);
				for (let j = 0; j < res.data[i].points.length; j++) {
					let point = res.data[i].points[j];
					for (let k = 0; k < data.length; k++) {
						if (new Date(data[k].start_time).getTime() <= new Date(point.datetime).getTime() && new Date(data[k].end_time).getTime() > new Date(point.datetime).getTime()) {
							data[k].points.push(point);
							break;
						}
					}
				}
			}
		}

		for (let i = 1; i < data.length; i++) {
			if (data[i - 1].points.length > 0 && data[i].points.length > 0 &&
				(new Date(data[i].points[0].datetime).getTime() - new Date(data[i - 1].points[data[i - 1].points.length - 1].datetime).getTime()) <= 5 * 60 * 1000) {
				data[i - 1].points.push(data[i].points[0]);
			}
		}

		let top_speed = 0;
		let num_stops = 0;
		let avg_speed_w_stops, avg_speed_wo_stops;
		let tot_dist = 0;
		let dur_total = 0;
		let dur_stop = 0;
		let dur_wo_stop = 0;

		for (let i = 0; i < data.length; i++) {
			data[i].duration = (new Date(data[i].end_time).getTime() - new Date(data[i].start_time).getTime()) / 1000;
			if (data[i].points.length === 0) {
				// Either within a long stop or the device was disconnected
				for (let j = 0; j < res.data.length; j++) {
					let datum = res.data[j];
					if (new Date(datum.start_time).getTime() - 5 * 60 * 1000 <= new Date(data[i].start_time).getTime() && new Date(datum.end_time).getTime() + 5 * 60 * 1000 >= new Date(data[i].end_time).getTime()) {
						data[i].start = datum.start;
						data[i].stop = datum.stop;
					}
				}
			} else {
				data[i].start = {latitude: data[i].points[0].lat, longitude: data[i].points[0].lng};
				data[i].stop = {
					latitude: data[i].points[data[i].points.length - 1].lat,
					longitude: data[i].points[data[i].points.length - 1].lng
				};

				for(let t=0;t<data[i].points.length;t++){
                    data[i].top_speed = data[i].points[0].speed;
					if(data[i].top_speed < data[i].points[t].speed){
                        data[i].top_speed = data[i].points[t].speed;
					}
					if(data[i].points[t].speed>64){

					}
				}

				//data[i].top_speed = data[i].points[0].speed;
				for (let j = 1; j < data[i].points.length; j++) {
					data[i].distance += geozoneCalculator.getDistance({
						latitude: data[i].points[j - 1].lat,
						longitude: data[i].points[j - 1].lng
					}, {
						latitude: data[i].points[j].lat,
						longitude: data[i].points[j].lng
					});
					if (data[i].top_speed < data[i].points[j].speed && data[i].points[j].speed < limit.speed) data[i].top_speed = data[i].points[j].speed;
				}

				if (data[i].distance / data[i].duration * 3.6 > 1) {
					data[i].drive = true;
				} else {
					// winston.info(data[i].distance, data[i].distance/data[i].duration*3.6);
					data[i].distance = 0;
				}

			}
			data[i].average_speed = parseInt(data[i].distance / data[i].duration * 3.6);
			if(data[i].average_speed > 65){
				data[i].average_speed = data[i].top_speed;
			}
			if (!data[i].start) {
				data.splice(i--, 1);
				continue;
			}

			if(data[i].top_speed > top_speed && data[i].top_speed < limit.speed){
                top_speed = data[i].top_speed
			}
			num_stops = data[i].drive ? num_stops : ++num_stops;
			tot_dist += data[i].distance;
			dur_total += data[i].duration;
			dur_stop = data[i].drive ? dur_stop : dur_stop + data[i].duration;
			dur_wo_stop = dur_total - dur_stop;
			avg_speed_w_stops = ((tot_dist / dur_total) * 3.6).toFixed(2);
			avg_speed_wo_stops = ((tot_dist / (dur_total - dur_stop)) * 3.6).toFixed(2);
		}

		// clubbing adjacent stops
		for (let i = 1; i < data.length; i++) {
			if (!data[i - 1].drive && !data[i].drive) {
				data[i - 1].duration = dateutils.getDuration(data[i - 1].start_time, data[i - 1].end_time);
				data[i - 1].end_time = data[i].end_time;
				data.splice(i, 1);
				i--;
			}
		}

		res.data = {};
		res.data[device_id] = {};
		res.data[device_id].data = data;

		// res.data[device_id].top_speed = top_speed;
		// res.data[device_id].num_stops = num_stops;
		// res.data[device_id].tot_dist = tot_dist;
		// res.data[device_id].dur_total = dur_total;
		// res.data[device_id].dur_stop = dur_stop;
		// res.data[device_id].dur_wo_stop = dur_wo_stop;
		// res.data[device_id].avg_speed_w_stops = avg_speed_w_stops;
		// res.data[device_id].avg_speed_wo_stops = avg_speed_wo_stops;

		res.data[device_id].top_speed = res.top_speed;
		res.data[device_id].num_stops = res.num_stops;
		res.data[device_id].tot_dist = res.tot_dist;
		res.data[device_id].dur_total = res.dur_total;
		res.data[device_id].dur_stop = res.dur_stop;
		res.data[device_id].dur_wo_stop = res.dur_wo_stop;
		res.data[device_id].avg_speed_w_stops = res.avg_speed_w_stops;
		res.data[device_id].avg_speed_wo_stops = res.avg_speed_wo_stops;

	}).then(() => {
		if(res.data && res.data[device_id] && res.data[device_id].data){
            addressService.fillAddressForStartAsync(res.data[device_id].data)
        }
	}).then(() => {
        if(res.data && res.data[device_id] && res.data[device_id].data){
		  addressService.fillAddressForStopAsync(res.data[device_id].data)
        }
	}).then(() => {
        return callback(null, res);
	}).error((err) => {
        return callback(null, res);
	});
}

function processActivityReport(das, overspeed, client, callback) {
	const response = {
		device_id: das.device_id,
		status: 'ERROR',
		message: das.message,
		start_time: das.start_time,
		end_time: das.end_time
	};

	if (das.status === 'OK') {
		// winston.info(JSON.stringify(das));
		// winston.info(JSON.stringify(overspeed.data));
		response.status = 'OK';
		if (overspeed.status === 'OK') {
			let dist = 0;
			for (let key in overspeed.data) {
				if (!das.data[key]) continue;
				das.data[key].dist_with_overspeed = overspeed.data[key].dist_with_overspeed;
				das.data[key].num_of_overspeed = overspeed.data[key].num_of_overspeed;
			}
		}
		response.data = das.data;
		if (client === 'android') {
			let aRes = [];
			for (let dev in das.data) {
				das.data[dev].device_id = dev;
				das.data[dev].data = null;
				aRes.push(das.data[dev]);
			}
			response.data = aRes;
		}
	}
	callback(null, response);
}

exports.getDeviceTypes = function (request, callback) {
	let device_types = [{
		type: 'tr02',
		desc: 'TR02'
	}, {
		type: 'tr06',
		desc: 'TR06'
	}, {
		type: 'tr06n',
		desc: 'GT06N'
	}, {
		type: 'tr06f',
		desc: 'GT06F'
	}, {
		type: 'crx',
		desc: 'CRX/Wetrack2'
	}, {
		type: 'tk103',
		desc: 'TK103'
	}, {
		type: 'meitrack',
		desc: 'Meitrack-T1'
	},
		{
			type: 'avl500',
			desc: 'AVL-500'
		},
		{
			type: 'vt2',
			desc: 'ZENDA-VT2'
		},
		{
			type: 'tk103',
			desc: 'KESON TK103'
		},
        {
            type: 'rp01',
            desc: 'RP01'
        },
		{
			type: 'mt90',
			desc: 'Meitrack-MT90'
		},
        {
            type: 'gt300',
            desc: 'GT300'
        },
		{
            type: 'ks199',
            desc: 'UPS199'
        }];
	let response = {
		status: 'OK',
		data: device_types,
		message: "list of supported devices"
	};
	callback(response);
};

exports.getDeviceInfo = function (request, callback) {
	let response = {
		status: 'OK',
		data: devices,
		message: "info of supported devices"
	};
	callback(response);
};

exports.getCommandsInfo = function (request, callback) {
	let response = {
		status: 'OK',
		data: {
			"commands": commands,
			"alerts": alerts
		},
		message: "info of supported commands and alerts"
	};
	callback(response);
};

exports.getSMSForActivation = function (request, callback) {
	let oReq = {
		request: "device_by_imei",
		imei: request.imei
	};
	Device.getDevice(oReq, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'device not found in DB';
		} else {
			response.status = 'OK';
			response.message = 'send sms to activate ' + res.device_type + ' device.';
			let oData = {};
			oData.sms = getSMS(res.device_type);
			oData.device_type = res.device_type;
			oData.sim_no = res.sim_no;
			oData.sim_provider = 'airtel';
			response.data = oData;
		}
		return callback(response);
	});
};

exports.getDeviceStatus = function (request, callback) {
	Device.getDeviceStatus(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
            response.data = [];
		} else if (!res) {
			response.message = 'device not found';
            response.data = [];
		} else {
			response.status = 'OK';
			response.message = 'device found.';
			response.data = res;
		}
		return callback(null, response);
	});
};

function getDeviceStatusAsync(request) {
	return new Promise((resolve, reject) => {
		exports.getDeviceStatus(request,(err, data) => {
				if (err) return reject(err);
				resolve(data);
			});

	});
};

function checkDevice(request, callback) {
	Device.getDevice(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'device not found';
		} else {
			response.status = 'OK';
			response.message = 'device found.';
			response.data = res;
		}
		return callback(response);
	});
}

function getSMS(device_type) {
	let sSMS;
	switch (device_type) {
		case 'tr06':
			sSMS = 'SERVER,1,truckadda.in,3000,0,#';
			break;
		case 'crx':
			sSMS = 'SERVER,1,truckadda.in,3001,0,#';
			break;
		case 'tr02':
			sSMS = 'SERVER,1,666666,truckadda.in,3002,0,#';
			break;
		case 'meitrack':
			sSMS = 'SERVER,0000,1,truckadda.in,3003,0#';
			break;
		case 'mt90':
			sSMS = 'SERVER,0000,1,truckadda.in,3011,0#';
			break;
		default:
			sSMS = 'deivce type is not supported yet';
			break;
	}
	return sSMS;
}

exports.getDeviceList = function (request, callback) {
	Device.getDeviceList(request, function (err, res) {
		let response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Device not found';
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi found.';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
};

exports.dailyUptime = function (request, callback) {
	let response = {
		status: 'ERROR',
		message: ""
	};
	Device.dailyUptimeAsync(request)
		.then(function (data) {
			response.status = 'OK';
			winston.info('gd', JSON.stringify(data));
			response.data = processDailyUptime(data);
		})
		.error(function (err) {
			winston.info('rh');
			response.message = err;
		})
		.then(function () {
			callback(null, response);
		});
};

function processDailyUptime(devices, data) {
	const res = [];
	for (let i = 0; i < devices.length; i++) {
		res.push({
			imei: devices[i].imei,
			reg_no: devices[i].reg_no,
			up_time: 0
		});
		for (let j = 0; j < data.length; j++) {
			if (Number(res[i].imei) === Number(data[j].imei)) {
				res[i].up_time = data[j].dur_drive + data[j].dur_stop;
				break;
			}
		}
	}
	return res;
}

exports.dailyUptime = function (request, callback) {
	let response = {
		status: 'ERROR',
		message: ""
	};
	let devices;
	let data;
	const asyncTasks = [];
	asyncTasks.push(function (done) {
		Device.getAllDevicesAsync()
			.then(function (res) {
				devices = res;
			})
			.error(function () {
			})
			.then(function () {
				done();
			});
	});
	asyncTasks.push(function (done) {
		Device.dailyUptimeAsync(request)
			.then(function (res) {
				response.status = 'OK';
				data = res;
			})
			.error(function (err) {
				response.message = err;
			})
			.then(function () {
				done();
			});

	});

	async.parallel(asyncTasks, function () {
		if (response.status === 'OK') {
			response.data = processDailyUptime(devices, data);
		}
		callback(null, response);
	});
};

exports.lastOnline = function (request, callback) {
	let response = {
		status: 'ERROR',
		message: ""
	};
	Device.getAllDevicesAsync()
		.then(function (devices) {
			response.status = 'OK';
			response.data = processOnline(devices);
		})
		.error(function () {
		})
		.then(function () {
			callback(null, response);
		});
};

function processOnline(devices) {
	const res = [];
	for (let i = 0; i < devices.length; i++) {
		res.push({
			imei: devices[i].imei,
			reg_no: devices[i].reg_no,
			positioning_time: devices[i].positioning_time,
			sim_no: devices[i].sim_no,
			user_id: devices[i].user_id,
			gsm_signal_str: devices[i].gsm_signal_str,
			address: devices[i].address,
			device_type: devices[i].device_type

		});
		if (res[i].positioning_time) {
			res[i].last_online = dateutils.getSecs(Date.now()) - dateutils.getSecs(res[i].positioning_time);
		}
	}
	return res;
}

exports.getNearestVehicleForPoint = function (request, callback) {
    Device.getDevicesWithinPointRadius(request, function (err, res) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
        } else if (!res) {
            response.message = 'No nearest vehicle found';
        } else {
            response.status = 'OK';
            response.message = 'Nearest vehicle found.';
            response.data = res;
        }
        return callback(response);
    });
};

function processRawDataAsync(device_id,res) {
    return new Promise((resolve, reject) => {
        if (device_id instanceof Array) {
            let aADAS = [];
            let oDevices = sortbyDeviceId(res);
            async.each(oDevices, function (device, done) {
                if (device.data && device.data[0]) {
                    exports.processRawData(device.data[0].imei, device.data, (err, adas) => {
                        if (err) return reject(err);
                        aADAS = aADAS.concat(adas);
                        done();
                    });
                } else {
                    done();
                }
            }, function (err) {
                if (err) return reject(err);
                resolve(aADAS);
            });
        } else {
            exports.processRawData(device_id, res, (err, adas) => {
                if (err) return reject(err);
                resolve(adas);
            });
        }
    });
};

function calculateSpeedFromRaw(data,callback) {
	let duration=0,speed=0,distance = 0;
    for (let i = 1; i < data.length; i++) {
        duration = data[i].datetime - data[i-1].datetime;//msec
        duration = duration/1000; //sec
        distance = geozoneCalculator.getDistance({latitude : data[i-1].latitude,longitude: data[i-1].longitude}, {
            latitude: data[i].latitude,
            longitude: data[i].longitude
        });
        if(duration>0) speed = distance/duration*3.6;
        if(speed>0.36){
            data[i].speed = speed;
		}
    }
};

exports.processRawData = function (imei, data, callback) {
	let drive, nSkip = 0, duration = 0, distance = 0, oAdas = { imei: imei , distance: 0, duration: 0, nSkip: 0, top_speed: 0 }, aAdas = [];
	for (let i = 1; i < data.length; i++) {
		if (!oAdas.points) {
			oAdas.points = [];
		}
		oAdas.imei = imei;
		oAdas.fl = data[i].fl;
		duration = data[i].datetime - data[i - 1].datetime;//msec
		duration = duration / 1000; //sec
		distance = geozoneCalculator.getDistance({ latitude: data[i - 1].latitude, longitude: data[i - 1].longitude }, {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		});
		if(distance > 1000){
			//console.log('distance more',distance);
		}
		let eSpeed = distance/duration * 3.6;
		if(false && duration < 300 && eSpeed > 80){
			//case 1 if i=1 check if first point is wrong
			if(i==1){
				if(data[i+1] && data[i+2]){
					distanceNext = geozoneCalculator.getDistance({ latitude: data[i-1].latitude, longitude: data[i-1].longitude }, {
						latitude: data[i+1].latitude,
						longitude: data[i+1].longitude
					});
					durationNext = data[i+1].datetime - data[i - 1].datetime;//msec
					durationNext = durationNext / 1000; //sec
					let eSpeedNext = distanceNext/durationNext * 3.6;
					distanceNextNext = geozoneCalculator.getDistance({ latitude: data[i-1].latitude, longitude: data[i-1].longitude }, {
						latitude: data[i+2].latitude,
						longitude: data[i+2].longitude
					});
					durationNextNext = data[i+2].datetime - data[i - 1].datetime;//msec
					durationNextNext = durationNextNext / 1000; //sec
					let eSpeedNextNext = distanceNextNext/durationNextNext * 3.6;
					if(durationNext < 400  && durationNextNext < 500 && distanceNext>1000 && distanceNextNext>1000){
						data.splice(i-1,1);
						continue;
					}
				}
			}else{
				//assuming that start point is perfect
				//todo what if start point is wrong?
				if(data[i+1] && data[i+2]){
					//next data exists
					distanceNext = geozoneCalculator.getDistance({ latitude: data[i].latitude, longitude: data[i].longitude }, {
						latitude: data[i+1].latitude,
						longitude: data[i+1].longitude
					});
					durationNext = data[i+1].datetime - data[i].datetime;//msec
					durationNext = durationNext / 1000; //sec
					let eSpeedNext = distanceNext/durationNext * 3.6;
					distanceNextNext = geozoneCalculator.getDistance({ latitude: data[i].latitude, longitude: data[i].longitude }, {
						latitude: data[i+2].latitude,
						longitude: data[i+2].longitude
					});
					durationNextNext = data[i+2].datetime - data[i].datetime;//msec
					durationNextNext = durationNextNext / 1000; //sec
					let eSpeedNextNext = distanceNextNext/durationNextNext * 3.6;
					if(eSpeedNext>70 && eSpeedNextNext>70){
						//2nd point distance is less than first point distance then remove 1st point
						data.splice(i,1);
						continue;
					}
				}
			}

			//TODO check prev points
			//TODO check next points
		}

		if (!oAdas.stop && distance < 300) {
			oAdas.stop = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.distance = oAdas.distance + distance;
			oAdas.duration = oAdas.duration + duration;
			oAdas.end_time = data[i].datetime;
			if (oAdas.top_speed < data[i].speed && data[i].speed < limit.speed) {
				oAdas.top_speed = data[i].speed;
			}
		}

		if (duration > 400 && oAdas.start) {
			//2 coordinates more than 6 min duration
			if (!oAdas.stop && oAdas.duration < 200) {
				drive = false;
				oAdas = { distance: 0, duration: 10, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			} else {
				if (!oAdas.stop) {
					oAdas.stop = {
						latitude: data[i].latitude,
						longitude: data[i].longitude
					};
					oAdas.distance = oAdas.distance + distance;
					oAdas.duration = oAdas.duration + duration;
					oAdas.end_time = data[i].datetime;
					if (oAdas.top_speed < data[i].speed) {
						oAdas.top_speed = data[i].speed;
					}
				}
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				drive = false;
				oAdas = { distance: 0, duration: 10, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
			continue;
		}
		//if coordinates duration less than 400 sec or  6 min
		oAdas.stop = {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		};
		oAdas.end_time = data[i].datetime;
		oAdas.points.push(data[i]);
		if (oAdas.top_speed < data[i].speed && data[i].speed < limit.speed) {
			oAdas.top_speed = data[i].speed;
		}
		if (duration == 0) {
			continue;
		} else if (duration > 300 && drive == true) {//5min ping on running
			oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
			//start check drive and false
			let spd = oAdas.distance / oAdas.duration * 3.6;
			if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
				oAdas.drive = true;
			}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
				oAdas.drive = false;
				//data[i].distance = 0;
			}
			//stop check drive and false
			aAdas.push(oAdas);
			drive = false;
			oAdas = { distance: distance, duration: duration, drive: false, nSkip: 0, top_speed: 0 };
			oAdas.start = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.start_time = data[i].datetime;
		}
		distance = geozoneCalculator.getDistance({ latitude: data[i - 1].latitude, longitude: data[i - 1].longitude }, {
			latitude: data[i].latitude,
			longitude: data[i].longitude
		});
		//console.log(distance);
		if (i == 1) {
			oAdas.start = {
				latitude: data[i - 1].latitude,
				longitude: data[i - 1].longitude
			};
			oAdas.start_time = data[i - 1].datetime;
			if (data[0].speed == 0) {
				oAdas.drive = false;
				drive = false;
			} else {
				drive = true;
				oAdas.drive = true;
			}
		}
		if ((data[i].speed > 0 && data[i - 1].speed > 0)) {
			if (oAdas.drive == false && oAdas.nSkip > 0) {
				drive = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
			} else {
				drive = true;
				oAdas.drive = true;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		} else if ((data[i].speed == 0 && data[i - 1].speed == 0)) {
			if (oAdas.drive == true && oAdas.nSkip > 0) {
				drive = false;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			} else {
				drive = false;
				oAdas.drive = false;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		} else if ((data[i - 1].speed == 0 && data[i].speed > 0)) {
			if (oAdas.nSkip == 0) {
				oAdas.nSkip++;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else if (oAdas.nSkip > 0 && oAdas.drive == true) {
				//already running
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else {
				drive = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: true, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
		} else if ((data[i - 1].speed > 0 && data[i].speed == 0)) {
			if (oAdas.nSkip == 0) {
				oAdas.nSkip++;
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else if (oAdas.nSkip > 0 && oAdas.drive == false) {
				oAdas.stop = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.distance = oAdas.distance + distance;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			} else {
				drive = false;
				oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
				//start check drive and false
				let spd = oAdas.distance / oAdas.duration * 3.6;
				if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
					oAdas.drive = true;
				}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
					oAdas.drive = false;
					//data[i].distance = 0;
				}
				//stop check drive and false
				aAdas.push(oAdas);
				oAdas = { imei: imei, distance: distance, duration: duration, drive: false, nSkip: 0, top_speed: 0 };
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
				oAdas.points = [data[i]];
			}
		}
		if (i == data.length - 1) {
			oAdas.stop = {
				latitude: data[i].latitude,
				longitude: data[i].longitude
			};
			oAdas.end_time = data[i].datetime;
			oAdas.duration = (oAdas.end_time - oAdas.start_time) / 1000;
			//start check drive and false
			let spd = oAdas.distance / oAdas.duration * 3.6;
			if (!oAdas.drive && oAdas.distance > 200 && spd > 10) {
				oAdas.drive = true;
			}else if(oAdas.drive && (oAdas.distance < 200 || spd < 3)){
				oAdas.drive = false;
				//data[i].distance = 0;
			}
			//stop check drive and false
			aAdas.push(oAdas);
		}
	}
	callback(null, aAdas);
};
function sortbyDeviceId(data){
            let devices = {};
            for (let i = 0; i < data.length; i++) {
                data[i].imei = parseInt(data[i].device_id);
                if (!devices[data[i].imei]) {
                    devices[data[i].imei] = {
                        data: []
                    };
                }
                devices[data[i].imei].data.push(data[i]);
            }
            async.each(devices, function (device, done) {
                device.data.sort(function (a, b) {
                    let keyA = new Date(a.datetime),
                        keyB = new Date(b.datetime);
                    // Compare the 2 dates
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });
                done();
            }, function (err) {
                return devices;
            });
            return devices;

};

exports.getPlaybackV4 = function (request, callback) {
    let activity ={};
    let gpsData = [];
    let adas=[];
    let asyncTasks = [];
    Gps.getGPSDataBetweenTimeAsync(request.device_id,request.start_time,request.end_time)
        .then(function (res) {
            gpsData = res;
            return processRawDataAsync(request.device_id,res);
        }).then(function (das) {
		checkAnomaly(das);
		if(request.idling){
			let oSettings = {};
			checkIdlingFromADAS(das,oSettings);
		}
        adas = das;
    }).error(function (err) {
        console.log('err'+err.toString());
    }).then(function () {
		request.isAddrReqd = true;
		console.log('before processADASReportForPlayBack',request.device_id,new Date());
        return BPromise.promisify(processADASReportForPlayBack)(adas, request);
	}).then(function(response){
        activity.data = response;
        if (activity.status === 'ERROR') return callback(null, activity);
        const rdev = activity.data[request.device_id];
        for (const key in rdev) {
            activity[key] = rdev[key];
        }
        activity.message = 'playback data';

        if (gpsData && gpsData[0]) gpsData[0].cum_dist = 0;
        /*
        for (let i = 0; i < gpsData.length; i++) {
            for (let j = 0; j < activity.data.length; j++) {
                if (gpsData[i].datetime >= activity.data[j].start_time && gpsData[i].datetime <= activity.data[j].end_time) {
                    if (!activity.data[j].points) activity.data[j].points = [];
                    activity.data[j].points.push(gpsData[i]);
                    break;
                }
            }
        }
		*/
        let last_cum = 0;
        let copyNpoint = 5;
        for (let i = 0; i<activity.data.length; i++) {
			if(!activity.data[i].drive && activity.data[i].points && activity.data[i].points.length>3){
				//select mid point for halts
				let midPoint = activity.data[i].points[parseInt(activity.data[i].points.length/2)];
				activity.data[i].stop.latitude = midPoint.latitude;
				activity.data[i].stop.longitude = midPoint.longitude;
			}
			//remove extra points from halts as we need only 1 to defin it
            if (!activity.data[i].drive || !activity.data[i].points) {
                if(activity.data[i].points && activity.data[i].points.length>(2*copyNpoint+1)){
                    let aPoint = [];
                    for(let x=0;x<activity.data[i].points.length;x++){
                        if(x<copyNpoint){
                            aPoint.push(activity.data[i].points[x]);
                        }
                        if(x==copyNpoint){
                            x = activity.data[i].points.length - copyNpoint;
                        }
                        if(x>copyNpoint){
                            aPoint.push(activity.data[i].points[x]);
                        }
                    }
                    activity.data[i].points = aPoint;
                }

                continue;
            }
            let countExtra,lastCumDistJ;
            for(let j=1;j<activity.data[i].points.length;j++){
                if(!activity.data[i].points[j-1].cum_dist){
                    activity.data[i].points[j-1].cum_dist = last_cum;
                }
                p2pDist = geozoneCalculator.getDistance({latitude: activity.data[i].points[j-1].lat,longitude: activity.data[i].points[j-1].lng},
                    {latitude: activity.data[i].points[j].lat, longitude: activity.data[i].points[j].lng});
                dur = (new Date(activity.data[i].points[j].datetime).getTime() - new Date(activity.data[i].points[j-1].datetime).getTime() )/1000;
				let speed = 0;
				if (p2pDist > 0 && dur > 0) speed = p2pDist / dur * 3.6;

                if(request.isDetailed){
					activity.data[i].points[j].cum_dist = activity.data[i].points[j-1].cum_dist + p2pDist;
					last_cum = activity.data[i].points[j].cum_dist;
				}else{
					if(p2pDist < 200){
						activity.data[i].points.splice(j,1);
						j--;
					}else{
						activity.data[i].points[j].cum_dist = activity.data[i].points[j-1].cum_dist + p2pDist;
						last_cum = activity.data[i].points[j].cum_dist;
					}
				}

                if(p2pDist>2000 && speed > 100){
                    if(countExtra && (j-countExtra)==1){//2 consecutive point has anomoly then remove mid one
                        activity.data[i].points.splice(j-1,1);
                        j--;
                        activity.data[i].points[j].cum_dist = activity.data[i].points[j].cum_dist - p2pDist - lastCumDistJ;
                        last_cum = activity.data[i].points[j].cum_dist;
                    }else{
                        countExtra = j;
                        lastCumDistJ = p2pDist;
                    }
                }
                delete activity.data[i].points[j].device_id;
            }
        }
        for (let i = activity.data.length - 1; i >= 0; i--) {
            if (!activity.data[i].drive || !activity.data[i].points) {
                continue;
            }
            activity.data[i].points[activity.data[i].points.length - 1].cum_dist = activity.tot_dist;
            break;
        }
		console.log('before getPlaybackV4 callback',request.device_id,new Date());
        callback(null, activity);
    });
};

exports.getPlaybackV4Report = function (request, callback) {
	let activity = {};
	let gpsData = [];
	let adas = [];
	let asyncTasks = [];
	Gps.getGPSDataBetweenTimeAsync(request.device_id, request.start_time, request.end_time)
		.then(function (res) {
			gpsData = res;
			return processRawDataAsync(request.device_id, res);
		}).then(function (das) {
		checkAnomaly(das);
		adas = das;
	}).error(function (err) {
		console.log('err' + err.toString());
	}).then(function () {
		request.isAddrReqd = true;
		return BPromise.promisify(processADASReportForPlayBack)(adas, request);
	}).then(function (response) {
		activity.status = 'OK';
		let combinedData = [];
		for (let key in response) {
			let device = response[key];
			let num_stops = 0;
			let dur_stop = 0;
			if (device.data[0] && !device.data[0].drive) {
				//exclude start halt
				num_stops = num_stops - 1;
			}

			if (device.data.length > 1 && device.data[device.data.length - 1] && !device.data[device.data.length - 1].drive) {
				//exclude end halt
				num_stops = num_stops - 1;
			}
			if (request.reportType == 'report_parking') {
				for (let i = 0; i < device.data.length; i++) {
					if (device.data[i].drive || (request.minimum_time_in_mins && device.data[i].duration < request.minimum_time_in_mins * 60)) {
						device.data.splice(i, 1);
						i--;
					} else {
						num_stops++;
						dur_stop += device.data[i].duration;
					}
				}
			}else if (request.reportType == 'report_combined_halts') {
				for (let i = 0; i < device.data.length; i++) {
					if (device.data[i].drive || (request.minimum_time_in_mins && device.data[i].duration < request.minimum_time_in_mins * 60)) {
						device.data.splice(i, 1);
						i--;
					} else {
						device.data[i].reg_no = device.reg_no;
						num_stops++;
						dur_stop += device.data[i].duration;
					}
				}
                combinedData = combinedData.concat(device.data);
			} else {
				for (let i = 0; i < device.data.length; i++) {
					if (!device.data[i].drive) {
						num_stops++;
						dur_stop += device.data[i].duration;
					}
				}
			}

			device.num_stops = num_stops;
			device.dur_stop = dur_stop;
		}

		activity.message = request.reportType;
		activity.combinedData = combinedData;
		activity.data = response;
		if (activity.status === 'ERROR') return callback(null, activity);
		callback(null, activity);
	});
};

exports.getPlaybackV4DriverReport = function (request, callback) {
	let activity = {};
	let gpsData = [];
	let adas = [];
	let asyncTasks = [];
	Gps.getGPSDataBetweenTimeAsync(request.device_id, request.start_time, request.end_time)
		.then(function (res) {
			gpsData = res;
			return processRawDataAsync(request.device_id, res);
		}).then(function (das) {
		checkAnomaly(das);
		adas = das;
	}).error(function (err) {
		console.log('err' + err.toString());
	}).then(function () {
		request.isAddrReqd = true;
		return BPromise.promisify(processADASDriverReportForPlayBack)(adas, request);
	}).then(function (response) {
		activity.status = 'OK';
		activity.message = request.reportType;
	    if(request.reportType == 'driver_day_activity'){
	    	let aData = [];
            request.device_id.forEach((sDeviceId) => {
                let record = {dr: {}, smry: {}};
                let prevDate = null;
                aData.push(record);
                let aActivity = response[sDeviceId];
                if(aActivity && aActivity.data){
                    aActivity.data.forEach((oActivity, index) => {
                        oActivity.driver = oActivity.driver || aActivity.driver_name || aActivity.driver_name2;
                        let dr = record.dr[oActivity.driver] = record.dr[oActivity.driver] || {};
                        let date = dateutils.getDDMMYYYY(oActivity.start_time);
                        let nextDate = aActivity.data[index+1] && dateutils.getDDMMYYYY(aActivity.data[index+1].start_time);
                        let eachData = dr[date] = dr[date] || {hrs: 0, dis: 0, onRest: 0};
                        let smryData = record.smry[date] = record.smry[date] || {hrs: 0/*, offRest: 0*/, dis: 0};

                        if(oActivity.status == 'running'){
                            eachData.hrs += (oActivity.duration || 0);
                            smryData.hrs += (oActivity.duration || 0);
                            if(!smryData.start_time)
                                smryData.start_time = oActivity.start_time;
                            smryData.end_time = oActivity.end_time;
                            eachData.dis += (oActivity.distance || 0);
                        }else {
							eachData.onRest += (prevDate !== date) || (nextDate !== date) ? 0 : (oActivity.duration || 0);
						}
                        // smryData.dis += (oActivity.distance || 0);
                        // eachData.onRest += (prevDate !== date) ? 0 : (oActivity.pre_halt_dur || 0);
                        // smryData.offRest += (prevDate !== date) ? (oActivity.pre_halt_dur || 0) : 0;
                        prevDate = date;
                    });
                    delete aActivity.data;
                    record.summary = aActivity;
                }
            });

            let aDays = [];
            let stDate = new Date(request.start_time);
            let endDate = new Date(request.end_time);
            for(let date = stDate; date < endDate; date = dateutils.add(date, 1))
                aDays.push(dateutils.getDDMMYYYY(date));
            activity.data = aData;
            activity.aDays = aDays;
		}else{
			activity.data = response;
		}
		if (activity.status === 'ERROR') return callback(null, activity);
		callback(null, activity);
	});
};

exports.getDriverDayReport = function (request, callback) {
	let activity = {};
	let gpsData = [];
	let adas = [];
	let asyncTasks = [];
	Gps.getGPSDataBetweenTimeAsync(request.device_id, request.start_time, request.end_time)
		.then(function (res) {
			gpsData = res;
			return processRawDataAsync(request.device_id, res);
		}).then(function (das) {
		checkAnomaly(das);
		adas = das;
	}).error(function (err) {
		console.log('err' + err.toString());
	}).then(function () {
		request.isAddrReqd = true;
		return BPromise.promisify(processADASDriverReportForPlayBack)(adas, request);
	}).then(function (response) {
		activity.status = 'OK';
		activity.message = request.request;
        let aData = [];
        let aDays = new Set();
        request.device_id.forEach((sDeviceId) => {
            let record = {dr: {}, smry: {}};
            let prevDate = null;
            aData.push(record);
            let aActivity = response[sDeviceId] || {data: []};
            aActivity.data.forEach((oActivity) => {
                if(oActivity.status != 'running')
                    return;
                oActivity.driver = oActivity.driver || '';
                let dr = record.dr[oActivity.driver] = record.dr[oActivity.driver] || {};
                let date = dateutils.getDDMMYYYY(oActivity.start_time);
                aDays.add(date);
                let eachData = dr[date] = dr[date] || {hrs: 0, dis: 0, onRest: 0};
                if(!eachData.start_time)
                    eachData.start_time = oActivity.start_time;
                let smryData = record.smry[date] = record.smry[date] || {hrs: 0, offRest: 0, dis: 0};
                eachData.hrs += (oActivity.duration || 0);
                smryData.hrs += (oActivity.duration || 0);
                eachData.dis += (oActivity.distance || 0);
                smryData.dis += (oActivity.distance || 0);
                eachData.onRest += (prevDate !== date) ? 0 : (oActivity.pre_halt_dur || 0);
                smryData.offRest += (prevDate !== date) ? (oActivity.pre_halt_dur || 0) : 0;
                prevDate = date;
            });
            delete aActivity.data;
            record.summary = aActivity;
        });
        aDays = [...aDays].sort((a,b) => dateutils.stringToDate(a).getTime() - dateutils.stringToDate(b).getTime());
        activity.data = aData;
        activity.aDays = aDays;
		if (activity.status === 'ERROR') return callback(null, activity);
		callback(null, activity);
	});
};

exports.processRawDataForIdling = function(data,callback) {
	let idle,nSkip=0,duration=0,oAdas = {duration:0,nSkip:0},aAdas = [];
	for (let i = 1; i < data.length; i++) {
		if(data[i].ignition == undefined || data[i].ignition == null){
			continue;
		}
		duration = data[i].datetime - data[i-1].datetime;//msec
		duration = duration/1000; //sec

		if(duration>600){//ignore idling between offline durations ore than 10 min
			continue;
		}

		if(i==1){
			oAdas.start_time = data[i-1].datetime;
			if(data[0].ignition == 0){
				oAdas.idle = false;
				idle=false;
			}else if(data[0].ignition == 1){
				idle = true;
				oAdas.idle = true;
			}
		}
		if((data[i].ignition == 1 && data[i-1].ignition == 1)){
			if(oAdas.idle == false && oAdas.nSkip > 0){
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}else{
				idle = true;
				oAdas.idle = true;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		}else if((data[i].ignition ==  0 && data[i-1].ignition == 0)){
			if(oAdas.idle == false && oAdas.nSkip > 0){
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start = {
					latitude: data[i].latitude,
					longitude: data[i].longitude
				};
				oAdas.start_time = data[i].datetime;
			}else{
				idle = false;
				oAdas.idle = false;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}
		}else if((data[i-1].ignition == 0 && data[i].ignition > 0)){
			if(oAdas.nSkip == 0){
				oAdas.nSkip++;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else if(oAdas.nSkip > 0 && oAdas.idle == true){
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else{
				idle = true;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:true,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}
		}else if((data[i-1].ignition > 0 && data[i].ignition == 0)){
			if(oAdas.nSkip == 0){
				oAdas.nSkip++;
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else if(oAdas.nSkip > 0 && oAdas.idle == false){
				oAdas.duration = oAdas.duration + duration;
				oAdas.end_time = data[i].datetime;
			}else{
				idle = false;
				oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
				aAdas.push(oAdas);
				oAdas = {duration:duration,idle:false,nSkip:0};
				oAdas.start_time = data[i].datetime;
			}
		}
		if(i == data.length-1){
			oAdas.end_time = data[i].datetime;
			oAdas.duration = (oAdas.end_time - oAdas.start_time)/1000;
			aAdas.push(oAdas);
		}
	}
	return aAdas;
};

exports.getIdleReport = function (request, callback) {
    let activity ={};
    let gpsData = [];
    let adas=[];
    let asyncTasks = [];
    Gps.getGPSDataBetweenTimeAsync(request.device_id,request.start_time,request.end_time)
        .then(function (res) {
            gpsData = res;
            return processRawDataAsync(request.device_id,res);
        }).then(function (das) {
		checkAnomaly(das);
		let oSettings = {removePoints:true};
		checkIdlingFromADAS(das,oSettings);
        adas = das;
    }).error(function (err) {
        console.log('err'+err.toString());
    }).then(function () {
		request.isAddrReqd = true;
        return BPromise.promisify(processADASReportForIdling)(adas, request);
	}).then(function(response){
        activity.data = response;
        if (activity.status === 'ERROR') return callback(null, activity);
        const rdev = activity.data[request.device_id];
        for (const key in rdev) {
            activity[key] = rdev[key];
        }
        activity.message = 'playback data';
        callback(null, activity);
    });
};

function getDeviceAlertsAsync(req){
	return new Promise((resolve, reject) => {
		Alerts.getDeviceAlerts(req,(err, data) => {
			if (err) return reject(err);
			resolve(data);
		});

	});
};

function getDeviceAlertsFromGeographyAsync(req){
	return new Promise((resolve, reject) => {
		addressService.getAlertsFromGeography(req,(err, data) => {
			if (err) return reject(err);
			resolve(data);
		});

	});
};

function checkAnomaly(das){
	for (let i = 0; i < das.length; i++) {
		let spd = das[i].distance / das[i].duration * 3.6;
		if (das[i].drive && spd > 100) {
			das[i].distance = 0;
			das[i].drive = false;
		}else if (das[i].drive && spd < 3) {
			//das[i].distance = 0;
			das[i].drive = false;
		} else if (das[i].drive && das[i].distance < 250 && spd < 10) {
			//das[i].distance = 0;
			das[i].drive = false;
		} else {
			//console.log(das[i].distance,das[i].duration,das[i].distance / das[i].duration * 3.6);
		}
	}
}

function checkIdlingFromADAS(das,oSettings = {}){
	for (let j = 0; j < das.length; j++) {
		if(das[j].drive){
			if(oSettings.removePoints){
				delete das[j].points;
			}
			if(oSettings.removeDrives){
				das.splice(j, 1);
			}
			continue;
		}
		if (das[j].drive == false && das[j].points && das[j].points.length) {
			let aIdling = exports.processRawDataForIdling(das[j].points);
			let cIdle = 1;
			for (let i = 0; i < aIdling.length; i++) {
				if(aIdling[i].duration > 15 * 60){
					continue;
				}
				aIdling[i].duration
				if (i == 0 && aIdling[i].duration > 180) {
					if(aIdling[i].idle){
						if(aIdling[i].duration > 1000){
							//console.log('Idling greater than 16 min ',aIdling[i].start_time, aIdling[i].end_time);
						}		
						das[j].start_time = aIdling[i].start_time;
					    das[j].end_time = aIdling[i].end_time;
					    das[j].idle = aIdling[i].idle;
					    das[j].duration = aIdling[i].duration;
						das[j].idle_duration = aIdling[i].duration;
					}else{
						das[j].idle = aIdling[i].idle;
					}	
				}else if(i > 0 && aIdling[i].duration > 180){
					let oStoppage = Object.assign({},das[j]);//copy object to prevent ref updating
					delete oStoppage.points;
					oStoppage.start_time = aIdling[i].start_time;
					oStoppage.end_time = aIdling[i].end_time;
					oStoppage.idle = aIdling[i].idle;
					oStoppage.duration = aIdling[i].duration;
					oStoppage.idle_duration = oStoppage.duration;
					oStoppage.distance = 0;
					das[j].end_time = aIdling[i].start_time;
					if(aIdling[i].duration > 1000){
						console.log('Idling greater than 16 min ',aIdling[i].start_time, aIdling[i].end_time);
					}
					das.splice((j + cIdle), 0, oStoppage);
					cIdle++;
				}
			}
		}
		if(oSettings.removePoints){
			delete das[j].points;
		}
	}
}

exports.getDeviceAlertsAsync = getDeviceAlertsAsync;
