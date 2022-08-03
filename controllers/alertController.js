const BPromise = require('bluebird');
const router = require('express').Router();
const winston = require('../utils/logger');
const Alerts = BPromise.promisifyAll(require('../model/deviceAlerts'));

router.post('/get', function (req, res) {
    Alerts.getDeviceAlerts(req.body, function(err,resp) {
        let respponse = {
            status:'OK',
            data:resp.data
        };
        res.status(200).json(respponse);
    });
});

module.exports = router;
