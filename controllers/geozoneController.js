const router = require('express').Router();
const geozoneService = require("../services/geozoneService");

router.post('/get', function (req, res) {
    let request = req.body;
     geozoneService.getGeozone(request, response => {
         let resp = {
             status:'OK',
             data:response
         };
         res.status(200).json(resp);
    });
});

router.post('/create', function (req, res) {
    let request = req.body;
    geozoneService.addGeozone(request, response => {
       let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

router.post('/update', function (req, res) {
    let request = req.body;
    geozoneService.updateGeozone(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

router.post('/remove', function (req, res) {
    let request = req.body;
    geozoneService.removeGeozone(request, response => {
        let resp = {
            status:'OK',
            data:response
        };
        res.status(200).json(resp);
    });
});

module.exports = router;
