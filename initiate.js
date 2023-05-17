const config = require('./config');
const bodyParser = require('body-parser');
const httpLogger = require('morgan')('dev');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const activeusersmanager = require('./utils/activeusersmanager');
const winston = require('./utils/logger');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const receivermanager = require('./utils/receivermanager');
const AuthorizationManager = require('./utils/authorizationmanager');
const socketmanager = require('./utils/socketmanager');
global.mongoose = require('mongoose');
global.Promise = require('bluebird');
const feedtype = config.feedtype;

winston.info('NODE_ENV', process.env.NODE_ENV);
config.projectHome = __dirname;

activeusersmanager.loadAllUsersAsync().then(function (count) {
    console.log('Loaded all users', count);
});
activeusersmanager.loadAllDevicesAsync().then(function (count) {
    console.log('Loaded all devices', count);
});

if (config.io_http && config.io_http.startServer) {
    app.use(httpLogger);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    io.on('connection', function (socket) {
        socket.authorizationmanager = new AuthorizationManager();
        socketmanager.manage(socket);
    });
    http.listen(config.io_http.port, function () {
        console.log('listening on : ' + config.io_http.port);
    });
} else {
    console.log('IO and http  service is NOT running ' + config.io_http.port);
}

if (config.fileApp && config.fileApp.startServer) {
    const fileApp = express();
    fileApp.use(httpLogger);
    fileApp.use(bodyParser.json());
    fileApp.use(bodyParser.urlencoded({
        extended: false
    }));
    fileApp.use(cookieParser());
    fileApp.use(express.static(__dirname + '/files'));
    fileApp.use('/api/mobile', require('./controllers/mDevicesController'));
    fileApp.use('/api/androidversion', require('./controllers/appVersionController'));
    fileApp.listen(config.fileApp.port);
    console.log('FileApp service is running on '+ config.fileApp.port);
}else{
    console.log('FileApp service is NOT running '+ config.fileApp.port);
}

if (config.receiverConnect && config.receiverConnect.startConn) {
    console.log('receiverConnect service is connected ' + config.receiverConnect.port);
    const CronJob = require('cron').CronJob;
    const job = new CronJob({
        cronTime: '00 */1 * * * *',
        onTick: function () {
            receivermanager.sendHeartbeat();
        },
        start: true
    });

    function connectReceiverForAlerts() {
        //commet
        receivermanager.sendMessage(862549043539686, 'ais140', feedtype.alerts);
    }
} else {
    console.log('receiverConnect service is NOT connected ' + config.receiverConnect.port);
}
if (config.reporting && config.reporting.startServer) {
    require('./httpServer');
}else {
    console.log('httpServer service is NOT connected ' + config.receiverConnect.port);
}

if (config.driver && config.driver.startServer) {
    require('./locationServer');
}else {
    console.log('locationServer service is NOT connected ' + config.receiverConnect.port);
}

