const BPromise = require('bluebird');
const router = require('express').Router();
const reportService = require('../services/reportService');
const deviceService = BPromise.promisifyAll(require('../services/deviceService'));
//const deviceServiceV2 = BPromise.promisifyAll(require('../services/deviceServiceV2'));
const excelService = require('../services/excelService');
const async = require('async');
const addressService = BPromise.promisifyAll(require('../services/addressService'));
//const Gps = BPromise.promisifyAll(require('../model/gps'));
const dateutils = require('../utils/dateutils');
const gpsgaadiService = BPromise.promisifyAll(require('../services/gpsgaadiService'));
const notificationService = require('../services/notificationService');

router.post("/mileage", function (req, res, next) {
    reportService.getMileageReportLMS(req.body, (err, response) => {
        if(err){
            let oResp = {status:'OK',tot_dist:'NA'};
            return res.status(200).json(oResp);
        }
        return res.status(200).json(response);
    });
});

router.post("/_activity", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, 'web', false)
        .then(resp => {
            min = new Date() - stdt;
            console.log('report data resp  ', min / 60000);
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        })
        .then(() => {
            if (response.status === 'ERROR') {
                return res.status(200).json(response);
            }
            excelService.getActivityReport(response, obj => {
                min = new Date() - stdt;
                console.log('report data resp  ', min / 60000);
                response.data = obj.url;
                return res.status(200).json(response);
            });
        })
});

router.post("/overspeed", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getOverspeedReport(request.device_id, request.start_time, request.end_time, request.speed_limit, "web", response => {
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        if (response.status === 'ERROR') {
            return res.status(500).json(response);
        }
        response.timezone = request.timezone;
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getOverspeedReport(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }

    });
});

router.post("/km", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    // winston.info(request);
    request.start_time = new Date(request.start_time).getTime();
    request.end_time = new Date(request.end_time).getTime();
    // winston.info(request);
    request.download = true;
    reportService.getMileageReport(request, (err, response) => {
        if (!response || response.status === 'ERROR') {
            return res.status(200).json(response);
        }
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        response.timezone = request.timezone;
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getMileageReport2(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }
    });
});

router.post("/mileage2", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    // winston.info(request);
    request.start_time = new Date(request.start_time).getTime();
    request.end_time = new Date(request.end_time).getTime();
    // winston.info(request);
    request.download = true;
    deviceService.getMileageReport(request.device_id, request.start_time, request.end_time, "web", (err, response) => {
        if (!response || response.status === 'ERROR') {
            return res.status(200).json(response);
        }
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        response.timezone = request.timezone;
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getMileageReport(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }

    });
});

router.post("/kmLive", function (req, res, next) {
    let request = req.body;
    if (!request.device_id) {
        let resp = resquest;
        resp.status = 'ERROR';
        resp.message = 'device id not found';
        return res.status(200).json(resp);
    }
    console.log('kmLive start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    request.start_time = new Date(request.start_time).getTime();
    request.end_time = new Date(request.end_time).getTime();
    request.download = true;

    deviceService.getMileageReport2(request.device_id, request.start_time, request.end_time, "download", (err, response) => {
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        if (response.status === 'ERROR') {
            return res.status(200).json(response);
        }
        response.timezone = request.timezone;
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getMileageReport2(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }

    });
});

router.post("/_parking", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getParkingReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, "web")
        .then(resp => {
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        })
        .then(() => {
            //return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
            return;
        })
        .then(() => {
            if (response.status === 'ERROR') {
                return res.status(500).json(response);
            }
            if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
                excelService.getParkingReport(response, obj => {
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else{
                return res.status(200).json(response);
            }

        });
});

router.post("/haltSummary", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getHaltViewReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, "web")
        .then(resp => {
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        }).then(() => {
        if (response.status === 'ERROR') {
            return res.status(500).json(response);
        }
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getHaltSummryReport(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }

    });
});

router.post("/haltView", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getHaltViewReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, "web")
        .then(resp => {
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        }).then(() => {
        if (response.status === 'ERROR') {
            return res.status(500).json(response);
        }
        return res.status(200).json(response);
    });
});

