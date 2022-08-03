const router = require('express').Router();
const alarmService = require("../services/alarmService");

router.post('/get', function (req, res) {
    let request = req.body;
    return alarmService.getAlarm(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

router.post('/create', function (req, res) {
    let request = req.body;
    return alarmService.createAlarm(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

router.post('/update', function (req, res) {
    let request = req.body;
    return alarmService.updateAlarm(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

router.post('/remove', function (req, res) {
    let request = req.body;
    return alarmService.removeAlarm(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

module.exports = router;
