const express = require('express');
const router = express.Router();
const mDeviceService = require('../services/mobileDeviceService');

router.post('/register', function (req, res, next) {
	//    winston.info(req.body);
	mDeviceService.registerMobile(req.body, function (mobiel) {
		return res.status(200).json(mobiel);
	});
});
module.exports = router;
