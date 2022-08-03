/**
 * @Author: kamal
 * @Date:   2018-10-27
 */

const BPromise = require('bluebird');
const gps = BPromise.promisifyAll(require('../model/gps'));
const deviceService = BPromise.promisifyAll(require('../services/deviceService'));
const router = require('express').Router();
const async = require('async');
const winston = require('../utils/logger');

router.post("/", function (req, response, next) {
	const vehs = req.body;
	const res = [];
	const device_ids = [];
	const start_date = new Date(vehs[0].StartDate).getTime();
	const end_date = new Date(vehs[0].EndDate).getTime();
	const regNos = [];
	async.eachSeries(vehs, function (d, done) {
		const reg_no = d.VehicleNo;
		regNos.push(reg_no);
		gps.getCurrentLocationFromRegNoAsync(reg_no)
			.then(function (dev) {
				res.push(dev);
				device_ids.push(dev.imei);
			})
			.error(function (err) {
				winston.info('din get imei', reg_no);
			})
			.then(done);
	}, function (err) {
		// console.log('mileage req', device_ids, start_date, end_date);
		deviceService.getMileageReportAsync(device_ids, start_date, end_date, 'android')
			.then(function (resp) {
				const mileage = resp.data;
				// console.log('mileage resp', JSON.stringify(mileage));
				for (let i = 0; i < res.length; i++) {
					for (let j = 0; j < mileage.length; j++) {
						if (res[i].imei === mileage[j].device_id) {
							res[i].KMRun = mileage[i].distance / 1000;
							break;
						}
					}
				}

				for (let i = 0; i < res.length; i++) {

					regNos.splice(regNos.indexOf(res[i].reg_no), 1);  //after this, regNos will contain reg_nos with no data

					res[i].VehicleNo = res[i].reg_no;
					delete res[i].reg_no;
					res[i].Ignition = res[i].acc_high ? 1 : 0;
					delete res[i].acc_high;
					res[i].Latitude = res[i].lat;
					delete res[i].lat;
					res[i].Longitude = res[i].lng;
					delete res[i].lng;
					res[i].location = res[i].address;
					delete res[i].address;
					res[i].StatusDate = new Date(res[i].positioning_time).toISOString();
					delete res[i].positioning_time;
					delete res[i].imei;
					delete res[i].location_time;
					res[i].message = 'data found';
				}

				for (let i = 0; i < regNos.length; i++) {
					res.push({
						VehicleNo: regNos[i],
						message: 'no data found'
					});
				}


				return response.status(200).json(res);
			});
	});

});

module.exports = router;
