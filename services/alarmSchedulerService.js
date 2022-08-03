/**
 * Created by Kamal on 03-01-2018.
 */
const BPromise = require('bluebird');
const AlarmSchedule = BPromise.promisifyAll(require('../model/alarmScheduler'));
const dateutils = require('../utils/dateutils');
const alarmService = require('../services/alarmService');
const Alarm = require('../model/alarm');
function getAlarmSchedule(request, callback) {
    if(!request.date){
        request.date = new Date();
        request.date.setHours(0);
        request.date.setMinutes(0);
        request.date.setSeconds(0);
        request.date.setMilliseconds(0);
    }
    if(!request.end_date){
        request.end_date = new Date(request.date);
        request.end_date.setDate(request.date.getDate()+30);
    }
    AlarmSchedule.getAlarmSchedule(request, function (err, res) {
        const response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
        } else if (!res) {
            response.message = 'Alarm not found';
        } else {
            response.status = 'OK';
            response.message = 'Alarm schedule found.';
            response.data = res.data;
            response.pageState = res.pageState;
        }
        return callback(response);
    });
}
function updateAlarmSchedule(request, callback) {
    AlarmSchedule.updateAlarmSchedule(request, function (err, res) {
        const response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
        } else if (!res) {
            response.message = 'Alarm update  failed';
            return callback(response);
        }else {//update custom alarm if today's schedule changed
            if(dateutils.getDDMMYYYY(request.date) == dateutils.getDDMMYYYY()){
                var oReq = {
                    selected_uid: request.selected_uid || request.user_id,
                    created_at : request.alm_created_at,
                    custom_schedules : request.schedules,
                    imei:request.imei
                };
                return alarmService.updateAlarm(oReq,callback);
            }else{
                response.status = 'OK';
                response.message =  'alarm update done succefully';
                response.atype = request.atype;
                response.imei = request.imei;
                response.vehicle_no = request.vehicle_no;
                return callback(response);
            }
        }

    });
}

function createAlarmSchedule(request, callback) {
    if(request.date){//date level only
        request.date = new Date(request.date);
        request.date.setHours(0);
        request.date.setMinutes(0);
        request.date.setSeconds(0);
        request.date.setMilliseconds(0);
    }
    AlarmSchedule.createAlarmSchedule(request, function (err, res) {
        const response = {status: 'ERROR', message: "", index: request.index};
        if (err) {
            response.message = err.toString();
            return callback(response);
        } else if (!res) {
            response.message = 'Alarm registration failed';
            return callback(response);
        } else {//update custom alarm if today's schedule changed
            if(dateutils.getDDMMYYYY(request.date) == dateutils.getDDMMYYYY()){
                var oReq = {
                    selected_uid: request.selected_uid || request.user_id,
                    created_at : request.alm_created_at,
                    custom_schedules : request.schedules,
                    imei:request.imei
                };
                return alarmService.updateAlarm(oReq,callback);
            }else{
                response.status = 'OK';
                response.message =  'alarm setup done succefully';
                response.atype = request.atype;
                response.imei = request.imei;
                response.vehicle_no = request.vehicle_no;
                return callback(response);
            }
        }
    });
}


function removeAlarmSchedule(request, callback) {
    AlarmSchedule.removeAlarmSchedule(request, function (err, res) {
        const response = {status: 'ERROR', message: ""};
        if (err) {
            response.message = err.toString();
            return callback(response);
        } else if (!res) {
            response.message = 'Alarm removal failed';
            return callback(response);
        } else {
            if(dateutils.getDDMMYYYY(request.date) == dateutils.getDDMMYYYY()){
                var oReq = {
                    selected_uid: request.selected_uid || request.user_id,
                    created_at : request.alm_created_at,
                    custom_schedules : request.schedules || [],
                    imei:request.imei
                };
                return alarmService.updateAlarm(oReq,callback);
            }else{
                response.status = 'OK';
                response.message = 'Alarm schedule removed succefully';
                return callback(response);
            }
        }

    });
}
module.exports.syncAlarmSchedule = function(cb){
    AlarmSchedule.getAlarmScheduleByDateAsync(new Date())
        .then(function (aSchedules) {
            if(aSchedules && aSchedules.length>0){
                Alarm.updateBulkAlarms(aSchedules,cb);
            }
        }).catch(cb)
};
module.exports.createAlarmSchedule = createAlarmSchedule;
module.exports.getAlarmSchedule = getAlarmSchedule;
module.exports.updateAlarmSchedule = updateAlarmSchedule;
module.exports.removeAlarmSchedule = removeAlarmSchedule;
