/**
 * Created by bharath on 07/06/17.
 */

process.env.TZ = 'Asia/Kolkata';
console.log(new Date());
const BPromise = require('bluebird');

BPromise.promisifyAll(require('./utils/externalip')).getIpAsync().then(ip => {

	let externalip = ip;
	let isProductionServer = false;
	let  isTestServer = false;
	if(ip === '52.77.111.181' || ip === '65.1.183.173'){
		isProductionServer = true;
	}else if(ip === '65.2.22.132'){
		isTestServer = true;
	}
	const isDevelopServer = (ip === '13.229.10.119');

	if (isDevelopServer) {
		process.env.NODE_ENV = 'develop';
	}

	global.config = require('./config');
	config.shouldWriteToDb = true;

	console.log('cassandra keyspace', ':', config.database.keyspace);

	config.externalip = externalip;
	config.isProductionServer = isProductionServer;
	config.isTestServer = isTestServer;
	config.isDevelopServer = isDevelopServer;

	console.log('Server Type', ':', (config.isProductionServer ? 'Production' : (config.isTestServer ? 'Test' : 'Develop')));

}).then(() => {
	require('./initiate.js');
});