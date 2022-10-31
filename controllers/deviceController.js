const BPromise = require('bluebird');
const router = require('express').Router();
const User = require('../model/user');
const moment = require('moment');
const excelService = require('../services/excelService');
const winston = require('../utils/logger');
const Device = BPromise.promisifyAll(require('../model/device'));
const GpsGaadi = require('../model/gpsgaadi');
const activeusersmanager = require("../utils/activeusersmanager");
const landmarkService = BPromise.promisifyAll(require('../services/landmarkService'));

function validateSelectedUID(req, callback) {
    let token = req.headers['authorization'];
    let user = req.body && req.body.selected_uid ? req.body.selected_uid : req.query.selected_uid;
    User.getUserAsync(user).then(function (oUser) {
        //if (err) {callback(err);}
        if (oUser && oUser.user_token && oUser.user_token === token) {
            callback();
        } else {
            callback({"status": "ERROR", "message": "Either selected_uid or token is wrong"});
        }
    }).catch(callback);
}

router.post('/associate_device', function (req, res) {
    validateSelectedUID(req, function (err) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
            return res.json(response);
        }
        if (req.reg_no) {
            req.reg_no = req.reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
        }
        if (!req.pooled) {
            req.pooled = 0;
        }
        User.getUser(req.new_uid, function (err, oUser) {
            if (err) {
                response.message = err.toString();
                return res.json(response);
            } else if (!oUser) {
                response.message = 'user not found';
                return res.json(response);
            } else {
                req.user_role = oUser.role;
                if (oUser.type === 'dealer' || oUser.type === 'admin') {
                    req.pooled = 0;
                }
                Device.associateDeviceWithUser(req, function (err, aDevice) {
                    let response = {
                        status: 'ERROR',
                        message: ""
                    };
                    if (err) {
                        response.message = err.toString();
                        return res.json(response);
                    } else if (!aDevice) {
                        response.message = 'device update registration failed';
                        return res.json(response);
                    } else {
                        response.status = 'OK';
                        response.message = 'Device update done successfully';
                        if (req.user_role === 'user') {
                            Device.getDevices(req, function (err, aData) {
                                let callback = function (err, aRegisteredData) {
                                    if (err) {
                                        winston.error(err);
                                    }
                                };
                                if (err) {
                                    return callback(err);
                                } else if (aData) {
                                    GpsGaadi.registerGpsGaadi(aData, callback);
                                }
                            });
                        }
                        return res.json(response);
                    }
                });
            }
        });
    });
});

router.post('/register_device', function (req, res) {
    validateSelectedUID(req, function (err) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
            return res.json(response);
        }
        User.getUser(req.body.user_id, function (err, oUser) {
            if (err) {
                response.message = err.toString();
                return res.json(response);
            } else if (!oUser) {
                response.message = 'user not found';
                return res.json(response);
            } else {

                let devices = req.body.devices.map(a => {
                    a.user_id = req.body.user_id;
                    a.pooled = 0;
                    return a;
                });

                let deviceImeis = req.body.devices.map(a => {
                    return a.imei
                });

                Device.registerDevicesBatch(devices, function (err, result) {
                    let response = {
                        status: 'ERROR',
                        message: ""
                    };
                    if (err) {
                        response.message = err.toString();
                        return res.json(response);
                    } else if (!result) {
                        response.message = 'device registration failed';
                        return res.json(response);
                    } else {
                        response.status = 'OK';
                        response.message = 'Device registration done successfully';
                        if (oUser.role === 'user') {
                            Device.getDevices({devices: deviceImeis}, function (err, aData) {
                                if (err) {
                                    winston.error(err);
                                }
                                else if (aData) {
                                    GpsGaadi.registerGpsGaadi(aData, function (err, reggpsgaadi) {
                                    });
                                }
                            });
                        }
                        return res.status(200).json(response);
                    }
                })
            }
        });
    });
});

router.post('/deregister_device', function (req, res) {
    validateSelectedUID(req, function (err) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
            return res.json(response);
        }
        User.getUser(req.body.user_id, function (err, oUser) {
            if (err) {
                response.message = err.toString();
                return res.json(response);
            } else if (!oUser) {
                response.message = 'user not found';
                return res.json(response);
            } else {

                let request = {selected_uid:req.body.user_id};

                Device.removeDevicesForUserId(request, function (err, result) {
                    let response = {
                        status: 'ERROR',
                        message: ""
                    };
                    if (err) {
                        response.message = err.toString();
                        return res.json(response);
                    } else if (!result) {
                        response.message = 'Device removal failed';
                        return res.json(response);
                    } else {
                        response.status = 'OK';
                        response.message = 'Devices removed successfully';
                        if (oUser.role === 'user') {
                            GpsGaadi.removeGpsGaadi(request,function () {
                                //
                            })
                        }
                        return res.status(200).json(response);
                    }
                })
            }
        });
    });
});

