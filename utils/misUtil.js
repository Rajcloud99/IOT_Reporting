const User = require('../model/user');
const gpsgaadiService = require('../services/gpsgaadiService');
const deviceService = require('../services/deviceService');
const excelService = require('../services/excelService');
const config = require('../config');
const mime = require('mime');
const misUtil = {};
const winston = require('../utils/logger');
const dateUtil = require('../utils/dateutils');
const emailUtil = require('../utils/emailUtil');
const async = require('async');

function findUsersWithReportSubscription(callback) {
	User.getUsersWithReportSubscription('kamal', function (err, response) {
		if (response) {
			callback(response);
		} else {
			winston.error("misUtil.js : some error in fetching users with report "
                + JSON.stringify(response));
		}
	});
}

misUtil.generateExcelMISAndMailToUsers = function (misType, timeFired) {
	findUsersWithReportSubscription(function (usersWithReportSubscription) {
		//winston.info("response :" + JSON.stringify(usersWithReportSubscription));
		const reqImitation = {};
		reqImitation.device_id = [];
		reqImitation.speed_limit = 90;
		reqImitation.minimum_time_in_mins = 10;
		reqImitation.client = "web";
		let datetimeStart;
		let datetimeEnd = timeFired;
		if (misType === "daily") {
			datetimeStart = dateUtil.getMorning(timeFired).getTime();
		} else if (misType === "weekly") {
			const dateNow = new Date(timeFired);
			dateNow.setDate(dateNow.getDate() - 6);
			dateNow.setHours(0);
			dateNow.setMinutes(0);
			dateNow.setSeconds(0);
			dateNow.setMilliseconds(0);
			datetimeStart = dateNow.getTime();
		} else if (misType === "monthly") {
			const dateNow = new Date(timeFired);
			dateNow.setMonth(dateNow.getMonth() - 1);
			dateNow.setHours(0);
			dateNow.setMinutes(0);
			dateNow.setSeconds(0);
			dateNow.setMilliseconds(0);
			datetimeStart = dateNow.getTime();
			dateNow.setMonth(dateNow.getMonth() + 1);
			dateNow.setDate(dateNow.getDate() - 1);
			datetimeEnd = dateNow.getTime();
		}
		reqImitation.start_time = datetimeStart;
		reqImitation.end_time = datetimeEnd;

		for (let i = 0; i < usersWithReportSubscription.length; i++) {
			(function (i) {
				User.getAllAssociatedDevicesForUser(usersWithReportSubscription[i].user_id, function (err, devices) {
					reqImitation.device_id = devices;
					reqImitation.login_uid = usersWithReportSubscription[i].user_id;
					reqImitation.selected_uid = usersWithReportSubscription[i].user_id;
					async.series([
						function (callback) {
							if ((misType === "daily" && usersWithReportSubscription[i].daily_track_sheet)) {
								const request = {};
								request.selected_uid = usersWithReportSubscription[i].user_id;
                                request.user_id = usersWithReportSubscription[i].user_id;
								request.all = true;
								gpsgaadiService.getGpsGaadiList(request, function (tracklist) {
									tracklist.selected_uid = request.selected_uid;
                                    tracklist.user_id = request.selected_uid;
									tracklist.misType = misType;
                                    tracklist.shown_fields = ['branch', 'reg_no', 'vehicle_type',
                                        'driver_name', 'status', 'addr', 'positioning_time', 'location_time',
                                        'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark',
                                        'nearest_landmark', 'geofence_status'];
                                    if (tracklist &&
                                        tracklist.status==="ERROR") {
                                        winston.error("misUtil.js : error in tracking sheet" + tracklist.message);
                                        return callback(null, {});
                                    }
                                    excelService.getTrackingSheetReport(tracklist, function (obj) {
										callback(null, obj);
									});
								});
							} else {
								callback(null, {});
							}
						}/*,
						function (callback) {
							if ((misType === "daily" && usersWithReportSubscription[i].daily_activity)) {
								deviceService.getActivityReport(reqImitation.device_id,
									reqImitation.start_time, reqImitation.end_time, reqImitation.client, true,
									function (err, response) {
                                        response.device_id = reqImitation.device_id;
                                        response.login_uid = reqImitation.login_uid;
                                        response.start_time = reqImitation.start_time;
                                        response.end_time = reqImitation.end_time;
                                        response.misType = misType;
                                        if (err) {
                                            winston.error("misUtil.js : error in activity "+ err);
                                            return callback(null, {});
                                        }
                                        if (response &&
                                            response.status === 'ERROR') {
                                            winston.error("misUtil.js : error in activity "+ response.message);
                                            return callback(null, {});
                                        }
										excelService.getActivityReport(response, function (obj) {
											callback(null, obj);
										});
									});
							} else {
								callback(null, {});
							}
						},
						function (callback) {
							if ((misType === "daily" && usersWithReportSubscription[i].daily_hault) ||
								(misType === "weekly" && usersWithReportSubscription[i].weekly_hault) ||
								(misType === "monthly" && usersWithReportSubscription[i].monthly_hault)
							) {
								deviceService.getParkingReport(reqImitation.device_id,
									reqImitation.start_time, reqImitation.end_time,
									reqImitation.minimum_time_in_mins, reqImitation.client,
									function (err, response) {
										response.device_id = reqImitation.device_id;
										response.login_uid = reqImitation.login_uid;
										response.start_time = reqImitation.start_time;
										response.end_time = reqImitation.end_time;
										response.misType = misType;
                                        if (err) {
                                            winston.error("misUtil.js : error in parking report "+ err);
                                            return callback(null, {});
                                        }
                                        if (response &&
                                            response.status === 'ERROR') {
                                            winston.error("misUtil.js : error in parking report "
                                                + response.message);
                                            return callback(null, {});
                                        }
										excelService.getParkingReport(response, function (obj) {
											callback(null, obj);
										});
									});
							} else {
								callback(null, {});
							}
						},
						function (callback) {
							if ((misType === "daily" && usersWithReportSubscription[i].daily_mileage) ||
								(misType === "weekly" && usersWithReportSubscription[i].weekly_mileage) ||
								(misType === "monthly" && usersWithReportSubscription[i].monthly_mileage)) {
								deviceService.getMileageReport(reqImitation.device_id,
									reqImitation.start_time, reqImitation.end_time, reqImitation.client,
                                    function (err, response) {
										response.device_id = reqImitation.device_id;
										response.login_uid = reqImitation.login_uid;
										response.start_time = reqImitation.start_time;
										response.end_time = reqImitation.end_time;
										response.misType = misType;
                                        if (err) {
                                            winston.error("misUtil.js : error in mileage report "+ err);
                                            return callback(null, {});
                                        }
                                        if (response &&
                                            response.status === 'ERROR') {
                                            winston.error("misUtil.js : error in mileage report "
                                                + response.message);
                                            return callback(null, {});
                                        }
										excelService.getMileageReport(response, function (obj) {
											callback(null, obj);
										});
									});
							} else {
								callback(null, {});
							}
						},
						function (callback) {
							if ((misType === "daily" && usersWithReportSubscription[i].daily_over_speed)
                                || (misType === "weekly" && usersWithReportSubscription[i].weekly_overspeed)) {
								deviceService.getOverspeedReport(reqImitation.device_id,
									reqImitation.start_time, reqImitation.end_time, reqImitation.speed_limit,
									reqImitation.client, function (response) {
										response.device_id = reqImitation.device_id;
										response.login_uid = reqImitation.login_uid;
										response.start_time = reqImitation.start_time;
										response.end_time = reqImitation.end_time;
										response.misType = misType;
                                        if (response &&
                                            response.status === 'ERROR') {
                                            winston.error("misUtil.js : error in overspeed report "
                                                + response.message);
                                            return callback(null, {});
                                        }
										excelService.getOverspeedReport(response, function (obj) {
											callback(null, obj);
										});
									});
							} else {
								callback(null, {});
							}
						}*/], function (err, result) {
						if(usersWithReportSubscription[i].emails){
                            sendEmailToUser(misType, reqImitation.start_time,
                                reqImitation.end_time, result, usersWithReportSubscription[i].emails);
						}

					});
				});
			})(i);
		}
	});
};

