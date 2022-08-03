const nodemailer = require('nodemailer');
const config = require('../config');
const database = require('../config').database;
const winston = require('../utils/logger');
const constants = require('../constants');


/***create reusable transporter object using the default SMTP transport ***/
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'futuretrucksakh@gmail.com',
		pass: 'truckhunter'
	}
});

// var defaultMailOptions = {
// 	    from: 'GpsGaadi <futuretrucksakh@gmail.com>', // sender address
// 	    to: 'GpsGaadi <kamal@futuretrucks.in>', // list of receivers
// 	    subject: 'Greetings from GpsGaadi✔', // Subject line
// 	    text: 'Greetings fron GpsGaadi', // plaintext body
// 	    html: '<b>Hello Future Trucks✔</b>' // html body
// 	};

const sGreetings = '<b>Greetings from Future Ttrucks.<br>  <br> </b>';
const sSignatures = '<br> <br> <b> Best Regards <br> GpsGaadi <br> ' +
	'<a href=\"www.gpsgaadi.com\">www.gpsgaadi.com</a><br> Phone : +919891705019</b>';

function sendMail(oMailOptions, callback) {
	//winston.info(oMailOptions);
	if (database.enable_email) {
		transporter.sendMail(oMailOptions, function (error, info) {
			if (error) {
				return winston.info(error);
			}
			if (callback) {
				callback(error, info);
			}
		});
	}
}

/***oMailOptions would contain
 contentType = 'application/pdf' for pdf
 attachments = [{
	       	filename : fileName ,
	       	path: fileAbsolutePath,
	       	contentType: contentType}]
 ***/
function sendMailWithAttachments(oMailOptions) {
	const mailOptions = {
		to: oMailOptions.to,
		from: oMailOptions.from,
		subject: oMailOptions.subject,
		text: oMailOptions.text,
		html: oMailOptions.html,
		attachments: oMailOptions.attachments
	};
	sendMail(mailOptions);
}

module.exports.mailToRepoOwners = function (logText, callback) {
	const oMailOptions = {
		from: 'GpsGaadi <futuretrucksakh@gmail.com>', // sender address
		to: constants.repoOwnerEmails, // list of receivers
		subject: (config.isProductionServer ? 'Prod: ' : (config.isTestServer ? 'Test: ' : 'Develop:' )) + 'Gps Socket Server Issue', // Subject line
		text: logText, // plaintext body
	};
	sendMail(oMailOptions, callback);
};

function logEmailOptions() {
	winston.info("enable email :" + database.enable_email);
}
module.exports.sendMail = sendMail;
module.exports.sendMailWithAttachments = sendMailWithAttachments;
