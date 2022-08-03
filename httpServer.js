/**
 * @Author: bharath
 * @Date:   2016-11-30
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const serverConfig = require('./config');
const winston = require('./utils/logger');
const cors = require('cors');

app.configureUtilities = function () {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: false
	}));
};

// Added to accept request from other ports.
app.configureHeaders = function () {
	app.all('*', function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS ,PATCH');
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Max-Age', '86400');
		res.header("Access-Control-Allow-Headers",
			"Origin, X-Requeted-With, Content-Type, Accept, Authorization, RBR, X-HTTP-Method-Override");
		next();
	});
};

app.configureRoutes = function () {
	const authUtil = require('./utils/authUtil');
	app.use('/api/user', require('./controllers/userController'));
    app.use('/api/reports', require('./controllers/reportController'));
    app.use('/api/mapmyindia', require('./controllers/mapmyindiaController'));
    app.use('/api/device',require('./controllers/deviceController'));
	app.use('/api/landmark', require('./controllers/landmarkController'));
	app.use('/api/alert', require('./controllers/alertController'));
	app.use('/api/geozone', require('./controllers/geozoneController'));
	app.use('/api/alarm', require('./controllers/alarmController'));

	app.all('/api/*', authUtil.authenticateRoutes, function (req, res, next) {
		next();
	});

    app.use('/api/location', require('./controllers/locationController'));
	app.use('/api/playback', require('./controllers/playbackController'));
	app.use('/api/mileage', require('./controllers/mileageController'));
};

app.initialize = function () {
	app.configureUtilities();
	app.use(cors());
	app.configureHeaders();
	app.configureRoutes();
}();

const server = app.listen(serverConfig.http_port, function () {
	winston.info("location api listening on port : " + serverConfig.http_port);
});
server.setTimeout(300000);
module.exports = app;
