const BPromise = require('bluebird');
const router = require('express').Router();
const User = require('../model/user');
const winston = require('../utils/logger');
const Device = BPromise.promisifyAll(require('../model/device'));
const GpsGaadi = require('../model/gpsgaadi');
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

router.post('/dummy', function (req, res) {
    landmarkService.getNearestLandmarkForPoint(req.body, resp => {
        res.status(200).json(resp);
    });
});



module.exports = router;