router.post('/get_device', function (req, res) {
    let response = {
        status: 'ERROR',
        message: ""
    };
    if(!req.body.selected_uid){
        response.message = 'selected_uid not provided';
        return res.json(response);
    }
    if(!req.body.user_id || !req.body.selected_uid){
        response.message = 'user_id not provided';
        return res.json(response);
    }
    if(!req.body.device_id && !req.body.reg_no){
        response.message = 'reg no or imei should be provided'
        return res.json(response);
    }
    let oReq = {};
    if(req.body.device_id){
        if(req.body.device_id instanceof Array){
            oReq.device_id = req.body.device_id;
        }else{
            oReq.device_id = [req.body.device_id]  ;
        }

    }
    if(req.body.reg_no){
        oReq.reg_no = req.body.reg_no;
    }
    oReq.selected_uid = req.body.selected_uid || req.body.user_id;
    GpsGaadi.getGpsGaadiList(oReq,function(err,gResp){
        if (err) {
            response.message = err.message;
            return res.json(response);
        }
        if(gResp && gResp.data){
            response.data = gResp.data;
            response.status = 'OK';
            return res.json(response);
        }
    });
});

router.post('/get_deviceFlvl', function (req, res) {
    let response = {
        status: 'ERROR',
        message: ""
    };
    if(req.body.vehicle_no){
        response.response = req.body.vehicle_no;
    }
    if(!req.body.selected_uid){
        response.message = 'selected_uid not provided';
        return res.json(response);
    }
    if(!req.body.device_id){
        response.message = 'Imei should be provided'
        return res.json(response);
    }
    if(!req.body.from || !req.body.to){
        response.message = 'Date should be provided'
        return res.json(response);
    }
    let oReq = {};
    if(req.body.from && req.body.to){
        oReq.from = req.body.from;
        oReq.to = req.body.to;
    }
    if(req.body.device_id){
        if(req.body.device_id instanceof Array){
            oReq.device_id = req.body.device_id;
        }else{
            oReq.device_id = [req.body.device_id];
        }
    }
    let end = moment(req.body.to);
    let start = moment(req.body.from);
    let daysDiff = end.diff(start, 'days');
    if(daysDiff > 7){
        response.message = 'Date gap not be greater tha 7 days'
        return res.json(response);
    }
    let timeGap = 10;
    if(req.body.timeGap){
        timeGap = req.body.timeGap;
    }
    oReq.selected_uid = req.body.selected_uid || req.body.user_id;
    GpsGaadi.getFlvliList(oReq,function(err,gResp){
        if (err) {
            response.message = err.message;
            return res.json(response);
        }
        if(gResp && gResp.data){
            response.data = gResp.data;
            response.data = response.data.filter(item =>item.f_lvl !== null);
            if(response.data && response.data[0]){
                response.data = timeGapCalculate(response.data,timeGap);
            }
            if(req.body.download){
                response.login_uid = req.body.login_uid;
                response.start_time = req.body.from;
                response.end_time = req.body.to;
                excelService.getfuelLevelReport(response, obj => {
                    response.status = 'OK';
                    response.message = 'Fuel level Report';
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else{
                response.status = 'OK';
                response.message = 'Fuel data get successfully';
                return res.json(response);
            }
        }
    });
});

router.post('/dummy', function (req, res) {
    landmarkService.getNearestLandmarkForPoint(req.body, resp => {
        res.status(200).json(resp);
    });
});

router.post('/update_device', function (req, res) {
    req.body.user_id = req.body.user_id || req.body.selected_uid || req.body.login_uid;
    User.getUser(req.body.user_id, function (err, oUser) {
            if (err) {
                response.message = err.toString();
                return res.json(response);
            } else if (!oUser) {
                response.message = 'user not found';
                return res.json(response);
            } else {
                if (req.body.reg_no) {
                    req.body.reg_no = req.body.reg_no.replace(/[^0-9a-z]/gi, '').toUpperCase();
                }
                Device.updateDevice(req.body, function (err, resp2) {
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
                        response.data = resp2;
                        activeusersmanager.addDevice(resp2);
                        let cb = function (err, resp3) {
                            winston.error(err);
                        };
                        let new_req = Object.assign({}, req.body);
                        GpsGaadi.updateGpsGaadi(new_req, cb);
                    }
                    return res.status(200).json(response);
                });
            }
        });
});

router.post("/getDeviceByUser", function (req, res, next) {
    let user = "'" + req.body.user_id + "'";
    Device.fetchDeviceByUserIdAsync(user).then(function(oUser){
        if(oUser){
            return res.status(200).json({"status": "OK","message": "Device Data found","data":oUser});
        }else{
            return res.status(200).json({"status": "ERROR","message": "Either user_id,user token  are wrong incorrect"});
        }
    }).catch(next);
});

router.post("/removeDeviceFromUser", function (req, res, next) {
    Device.removeDevicesForUserIdAsync(req.body).then(function(oUser){
        if(oUser){
            return res.status(200).json({"status": "OK","message": "Device Removed Successfully","data":oUser});
        }else{
            return res.status(200).json({"status": "ERROR","message": "Either user_id,user token  are wrong incorrect"});
        }
    }).catch(next);
});


function timeGapCalculate(data, time) {
    let arr = [];
    // sort the data first
    data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    arr.push(data[0]);
    // 1 min 60000 milisecond
    let gap = time * 60000;
    var stGetTime = 0, endGetTime =  0 ;
    for (let i = 0; i < data.length; i++) {
        stGetTime = data[i].datetime.getTime();
        for (let j = i +1 ; j < data.length; j++) {
           endGetTime = data[j].datetime.getTime();
           if((endGetTime - stGetTime) > gap){
               arr.push(data[j]);
               i = j;
               break;
           }
        }
    }
    return arr;
}

module.exports = router;