/** Model for attachments
 attachments = [ {
 filename : fileName ,
 path: fileAbsolutePath,
 contentType: contentType}]
 }**/

function sendEmailToUser(misType, start_time, end_time, arrObjFileData, emails) {
	if (misType && start_time && end_time &&
        emails && emails.length>0 && arrObjFileData && arrObjFileData.length>0) {
        const arrAttachments = [];
        for (let j = 0; j < arrObjFileData.length; j++) {
            // winston.info("arrObjFiledata : "+ JSON.stringify(arrObjFileData[j]));
            if (Object.keys(arrObjFileData[j]).length > 0) {
                arrAttachments.push({
                    filename: arrObjFileData[j].filename,
                    path: config.projectHome + '/files/' + arrObjFileData[j].dir + arrObjFileData[j].filename,
                    contentType: mime.getType(arrObjFileData[j].filename)
                });
            }
        }

        if (arrAttachments.length>0) {
            let mailOptions;
            if (misType === "daily") {
                mailOptions = {
                    to: emails,
                    from: 'GpsGaadi [System Generated] <futuretrucksakh@gmail.com>',
                    subject: 'GPSGaadi daily MIS Reports : ' + dateUtil.getDDMMYYYY(start_time), // Subject line
                    text: "Dear Customer, \n Please find attached monthly MIS reports." +
                    "To know more details, please login to your account with your username and password.\n" +
                    "Product Link : http://tracking.gpsgaadi.com \n Web Link : http://gpsgaadi.com",
                    html: "Dear Customer, <br> Please find attached daily MIS reports." +
                    "To know more details, please login to your account with your username and password.<br>" +
                    "Product Link : http://tracking.gpsgaadi.com <br> Web Link : http://gpsgaadi.com",
                    attachments: arrAttachments
                };
            } else if (misType === "weekly") {
                mailOptions = {
                    to: emails,
                    from: 'GpsGaadi [System Generated] <futuretrucksakh@gmail.com>',
                    subject: 'GpsGaadi weekly MIS reports : ' + dateUtil.getDDMMYYYY(start_time) + " to " + dateUtil.getDDMMYYYY(end_time), // Subject line
                    text: "Dear Customer, \n Please find attached monthly MIS reports." +
                    "To know more details, please login to your account with your username and password.\n" +
                    "Product Link : http://tracking.gpsgaadi.com \n Web Link : http://gpsgaadi.com",
                    html: "Dear Customer, <br> Please find attached weekly MIS reports." +
                    "To know more details, please login to your account with your username and password.<br>" +
                    "Product Link : http://tracking.gpsgaadi.com <br> Web Link : http://gpsgaadi.com",
                    attachments: arrAttachments
                };
            } else if (misType === "monthly") {
                mailOptions = {
                    to: emails,
                    from: 'GpsGaadi [System Generated] <futuretrucksakh@gmail.com>',
                    subject: 'GpsGaadi monthly MIS reports : ' + dateUtil.getDDMMYYYY(start_time) + " to " + dateUtil.getDDMMYYYY(end_time), // Subject line
                    text: "Dear Customer, \n Please find attached monthly MIS reports." +
                    "To know more details, please login to your account with your username and password.\n" +
                    "Product Link : http://tracking.gpsgaadi.com \n Web Link : http://gpsgaadi.com",
                    html: "Dear Customer, <br> Please find attached monthly MIS reports." +
                    "To know more details, please login to your account with your username and password.<br>" +
                    "Product Link : http://tracking.gpsgaadi.com <br> Web Link : http://gpsgaadi.com",
                    attachments: arrAttachments
                };
            }
            emailUtil.sendMailWithAttachments(mailOptions);
        }
    }
}

module.exports = misUtil;
