const BPromise = require('bluebird');
const router = require('express').Router();
const User = require('../model/user');
const winston = require('../utils/logger');
const landmarkService = BPromise.promisifyAll(require('../services/landmarkService'));

function validateSelectedUID(req, callback) {
    let token = req.headers['authorization'];
    let user = req.body && req.body.selected_uid ? req.body.selected_uid : req.query.selected_uid;
    User.getUserAsync(user).then(function (oUser) {
        //if (err) {callback(err);}
        return callback();
        /*
        if (oUser && oUser.user_token && oUser.user_token === token) {
            callback();
        } else {
            callback({"status": "ERROR", "message": "Either selected_uid or token is wrong"});
        }
        */
    }).catch(callback);
};

router.post('/get', function (req, res) {
    validateSelectedUID(req, function (err) {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            resp.message = err.message;
            console.log(err);
            return res.json(resp);
        }
        if(!req.body.user_id){
            req.body.user_id = req.body.selected_uid || req.body.user_id
        }
        landmarkService.getLandmarkPage(req.body, response => {
            return res.json(response);
        });
    });
});
//add landmark
router.post('/add', function (req, res) {
    validateSelectedUID(req, function (err) {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            resp.message = err.message;
            return res.json(resp);
        }
        if(!req.body.address || !req.body.location || !req.body.name){
            resp.message = 'Mandatory field is missing';
            return res.json(resp);
        }
        var request = {
            user_id : req.body.selected_uid || req.body.user_id,
            address : req.body.address,
            location : req.body.location,
            name : req.body.name,
            created_at:req.body.created_at
        };
        landmarkService.addLandmark(request, response => {
            return res.json(response);
        });
    });
});

//add Bulk landmark
router.post('/bulkAdd', function (req, res) {
    validateSelectedUID(req, function (err) {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            resp.message = err.message;
            return res.json(resp);
        }

        landmarkService.addBulkLandmark(req.body, response => {
            return res.json(response);
        });
    });
});

router.post('/update', function (req, res) {
    validateSelectedUID(req, function (err) {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            resp.message = err.toString();
            return res.json(resp);
        }
        if(!req.body.created_at){
            resp.message = 'created_at is missing';
            return res.json(resp);
        }
        var request = {
            user_id : req.body.selected_uid || req.body.user_id,
            address : req.body.address,
            location : req.body.location,
            name : req.body.name,
            created_at : req.body.created_at
        };
        landmarkService.updateLandmark(request, response => {
            return res.json(response);
        });
    });
});

router.post('/remove', function (req, res) {
    validateSelectedUID(req, function (err) {
        let resp = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            resp.message = err.toString();
            return res.json(resp);
        }
        var request = {
            user_id : req.body.selected_uid || req.body.user_id,
            address : req.body.address,
            location : req.body.location,
            name : req.body.name,
            created_at : req.body.created_at
        };
        landmarkService.removeLandmark(request, response => {
            return res.json(response);
        });
    });
});

module.exports = router;
 