router.post("/activity_interval", function (req, res, next) {
    let request = req.body;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    //request.isAddrReqd = true;
    request.time_interval = request.time_interval || 30;
    request.client = 'web';
    deviceService.getActivityIntervalReport(request.device_id, request.start_time, request.end_time, request.time_interval, request.client, (err, response) => {
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        if (response.status === 'ERROR') {
            return res.status(200).json(response);
        }
        response.timezone = request.timezone;
        if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
            excelService.getActivityReport(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            return res.status(200).json(response);
        }

    });
});

router.post("/monthlyActivity", function (req, res, next) {
    let request = req.body;
    request.folderName = req.body.folderName || 'DEC2018';
    let tempD = [];
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
    } else {
        tempD = [request.device_id];
    }
    async.eachOfSeries(tempD, function (imei, index, done) {
        request.device_id = imei;
        BPromise.promisify(prepareDeviceActivity)(request)
            .then(function (resp) {
                done();
            }).error(function (err) {
            console.log('err ', err.toString());
            done();
        });
    }, function (err) {
        if (err) console.log('error in monthly activity ', err.toString());
        return res.status(200).json(request);

    });
});

function prepareDeviceActivity(request, callback) {
    deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, 'web', false)
        .then(resp => {
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
            response.misType = request.misType;
            response.folderName = request.folderName
        })
        .then(() => {
            if (response.status === 'ERROR') {
                console.log('monthly activity report ERROR ', response);
                return callback('err');
            }
            excelService.getActivityReport(response, obj => {
                response.data = obj.url;
                console.log('done activity for ', request.device_id);
                return callback(null, response);
            });
        })
};

router.post("/playback", function (req, res, next) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('playback start time ', new Date());

    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    let durHour = (new Date(request.end_time).getTime() - new Date(request.start_time).getTime()) / (60 * 60 * 1000)
    if (durHour > 240) {//more than 10 days
        deviceService.getPlaybackV3Async(request.device_id, request.start_time, request.end_time)
            .then(resp => {
                response = resp;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                //response.status = 'OK';
                return res.status(200).json(response);
            });
        /*
            .then(() => {
                return landmarkService.injectLandmarkGenericAsync(request.selected_uid || request.login_uid, response.data);
            })
            .then(() => {
                this.callback(request, response);
            });
        */
    } else  {
       // request.idling = request.idling || false;
        request.idling = false;
        deviceService.getPlaybackV4Async(request)
            .then(resp => {
                response = resp;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                response.status = 'OK';
                return res.status(200).json(response);
            });
    }

});

router.post("/monthlyActivityInterval", function (req, res, next) {
    let request = req.body;
    request.folderName = req.body.folderName || 'JAN2019';
    request.time_interval = 30;
    request.client = 'web';
    let tempD = [];
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
    } else {
        tempD = [request.device_id];
    }
    async.eachOfSeries(tempD, function (imei, index, done) {
        request.device_id = imei;
        BPromise.promisify(prepareDeviceActivityInterval)(request)
            .then(function (resp) {
                done();
            }).error(function (err) {
            console.log('err ', err.toString());
            done();
        });
    }, function (err) {
        if (err) console.log('error in monthly activity ', err.toString());
        return res.status(200).json(request);

    });
});

function prepareDeviceActivityInterval(request, callback) {
    deviceService.getActivityIntervalReport(request.device_id, request.start_time, request.end_time, request.time_interval, request.client, (err, response) => {
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        response.timezone = request.timezone;
        response.misType = request.misType;
        response.folderName = request.folderName
        if (response.status === 'ERROR') {
            return callback(request, response);
        }
        response.timezone = request.timezone;
        excelService.getActivityReport(response, obj => {
            response.data = obj.url;
            console.log('done interval activity for ', request.device_id);
            return callback(null, response);
        });
    });
};

