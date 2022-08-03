const BPromise = require('bluebird');
const Device = BPromise.promisifyAll(require('../model/device'));
const Gps = BPromise.promisifyAll(require('../model/gps'));
const dateutils = require('../utils/dateutils');
const geozoneCalculator = require('./geozoneCalculator');
const winston = require('../utils/logger');
const async = require('async');
const addressService = BPromise.promisifyAll(require('../services/addressService'));

function getRefinedADAS(request, callback) {
    let asyncTasks = [];
    let adasRefined, adas;

    if (new Date(request.start_time).getTime() < dateutils.getMorning(new Date()).getTime()) {
        asyncTasks.push(function (cb) {
            Device.getAdasRefinedNewAsync(request.device_id, request.start_time,
                new Date(request.end_time).getTime() < dateutils.getMorning(new Date()).getTime() ? request.end_time : dateutils.getMorning(new Date()))
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

    if (new Date(request.end_time).getTime() > dateutils.getMorning(new Date()).getTime()) {
        asyncTasks.push(function (cb) {
            Gps.getGPSDataBetweenTimeAsync(request.device_id,
                new Date(request.start_time).getTime() < dateutils.getMorning(new Date()).getTime() ? dateutils.getMorning(new Date()) : request.start_time,
                request.end_time)
                .then(function (res) {
                    return processRawDataAsync(request.device_id,res);
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
                    cb();
                });
        });
    }

    async.parallel(asyncTasks, function () {
        let res;
        let data = [];
        if (adasRefined) data = data.concat(adasRefined);
        if (adas) data = data.concat(adas);

        callback(null,data);
        /*
        BPromise.promisify(processADASReportV2)(data, isAddrReqd)
            .then(function (response) {
                res = response;
            })
            .error(function (err) {
            })
            .then(function () {
                callback(res && Object.keys(res).length <= 0 ? 'No data found' : null, res);
            });
        */
    });
}

function combineADASData(device, callback) {
    for (let i = 1; i < device.data.length; i++) {
        if (device.data[i].drive !== device.data[i - 1].drive) continue;
        if (new Date(device.data[i].start_time).getDate() !== new Date(device.data[i - 1].start_time).getDate()) continue;

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
        device.data.splice(i, 1);
        i--;
    }
    callback(null, true);
}

// clubs drive-stop-drive to drive
function clubDrivesAndStops(device, callback) {
    for (let i = 2; i < device.data.length; i++) {
        if (!device.data[i - 2].drive) continue;
        if (device.data[i - 1].drive) continue;
        if (!device.data[i].drive) continue;
        if (new Date(device.data[i].start_time).getDate() !== new Date(device.data[i - 1].end_time).getDate()) continue;

        if ((new Date(device.data[i - 2].end_time).getTime() - new Date(device.data[i - 1].start_time).getTime()) > 3 * 60 * 1000) continue;
        if ((new Date(device.data[i - 1].end_time).getTime() - new Date(device.data[i].start_time).getTime()) > 3 * 60 * 1000) continue;
        if (device.data[i - 1].duration > 10 * 60) continue;

        device.data[i - 2].end_time = device.data[i].end_time;
        device.data[i - 2].stop = device.data[i].stop;
        device.data[i - 2].stop_addr = device.data[i].stop_addr;

        device.data[i - 2].duration = parseInt((new Date(device.data[i].end_time).getTime() - new Date(device.data[i - 2].start_time).getTime()) / 1000);
        device.data[i - 2].distance += device.data[i].distance;
        device.data.splice(i - 1, 2);
        i--;
    }
    callback(null, true);
}

function processADASlotReport(request, callback) {
    let data = request.data;
    for (let i = 0; i < data.length; i++) {
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

    for (let i = 0; i < data.length; i++) {
        data[i].imei = parseInt(data[i].imei);
        if (!devices[data[i].imei]) {
            devices[data[i].imei] = {
                data: []
            };
        }
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
            return BPromise.promisify(calculateDatewiseSlotDist)(device,request.start_time,request.end_time);
        }).then(function () {
            return BPromise.promisify(combineADASData)(device);
        }).then(function () {
            //return;
            return BPromise.promisify(clubDrivesAndStops)(device);
        }).then(function () {
            //return;
            return BPromise.promisify(combineADASData)(device);
        }).then(function () {
            if (request.isAddrReqd) return BPromise.promisify(fillAddressIfRequired)(device);
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
                if (topSpeed < device.data[key].top_speed && device.data[key].top_speed < 90) {
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
function getSlotDate(slot_start,device_start_time){
    let slot_date = new Date(device_start_time);
    if(new Date(device_start_time).getHours() < new Date(slot_start).getHours()){
        slot_date.setDate(new Date(device_start_time).getDate() - 1);
    }
    return slot_date;
}
function calculateDatewiseSlotDist(device,start,end, callback) {
    let datewiseDistance = [];
    let datewiseRunningDur = [];
    let datewiseTopSpeed = [];
    let datewiseSlotsStart = [];
    let datewiseSlotsEnd = [];
    let startSlot,endSlot,slot_date;
    //define fix slots with dates
    for (let key in device.data) {
        slot_date = getSlotDate(start,device.data[key].start_time);
        if (!datewiseDistance[dateutils.getDDMMYYYY(slot_date)]) {
            datewiseDistance[dateutils.getDDMMYYYY(slot_date)] = 0;
            datewiseRunningDur[dateutils.getDDMMYYYY(slot_date)] = 0;
            datewiseTopSpeed[dateutils.getDDMMYYYY(slot_date)] = 0;
        }
        startSlot = new Date(slot_date);
        startSlot.setHours(new Date(start).getHours());
        startSlot.setMinutes(new Date(start).getMinutes());
        endSlot = new Date(slot_date);
        if(new Date(end).getHours() <= new Date(start).getHours()){
            endSlot.setDate(endSlot.getDate() + 1);
        }
        endSlot.setHours(new Date(end).getHours());
        endSlot.setMinutes(new Date(end).getMinutes());
        if(!datewiseSlotsStart[dateutils.getDDMMYYYY(slot_date)]){
            datewiseSlotsStart[dateutils.getDDMMYYYY(slot_date)] = startSlot;
        }
        if(!datewiseSlotsEnd[dateutils.getDDMMYYYY(slot_date)]){
            datewiseSlotsEnd[dateutils.getDDMMYYYY(slot_date)] = endSlot;
        }
        if((new Date(device.data[key].start_time) > startSlot) && (new Date(device.data[key].start_time) < endSlot)){
            datewiseDistance[dateutils.getDDMMYYYY(slot_date)] += device.data[key].distance;
            datewiseRunningDur[dateutils.getDDMMYYYY(slot_date)] += device.data[key].drive ? device.data[key].duration : 0;
            datewiseTopSpeed[dateutils.getDDMMYYYY(slot_date)] = datewiseTopSpeed[dateutils.getDDMMYYYY(slot_date)] > device.data[key].top_speed ? datewiseTopSpeed[dateutils.getDDMMYYYY(slot_date)] : device.data[key].top_speed;
        }
    }
    device.datewise_dist = [];
    for (let key in datewiseDistance) {
        device.datewise_dist.push({
            date: key,
            dist: datewiseDistance[key],
            dur: datewiseRunningDur[key],
            top_speed: datewiseTopSpeed[key],
            slot_start : datewiseSlotsStart[key],
            slot_end : datewiseSlotsEnd[key]
        });
    }
    callback(null, true);
}

function removeUnrealisticSpeeds(adas, callback) {
    for (let i = 0; i < adas.length; i++) {
        if (adas[i].distance / adas[i].duration * 3.6 > 150) {
            adas.splice(i, 1);
            i--;
        }
    }
    callback();
}

function predictOfflineDistance(adas, callback) {
    // callback(null, true);
    for (let i = 1; i < adas.length; i++) {
        if (new Date(adas[i].start_time).getDate() !== new Date(adas[i - 1].start_time).getDate()) continue;
        let dur = dateutils.getSecs(adas[i].start_time) - dateutils.getSecs(adas[i - 1].end_time);
        if (dur > 5) {
            let prediction = {};
            prediction.start_time = adas[i - 1].end_time;
            prediction.end_time = adas[i].start_time;
            prediction.imei = adas[i].imei;
            prediction.start = adas[i - 1].stop;
            prediction.stop = adas[i].start;
            if (!prediction.start || !prediction.stop) continue;
            prediction.distance = geozoneCalculator.getDistance(prediction.start, prediction.stop);
            prediction.duration = dur;
            prediction.idle_duration = 0;
            //prediction.drive = prediction.distance > 100;
            if(prediction.distance >100 && prediction.distance/dur*3.6 >3){
                prediction.drive = true;
            }else{
                prediction.drive = false;
                prediction.distance = 0;
            }
            //prediction.drive = prediction.distance/dur*3.6 > 1;//speed > 1
            prediction.top_speed = prediction.drive ? parseInt(prediction.distance/prediction.duration):0;
            if(prediction.top_speed > 90){
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
            done();
        });
    }, function (err) {
        callback(null, true);
    });
}

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
        if (activity.data[device].datewise_dist.length > 1) {
            shouldShowSummary = true;
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

            days[s][device].distance += days[dwd.date][device].distance;
            days[s][device].duration += days[dwd.date][device].duration;
            if(days[dwd.date][device].top_speed > days[s][device].top_speed && days[dwd.date][device].top_speed < 90){
                days[s][device].top_speed = days[dwd.date][device].top_speed;
            }
        }
    }
    // if(!shouldShowSummary) delete days[s];
    return days;
}

exports.getSlotActivityReport = function (request, callback) {
    let das = null;
    let overspeed = null;
    BPromise.promisify(getRefinedADAS)(request)
        .then(function (data) {
            request.data = data;
            return  BPromise.promisify(processADASlotReport)(request);
        })
        .then(function (res) {
            let response = {
                device_id: request.device_id,
                status: 'OK',
                data:res,
                message: "slot activity",
                start_time: request.start_time,
                end_time: request.end_time
            };
            callback(null, response);
        })
        .error(function (err) {
            console.log('err getSlotActivityReport',err.toString())
        });
};

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

