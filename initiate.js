//process.env.NODE_ENV = "production"; //please comment this before pushing
// process.env.NODE_ENV = 'servertest';

const config = require('./config');
const database = config.database;
const bodyParser = require('body-parser');
const httpLogger = require('morgan')('dev');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const fileApp = express();
const activeusersmanager = require('./utils/activeusersmanager');
const winston = require('./utils/logger');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const receivermanager = require('./utils/receivermanager');
const AuthorizationManager = require('./utils/authorizationmanager');
const socketmanager = require('./utils/socketmanager');
const emailUtil = require('./utils/emailUtil');
const authUtil = require('./utils/authUtil');

global.mongoose = require('mongoose');
global.Promise = require('bluebird');
const feedtype = config.feedtype;
const notifService = Promise.promisifyAll(require('./services/sendNotificationService'));

winston.info('enable_sms', database.enable_sms);
winston.info('enable_scheduler', database.enable_scheduler);
winston.info('enable_email', database.enable_email);


config.projectHome = __dirname;

activeusersmanager.loadAllUsersAsync().then(function (count) {
    console.log('Loaded all users', count);
});
activeusersmanager.loadAllDevicesAsync().then(function (count) {
    console.log('Loaded all devices', count);
});

app.use(httpLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

fileApp.use(httpLogger);
fileApp.use(bodyParser.json());
fileApp.use(bodyParser.urlencoded({
    extended: false
}));
fileApp.use(cookieParser());
fileApp.use(express.static(__dirname + '/files'));
fileApp.use('/api/mobile', require('./controllers/mDevicesController'));
fileApp.listen(8080);

io.on('connection', function (socket) {
    socket.authorizationmanager = new AuthorizationManager();
    socketmanager.manage(socket);
});

function exitHandler(options, err) {
    if (options.sigint) {
        winston.info("called exit handler with sigint");
    }
    if (options.exception || options.rejection) {
        winston.error("called exit handler with ", options.exception ? 'exception' : 'rejection', err.stack);

        if (database.enable_server_checks) {
            if (config.isProductionServer || config.isTestServer || config.isDevelopServer) {
                emailUtil.mailToRepoOwners("Called exit handler with " + (options.exception ? 'exception ' : 'rejection ') + '\n' + err.stack, function (error, info) {
                });
            }
        }
    }
    setTimeout(() => {
        process.exit();
    }, 3000);
}

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {sigint: true}));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exception: true}));
//catches unhandled rejections
process.on('unhandledRejection', exitHandler.bind(null, {
    rejection: true
}));

winston.info('NODE_ENV', process.env.NODE_ENV);

http.listen(5001, function () {
    winston.info('listening on : 5001');
});

const CronJob = require('cron').CronJob;
const job = new CronJob({
    cronTime: '00 */1 * * * *',
    onTick: function () {
        receivermanager.sendHeartbeat();
    },
    start: true
});

function connectReceiverForAlerts(){
    //commet
    receivermanager.sendMessage(862549043539686, 'ais140', feedtype.alerts);
}
if (config.isTestServer){
    const jobAlert = new CronJob({
        cronTime: '00 */3 * * * *',
        onTick: connectReceiverForAlerts,
        start: true
    });
}

// if (config.isTestServer) {
// 	const ua = require('./updateAddress');
//
// 	const abrjob = new CronJob({
// 		cronTime: '00 */15 * * * *',
// 		onTick: function () {
// 			ua.update('abr', () => {
// 				ua.update('deepak1', () => {
// 					ua.update('transcargoindia');
// 				});
// 			});
// 		},
// 		start: true
// 	});
// }

require('./httpServer');
require('./locationServer');
