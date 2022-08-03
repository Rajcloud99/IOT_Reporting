/**
 * @Author: bharath
 * @Date:   2016-11-30
 */

const BPromise = require('bluebird');
const gps = BPromise.promisifyAll(require('../model/gps'));
const router = require('express').Router();
const builder = require('xmlbuilder');
const async = require('async');
const dateUtil = require('../utils/dateutils');
const Device = BPromise.promisifyAll(require('../model/device'));

router.post("/getLocationsFromImei", function (req, res, next) {
	gps.getCurrentLocationsFromImeiAsync(req.body.device_ids)
		.then(function (locations) {
			return res.status(200).json({
				"status": "OK",
				"message": "found data",
				"data": locations
			});
		}).error(next);
});

router.post("/getLocationFromRegno", function (req, res, next) {
	gps.getCurrentLocationFromRegNoAsync(req.body.reg_no)
		.then(function (locations) {
			return res.status(200).json({
				"status": "OK",
				"message": "found data",
				"data": locations
			});
		}).catch(function (err) {
		return res.status(200).json({
			"status": "ERROR",
			"message": err.toString()
		});
	});
});

router.post("/locate", function (req, res, next) {
	const vehs = req.body;
	const resp = [];
	async.eachSeries(vehs, function (veh, done) {
		const dt = new Date(veh.StartDate).getTime();
		gps.getImeiAsync(veh.VehicleNo)
			.then(function (imei) {
				return gps.getGPSDataBetweenTimeAsync(imei, dt - 60 * 1000, dt + 60 * 1000);
			})
			.then(function (data) {
				let diff = 10000000000;
				let index = 0;
				for (let i = 0; i < data.length; i++) {
					const gps = data[i];
					gps.datetime = gps.datetime.getTime();
					const thisDiff = dt - gps.datetime >= 0 ? dt - gps.datetime : gps.datetime - dt;
					if (thisDiff < diff) {
						diff = thisDiff;
						index = i;  
					}
				}
				resp.push({
					reg_no: veh.VehicleNo,
					lat: data[index].lat,
					lng: data[index].lng
				});
			})
			.error(function (err) {
			})
			.then(done);
	}, function (err) {
		return res.status(200).send('http://tracking.gpsgaadi.com/#!/sharedLocations?data=' + JSON.stringify(resp));
	});

});

router.get("/getLocation", function (req, res, next) {
	let vehs = req.query.vehicle.split(',');
	// if(!Array.isArray(vehs)) vehs = [vehs];

	const resp = [];
	const device_ids = [];
	async.eachSeriesAsync(vehs, function (veh, done) {
		gps.getImeiAsync(veh)
			.then(function (imei) {
				device_ids.push(imei);
			})
			.error(function (err) {
			})
			.then(done);
	})
		.then(function () {
			return gps.getCurrentLocationsFromImeiAsync(device_ids);
		})
		.then(function (locations) {
			for (let i = 0; i < locations.length; i++) {
				let loc = locations[i];
				resp.push({
					reg_no: loc.reg_no,
					lat: loc.lat,
					lon: loc.lng,
					Speed: loc.speed,
					Tracktime: dateUtil.getDMYHMS(loc.datetime),
					Location: loc.address
				});
			}

			const xml = builder.create('vtsdata', {encoding: 'UTF-8'});

			for (let i = 0; i <= resp.length; i++) {
				const item = xml.ele('data');
				for (let key in resp[i]) {
					item.att(key, resp[i][key]);
				}
			}

			// xml.end({ pretty: true});

			res.set('Content-Type', 'text/xml');

			return res.status(200).send(xml.end({pretty: true}));
		})
		.error(function (err) {
			const xml = builder.create('vtsdata', {encoding: 'UTF-8'});
			const item = xml.ele('data');
			item.att('Vehicleno', "Invalid Vehicleno");

			res.set('Content-Type', 'text/xml');
			return res.status(200).send(xml.end({pretty: true}));
		});
});

router.post("/get_nearest_vehicle_for_point", function(req,res,next){
   let lat = req.query.lat;
   let lng = req.query.lng;
   let radius = req.query.radius;
   let user_id = req.query.user_id;

});

router.post("/get_nearest_geofence_for_point", function(req,res,next){
    let lat = req.query.lat;
    let lng = req.query.lng;
    let radius = req.query.radius;
    let user_id = req.query.user_id;
});

router.post("/get_nearest_landmark_for_point", function(req,res,next){
    let lat = req.query.lat;
    let lng = req.query.lng;
    let radius = req.query.radius;
    let user_id = req.query.user_id;
});

router.post("/getLocationFromVehNo", function (req, res, next) {
    gps.getCurrentLocationFromRegNoAsync(req.body.reg_no)
        .then(function (locations) {
        	if(locations){
        		delete locations.address;
        		delete locations.imei;
        		delete locations.acc_high;
        		locations.datetime = locations.positioning_time;
        		delete locations.positioning_time;
        		delete locations.location_time;
			}
            return res.status(200).json({
                "status": "OK",
                "message": "found data",
                "data": locations
            });
        }).catch(function (err) {
        return res.status(200).json({
            "status": "ERROR",
            "message": err.toString()
        });
    });
});
module.exports = router;