router.post("/odometer", function (req, res, next) {
    let request = req.body, sameDay = false;
    let actaulEndTime = req.body.end_time;
    let toDay = new Date();
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    request.end_time = new Date(request.end_time);
    request.start_time = new Date(request.end_time);
    if (toDay.getDate() === request.end_time.getDate() && toDay.getMonth() == request.end_time.getMonth()) {
        request.start_time.setDate(request.end_time.getDate() - 1);
        request.start_time.setHours(23);
        request.start_time.setMinutes(58);
        sameDay = true;
    } else {//for same day
        request.end_time.setDate(request.end_time.getDate() - 1);
        request.start_time.setDate(request.start_time.getDate() - 1);
        request.start_time.setHours(00);
        request.start_time.setMinutes(01);
        sameDay = false;
    }
    request.start_time = request.start_time.getTime();
    request.end_time = request.end_time.getTime();
    let odo;
    reportService.getOdometer(request, (err, response) => {
        if (err) {
            console.log('odometer err 1 ',err.message);
            return res.status(200).json(err);
        }/*else if (!response || response.status === 'ERROR') {
            return res.status(200).json(response);
        }*/
        if (response && response.data && response.data[0] && response.data[0].odo) {
            odo = response.data[0].odo;
        }
        if (!sameDay) {
            request.end_time = new Date(actaulEndTime);
            request.start_time = new Date(actaulEndTime);
            request.start_time.setHours(00);
            request.start_time.setMinutes(01);
        }
        if ((request.end_time - request.start_time) / 60000 < 5) {//less than 5 min
            request.start_time = new Date(request.start_time);
            request.start_time.setMinutes(request.start_time.getMinutes() - 5);
        }
        reportService.getDistOdo(request, (err, resp) => {
            if (err) {
                return res.status(200).json(err);
            } else if (!resp || response.resp === 'ERROR') {
                console.log(' odometer ERROR ',resp);
                return res.status(200).json(resp);
            }
            //TODO for sinlge device only
            deviceService.processRawData(request.device_id, resp.data, function (err, das) {
                let cumDist = 0;
                for (let i = 0; i < das.length; i++) {
                    if ((das[i].distance / das[i].duration * 3.6 > 100) || (das[i].distance / das[i].duration * 3.6 < 3)) {
                        das[i].distance = 0;
                        das[i].drive = false;
                    } else if (das[i].distance < 250 && (das[i].distance / das[i].duration * 3.6 < 10)) {
                        das[i].distance = 0;
                        das[i].drive = false;
                    } else {
                        cumDist = cumDist + das[i].distance;
                    }
                }
                if (resp.data && resp.data[resp.data.length - 1]) {
                    response.data = resp.data[resp.data.length - 1];
                } else {
                    response.data = {};
                }
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                if (!odo && cumDist) {
                    response.data.odo = cumDist;
                } else if (odo) {
                    response.data.odo = cumDist + odo;
                }
                //console.log(' odometer resp ',response);
                return res.status(200).json(response);
            });
        });

    });
});

