const request = require('request');
const winston = require('./logger');
const database = require('../config').database;
winston.info("enable sms : ", database.smsEnabled);
const oSMS = {
	url: "https://control.msg91.com/api/sendhttp.php?",
	authKey: "90583AUN4S4EKLn755dcb201",
	sender: 'FTruck',
	mobile: 9535888738,
	message: 'Test SMS bt gpsgaadi: ',
	route: 4,
	unicode: 1,
	response: 'json',
	country: 91

};
function generateOtp() {
	const newOtp = Math.floor(Math.random() * 90000) + 10000;
	return newOtp;
}
module.exports.generateOtp = generateOtp;
function sendSMS(mobile, message) {
	oSMS.mobile = mobile;
	oSMS.message = message;
	const smsUrl = oSMS.url + "authkey=" + oSMS.authKey + "&sender=" + oSMS.sender + "&route=" + oSMS.route + "&unicode=" + oSMS.unicode + "&country=" + oSMS.country + "&response=" + oSMS.response + "&mobiles=" + oSMS.mobile + "&message=" + oSMS.message;
	winston.info(smsUrl);
	if (database.smsEnabled) {
		request(smsUrl, function (error, response, body) {
			if (!error && (response.statusCode < 400)) {
				winston.info("SMS " + body, response.statusCode);
			} else {
				winston.error("failed SMS ", error);
			}
		});
	}
	return 1;
}
module.exports.sendSMS = sendSMS;
module.exports.verifyOTP = function (otp, savedOtp) {
	winston.info('in verify otp service', otp, savedOtp);
	if (otp === savedOtp) {
		return {"verified": true, "message": "Your OTP is verified"};
	} else {
		return {"verified": false, "message": "Your OTP does not match. Please re-enter or request a new OTP."};
	}
};
module.exports.resendSMS = function (mobile, message) {
	const newOtp = generateOtp();
	// const cnt = sendSMS(mobile,message);
	return newOtp;
};
