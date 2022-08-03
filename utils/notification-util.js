const FCM = require('fcm-node');
const winston = require('../utils/logger');
//winston.info("FCM notification Enabled",database.fcmEnabled);
const sendFCMNotification = function (oNotification) {
	const message = {
		registration_ids: oNotification.registration_ids,
		//collapseKey: 'demo',
		//priority: oNotification.priority || 'high',
		//contentAvailable: oNotification.contentAvailable || true,
		//delayWhileIdle: oNotification.delayWhileIdle || true,
		//timeToLive: oNotification.timeToLive ||  108,
		//dryRun: true,
		//data: oNotification.data,
		notification: oNotification.notification
	};
	const sender = new FCM("AIzaSyD3rpjZUKDHMiceEAoEb8ZvmFuz68RXwis");
	// Now the sender can be used to send messages
	// winston.info('fcm',oNotification);
	if (true) {
		console.log(message);
		sender.send(message, function (err, response) {
			if (err) winston.error('err', err);
			else    console.log('success', response);
		});
	} else {
		winston.info('fcm notifications are disabled.');
	}
};
module.exports.sendFCMNotification = sendFCMNotification;
/*
 const oFCMNotif = {
 "notification": {
 "title": "Gefence Alert",
 "text": "KA03HQ4012 has entered in Kamal geozone."
 },
 "data": {
 "vehicle": "KA03HQ4012",
 "imei": 2131423424434343,
 "priority" : "low",
 "severity": "warning"
 },
 "registration_ids" : ["dXN6hpHBPd8:APA91bGwopSs-qBBw7AzzdI8pmpCpaemANkIyRoPYkYT9NQa6Ifx-ScnjTnlnKIko38SBf3PQaSm6Q1jTeXZeEX-RPMVEJ4JS9TsnKoMQZ3h4CLbpCw_q-ItpJSLHl5okhB64vGHfN8h"]
 };
 sendFCMNotification(oFCMNotif);
 */
