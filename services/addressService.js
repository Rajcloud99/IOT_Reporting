const request = require('request');
const async = require('async');
const BPromise = require('bluebird');

const osmIp = '52.220.18.209';
//52.220.18.209/reverse?format=json&lat=18.795154571533203&lng=77.5494384765625&zoom=18&addressdetails=0
exports.getAddressFromServer = function(ip, lat, lng, callback) {
	//const url = "http://"+ip+"/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18&addressdetails=0";
    const url = "http://13.229.178.235:4242/reverse?lat=" + lat + "&lon=" + lng;
	request(url, {
		timeout: 5000
	}, function (error, response, body) {
		if (error) {
			// winston.info(error);
			return callback(error);
		}
		try {
			body = JSON.parse(body);
			callback(error, body.display_name);
		} catch (err) {
			callback(err);
		}

	});
};

exports.getAddress = function (lat, lng, callback) {
	exports.getAddressFromServer(osmIp, lat, lng, callback);
};


exports.getAlertsFromGeography = function (query, callback) {
	if (process.env.NODE_ENV === 'servertest') return callback(null, null);
	//const url = "http://localhost:4242/alert/get";
	const url = "http://13.229.178.235:4242/alert/get";
	var options = {
		method: 'POST',
		url: url,
		headers:
			{
				'content-type': 'application/json'
			},
		body: query,
		json: true
	};

	request(options, function (error, response, body) {
		if (error) {
			throw new Error(error);
			return callback(error);
		}
		if(body && body.data && body.data){
			return callback(null, body.data);
		}else{
			return callback(null, '');
		}
	});
};

// exports.getAddressFromArray = function(latlngs, callback) {
//     const res = {};
//     let tot = latlngs.length;
//     let aerr = 0;
//     async.eachLimit(latlngs, 30, function(loc, done) {
//         // if(loc.addr) {
// 	     //    res[loc.imei] = loc.addr;
//         //     return done();
//         // }
//         BPromise.promisify(exports.getAddress)(loc.lat, loc.lng)
//             .then(function(addr) {
//                 res[loc.imei] = addr;
//                 done();
//             })
//             .error(function(err) {
//                 aerr++;
//                 done();
//             });
//     }, function(err) {
// 	    winston.info('addr fetch err', aerr, '/', tot);
//         callback(err, res);
//     });
// };

exports.fillAddressForStart = function (data, callback) {
	async.eachLimit(data, 100, function (datum, done) {
		BPromise.promisify(exports.getAddress)(datum.start.latitude, datum.start.longitude)
			.then(function (addr) {
				datum.start_addr = addr;
				done();
			}).error(function (err) {
			done();
		});
	}, function (err) {
		callback(err, data);
	});
};

exports.fillAddressForStop = function (data, callback) {
	async.eachLimit(data, 100, function (datum, done) {
		if (!datum.stop) return done();
		BPromise.promisify(exports.getAddress)(datum.stop.latitude, datum.stop.longitude)
			.then(function (addr) {
				datum.stop_addr = addr;
				done();
			}).error(function (err) {
			done();
		});
	}, function (err) {
		callback(err, data);
	});
};

exports.getLandmarkFromGeography = function (query, callback) {
	if (process.env.NODE_ENV === 'servertest') return callback(null, null);
	//const url = "http://localhost:4242/landmark/get";
	const url = "http://13.229.178.235:4242/landmark/get";

	var options = {
		method: 'POST',
		url: url,
		headers:
			{
				'content-type': 'application/json'
			},
		body: query,
		json: true
	};

	request(options, function (error, response, body) {
		if (error) {
			throw new Error(error);
			return callback(error);
		}
		if(body && body.data && body.data[0]){
			return callback(null, body.data[0]);
		}else{
			return callback(null, '');
		}
	});
};
exports.getLandmarkFromGeographyMaulti = function (query, callback) {
	if (process.env.NODE_ENV === 'servertest') return callback(null, null);
	//const url = "http://localhost:4242/landmark/get";
	const url = "http://13.229.178.235:4242/landmark/get";

	var options = {
		method: 'POST',
		url: url,
		headers:
			{
				'content-type': 'application/json'
			},
		body: query,
		json: true
	};

	request(options, function (error, response, body) {
		if (error) {
			throw new Error(error);
			return callback(error);
		}
		if(body && body.data){
			return callback(null, body.data);
		}else{
			return callback(null, '');
		}
	});
};
exports.getBeatFromGeography = function (query, callback) {
	if (process.env.NODE_ENV === 'servertest') return callback(null, null);
	const url = "http://13.229.178.235:4242/beat/get";

	var options = {
		method: 'POST',
		url: url,
		headers:
			{
				'content-type': 'application/json'
			},
		body: query,
		json: true
	};

	request(options, function (error, response, body) {
		if (error) {
			throw new Error(error);
			return callback(error);
		}
		if(body && body.data && body.data[0]){
			return callback(null, body.data[0]);
		}else{
			return callback(null, '');
		}
	});
};

/*
let query = {
	imei:[862549043578478],
	code:['rfid']
};

exports.getAlertsFromGeography(query,function(err,resp){
	console.log(err);
});
*/