router.post("/_haltSummary", function (req, res, next) {
    let request = req.body;
    if (!request.device_id) {
        let resp = resquest;
        resp.status = 'ERROR';
        resp.message = 'device id not found';
        return res.status(200).json(resp);
    }
    console.log('haltView start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    request.start_time = new Date(request.start_time).getTime();
    request.end_time = new Date(request.end_time).getTime();
    request.download = true;

    deviceService.getAggregatedDASVForHalts(request, (err, resData) => {
        let response = {};
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        response.data = resData;
        if (response.status === 'ERROR') {
            return res.status(200).json(response);
        }
        response.timezone = request.timezone;
        //return res.status(200).json(response);
        excelService.getHaltSummryReport(response, obj => {
            response.data = obj.url;
            return res.status(200).json(response);
        });
    });
});

router.post("/parking", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    request.reportType = request.reportType || 'report_parking';
    request.client = 'web';
    if ((request.device_id instanceof Array) && request.device_id.length < 5) {
        deviceService.getPlaybackV4ReportAsync(request)
            .then(resp => {
                response = resp;
                response.reg_no = request.regVeh && request.regVeh[0] && request.regVeh[0].reg_no;
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
            if(request.login_uid == 'annu@ispat') {
                excelService.getParkingReportWCPL(response, obj => {
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            } else if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
                excelService.getParkingReport(response, obj => {
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }
            else{
                return res.status(200).json(response);
            }
        });
    } else {
        deviceService.getParkingReportAsync(request.device_id, request.start_time, request.end_time, request.minimum_time_in_mins, "web")
            .then(resp => {
                response = resp;
                response.reg_no = request.regVeh && request.regVeh[0] && request.regVeh[0].reg_no;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
            })
            .then(() => {
                //return landmarkService.injectLandmarkInAdasAsync(request.selected_uid || request.login_uid, response.data);
                return;
            })
            .then(() => {
                if (response.status === 'ERROR') {
                    return res.status(500).json(response);
                }
                if(request.login_uid == 'annu@ispat') {
                    excelService.getParkingReportWCPL(response, obj => {
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
                }else if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
                    excelService.getParkingReport(response, obj => {
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
                }else{
                    return res.status(200).json(response);
                }
            });
    }

});

router.post("/activity", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('activity start time ', new Date());
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
    request.idling = false;
    if ((request.device_id instanceof Array) && request.device_id.length < 5) {
        deviceService.getPlaybackV4ReportAsync(request)
            .then(resp => {
                response = resp;
                response.reg_no = request.regVeh && request.regVeh[0] && request.regVeh[0].reg_no;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                response.status = 'OK';
            }).then(() => {
                if(!response.data || !Object.keys(response.data).length){
                    response.status = "ERROR";
                    response.message = "No data";
                }
            if (response.status === 'ERROR') {
                return res.status(500).json(response);
            }
            if(request.login_uid == 'kd' && request.download == true){
                excelService.getActivityReport(response, obj => {
                    min = new Date() - stdt;
                    console.log('report data resp  ', min / 60000);
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else if((request.login_uid == 'DGFCRHM' || request.login_uid == 'DGFC') && request.download == true ){
                    excelService.getActivityReport2(response, obj => {
                        min = new Date() - stdt;
                        console.log('report data resp  ', min / 60000);
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
            }else if(request.download == true ){
                excelService.getActivityReport(response, obj => {
                    min = new Date() - stdt;
                    console.log('report data resp  ', min / 60000);
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }
            else{
                return res.status(200).json(response);
            }
        });
    } else {
        deviceService.getActivityReportV2Async(request.device_id, request.start_time, request.end_time, 'web', false)
            .then(resp => {
                min = new Date() - stdt;
                console.log('report data resp  ', min / 60000);
                response = resp;
                console.log(response);
                response.reg_no = request.regVeh && request.regVeh[0] && request.regVeh[0].reg_no;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
            })
            .then(() => {
                if (response.status === 'ERROR') {
                    return res.status(200).json(response);
                }
                if(request.login_uid == 'kd' && request.download == true){
                    excelService.getActivityReport(response, obj => {
                        min = new Date() - stdt;
                        console.log('report data resp  ', min / 60000);
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
                }else if(request.login_uid == 'DGFC' && request.download == true){
                    excelService.getActivityReport2(response, obj => {
                        min = new Date() - stdt;
                        console.log('report data resp  ', min / 60000);
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
                }else{
                    return res.status(200).json(response);
                }
            });
    }
});
//trip overview report
router.post("/driver_activity", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time driver_activity', new Date());
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
    if ((request.device_id instanceof Array) && request.device_id.length < 5) {
        request.getLandmark = true;
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
            if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true){
                excelService.getDriverActivityReport(response, obj => {
                    min = new Date() - stdt;
                    console.log('report data resp  ', min / 60000);
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else{
                return res.status(200).json(response);

            }

        });
    }
});

router.post("/driver_day_activity", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
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
    if ((request.device_id instanceof Array) && request.device_id.length < 5)  {
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
            if(request.login_uid == 'DGFC' || request.login_uid == 'kd' || request.download == true) {
                excelService.getDriverDayWiseActivityReportVertically(response, obj => {
                    min = new Date() - stdt;
                    console.log('report data resp  ', min / 60000);
                    response.url = obj.url;
                    return res.status(200).json(response);
                });
            }else{
                return res.status(200).json(response);
            }
        });
    }
});

router.post("/vehicle_exceptions", function (req, res) {//new version
    let request = req.body;
    console.log('start time ', new Date());
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
        device = request;
        let aAlertsResp = [];
        deviceService.processRawDataAsync(request.device_id, resp.data)
            .then(function (das) {
                device.data = das;
                return BPromise.promisify(fillAddressIfRequired)(device);
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
                lastDr = aAlLast.data[0];
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
                aDeviceAlerts = aAl.data;

                for (let i = 0; i < device.data.length; i++) {
                    device.data[i].rfid = lastHaltRfid;
                    device.data[i].driver = lastHaltDriver;
                    device.data[i].code = 'Excessive Idle';
                    for (a = 0; a < aAl.data.length; a++) {
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
            let allowedCode = ['power_cut', 'sos', 'emergency', 'ha', 'hb', 'rt','nd','over_speed','idle'];
            for (k = 0; k < aAlLastAll.data.length; k++) {
              /*  if (allowedCode.indexOf(aAlLastAll.data[k].code) == -1) {
                    aAlLastAll.data.splice(k, 1);
                    k--;
                } else {*/
                    aAlLastAll.data[k].address = aAlLastAll.data[k].location && aAlLastAll.data[k].location.address;
                    aAlertsResp.push(aAlLastAll.data[k]);
               // }
            }
            response = device;
            response.data = aAlertsResp;
            if (request.download) {
                excelService.getVehicleExceptionReport(response, obj => {
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else {
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
            return res.status(200).json(response);
        }
            });
    });
});

router.post("/detailAnalysis", function (request, res) {

    request.body.isDetailed = true;
    deviceService.getPlaybackV4ReportAsync(request.body)
        .then(resp => {
            if(resp.data && Object.keys(resp.data)[0]){
                let imei = Object.keys(resp.data)[0];
                excelService.detailAnalysisRpt(resp.data[imei], obj => {
                    return res.status(200).json({
                        message: "Report Successfully Created",
                        url: obj.url
                    });
                });
            }else{
                return res.status(200).json({
                    message: "No data Found",
                });
            }
        });
});

router.post("/tracksheet", function (req, res, next) {
    let request = req.body;
    console.log('start time ', new Date());
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
    request.feature = 'tracksheet';
    gpsgaadiService.getTracksheetDataForLMS(request, response => {
        //response = otherUtils.pruneEmpty(response);
        if(res.headersSent){
            //return res.status(200).json(response);
        }else{
            return res.status(200).json(response);
        }
    });
});

router.post("/devices", function (req, res, next) {
    let request = req.body;
    console.log('start time ', new Date());
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
    request.request = 'gpsgaadi_by_uid';
    request.project = request.project || {device_type:1,imei:1}
    gpsgaadiService.getGpsGaadiForTripBasedGps(request, response => {
        //response = otherUtils.pruneEmpty(response);
        if(res.headersSent){
            //return res.status(200).json(response);
        }else{
            return res.status(200).json(response);
        }
    });
});
router.post("/combinedHalts", function (req, res, next) {//new version
    let request = req.body;
    console.log('combinedHalts ', new Date());
    let N = 3;
    //24 * 60 * 60 * 1000 = 86400000
    let tDiffInDays = (new Date(request.start_time).getTime() - new Date(request.start_time).getTime())/86400000;
    if(tDiffInDays > N){
        oResp = {'status':"ERROR","message":"Please select less than "+ N + "Days"};
        return res.status(200).json(response);
    }
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    request.reportType = request.reportType || 'report_combined_halts';
    request.client = 'web';
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
            return res.status(500).json(response);
        }
        excelService.getCombinedHaltsReport(response, obj => {
            delete response.combinedData;
            response.data = obj.url;
            return res.status(200).json(response);
        });
    });
});

//beat  report
router.post("/__beat_analysis", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time beat_analysis', new Date());
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
    let oQuery = {"reg_no": request.reg_no, "row_count": 1, "no_of_docs": 1, "skip": 1, "sort": {"_id": -1}};
    addressService.getBeatFromGeographyAsync(oQuery).then(function (beat) {
        if(!beat){
            let respp = {status:'ERROR',message:'Beat not found for vehicle '+ request.reg_no};
            return res.status(200).json(respp);
        }else {
            request.beat = beat;
            let response = {};
            reportService.analyseBeat(request,function(err,resp){
                response = resp;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.user_id = request.selected_uid ||  request.login_uid || 'kamalups';
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                response.created_at = new Date();
                if(request.download){
                    excelService.getBeatReport(response, obj => {
                        response.data = obj.url;
                        return res.status(200).json(response);
                    });
                }else{
                    response = resp;
                    return res.status(200).json(response);
                }

            });
        }
    });
});

router.post("/beat_analysis", function (req, res, next) {//new version
    let request = req.body;
    console.log('start time beat_analysis', new Date());
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
    reportService.beatCacheReport(request,function(err,resp){
        response = resp;
        response.device_id = request.device_id;
        response.login_uid = request.login_uid;
        response.user_id = request.selected_uid ||  request.login_uid || 'kamalups';
        response.start_time = request.start_time;
        response.end_time = request.end_time;
        response.timezone = request.timezone;
        response.created_at = new Date();
        if(request.download){
            excelService.getBeatReportCache(response, obj => {
                response.data = obj.url;
                return res.status(200).json(response);
            });
        }else{
            response = resp;
            return res.status(200).json(response);
        }

    });
});

router.post("/idealing", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('idealing start time ', new Date());
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
    request.idling = true;
    if ((request.device_id instanceof Array) && request.device_id.length < 2) {
        deviceService.getIdleReportAsync(request)
            .then(resp => {
                response = resp;
                response.reg_no = request.regVeh && request.regVeh[0] && request.regVeh[0].reg_no;
                response.device_id = request.device_id;
                response.login_uid = request.login_uid;
                response.start_time = request.start_time;
                response.end_time = request.end_time;
                response.timezone = request.timezone;
                response.status = 'OK';
            }).then(() => {
                if(!response.data || !Object.keys(response.data).length){
                    response.status = "ERROR";
                    response.message = "No data found";
                }
            if (response.status === 'ERROR') {
                return res.status(500).json(response);
            }
            if(request.login_uid == 'DGFC' || request.download == true){
                excelService.getIdleReport(response, obj => {
                    min = new Date() - stdt;
                    console.log('report data resp  ', min / 60000);
                    response.data = obj.url;
                    return res.status(200).json(response);
                });
            }else{
                return res.status(200).json(response);
            }
        });
    }else{
        return res.status(200).json({status:'ERROR',message:'One device at a time'});
    }
});

router.post("/vehicle_summary", function (req, res) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    deviceService.getVehicleSummaryAsync(request)
        .then(resp => {
            min = new Date() - stdt;
            console.log('report data resp  ', min / 60000);
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        }).then(() => {
            if (response.status === 'ERROR') {
                return res.status(200).json(response);
            }
           //return res.status(200).json(response);
            excelService.getVehicleSummaryReport(response, obj => {
                min = new Date() - stdt;
                console.log('report data resp  ', min / 60000);
                response.data = obj.url;
                return res.status(200).json(response);
            });
        })
});

router.post("/entry_exit", function (req, res) {
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('start time ', new Date());
    if (request.device_id instanceof Array) {
        let tempD = [];
        for (let k = 0; k < request.device_id.length; k++) {//remove null imeis
            if (request.device_id[k] && request.device_id[k].toString().length < 16) {
                tempD.push(request.device_id[k]);
            }
        }
        request.device_id = tempD;
    }
    //request.imei = request.device_id
    request.type = 'geofence';
    request.row_count = 5000;
    //request.geofence = true;
     notificationService.downloadNotifications(request, response => {
        return res.status(200).json(response);
    });
});

router.post("/idleSummary", function (req, res, next) {//new version
    let request = req.body;
    let stdt = new Date();
    let min;
    console.log('idleSummary start time ', new Date());
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
    request.idling = true;
    request.idlingOnly = true;
    deviceService.getIdleSummaryAsync(request)
        .then(resp => {
            min = new Date() - stdt;
            console.log('report data resp  ', min / 60000);
            response = resp;
            response.device_id = request.device_id;
            response.login_uid = request.login_uid;
            response.start_time = request.start_time;
            response.end_time = request.end_time;
            response.timezone = request.timezone;
        }).then(() => {
            if (response.status === 'ERROR') {
                return res.status(200).json(response);
            }
           //return res.status(200).json(response);
            excelService.getVehicleIdleSummaryReport(response, obj => {
              //  min = new Date() - stdt;
               // console.log('report data resp  ', min / 60000);
                response.data = obj.url;
                return res.status(200).json(response);
            });
        })
});

function fillAddressIfRequired(adas, callback) {
    async.eachSeries(adas.data, function (datum, done) {
        BPromise.resolve()
            .then(function () {
                if (datum.start_addr) return BPromise.resolve(datum.start_addr);
                if (!datum.start || !datum.start.latitude) return BPromise.resolve(" ");
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
};
module.exports = router;
