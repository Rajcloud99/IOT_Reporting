/**
 * @Author: bharath
 * @Date:   2017-04-08
 */

const BPromise = require('bluebird');
const gps = BPromise.promisifyAll(require('../model/gps'));
const deviceService = BPromise.promisifyAll(require('../services/deviceService'));
const authUtil = require('../utils/authUtil');

const router = require('express').Router();

router.post("/url", function (req, res, next) {
	const reg_no = req.body.VehicleNo;
	const start_date = new Date(req.body.StartDate).toISOString();
	const end_date = new Date(req.body.EndDate).toISOString();
	let imeii;

	let user_id = req.user.user_id;
	const token = authUtil.generateSocketToken(user_id, new Date());
	gps.getImeiAsync(reg_no)
		.then(function (imei) {
			imeii = imei;
		})
		.error()
		.then(function () {
			return res.status(200).send('http://tracking.gpsgaadi.com/#!/sharedPlayback?reg_no=' + reg_no + '&start_date=' + start_date + '&end_date=' + end_date + '&imei=' + imeii + '&login_uid=' + user_id + '&token=' + token);
		});
});

router.post("/data", function (req, res, next) {
	console.log('rh');
	const reg_no = req.body.reg_no;
	const start_date = new Date(req.body.start_date).toISOString();
	const end_date = new Date(req.body.end_date).toISOString();
	let playback;

	gps.getImeiAsync(reg_no)
		.then(function (imei) {
			console.info('imei', imei);
			return deviceService.getPlaybackV2Async(imei, start_date, end_date);
		})
		.then(function (resp) {
			playback = resp;
		})
		.error()
		.then(function () {
			return res.status(200).json(playback.data);
		});
});

router.post("/playBack", function (req, res, next) {
    console.log('rh');
    const reg_no = req.body.reg_no;
    const start_date = new Date(req.body.start_date).toISOString();
    const end_date = new Date(req.body.end_date).toISOString();
    let playback;

    gps.getImeiAsync(reg_no)
        .then(function (imei) {
            console.info('imei', imei);
            return deviceService.getPlaybackV2Async(imei, start_date, end_date);
        })
        .then(function (resp) {
            playback = resp;
        })
        .error()
        .then(function () {
            return res.status(200).json(playback.data);
        });
});

router.post("/reports", function (req, res, next) {
    console.log('rh');
    const reg_no = req.body.reg_no;
    const start_date = new Date(req.body.start_date).toISOString();
    const end_date = new Date(req.body.end_date).toISOString();
    let playback;

    gps.getImeiAsync(reg_no)
        .then(function (imei) {
            console.info('imei', imei);
            return deviceService.getPlaybackV2Async(imei, start_date, end_date);
        })
        .then(function (resp) {
            playback = resp;
        })
        .error()
        .then(function () {
            return res.status(200).json(playback.data);
        });
});

module.exports = router;
