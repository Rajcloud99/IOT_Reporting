/**
 * @Author: bharath
 * @Date:   2016-12-01
 */

const BPromise = require('bluebird');
const User = BPromise.promisifyAll(require('../model/user'));
const userService = require('../services/userService');
const authUtil = require('../utils/authUtil');
const router = require('express').Router();
const externalip = require('../config').externalip;

router.post("/getKey", function (req, res, next) {
	User.getUserAsync(req.body.user_id)
		.then(function (user) {
			if (!user.validPassword(req.body.password)) throw new Error('invalid password');
			return res.status(200).json({
				"status": "OK",
				"message": "found data",
				"data": authUtil.generateToken(req.body.user_id)
			});
		}).catch(next);
});

router.get("/dealerinfo",function (req, res, next) {
	var distributorInfo=require("../distributor/info.json");
	if(distributorInfo[req.query.host]){
        distributorInfo[req.query.host].logo_url = 'http://' + externalip + ':8080/logo/'+distributorInfo[req.query.host].logo;
		return res.status(200).json({
			"status": "OK",
			"message": "found data",
			"data": distributorInfo[req.query.host]
		});
	}
	else {
        distributorInfo['default'].logo_url = 'http://' + externalip + ':8080/logo/'+distributorInfo['default'].logo;
        return res.status(200).json({
			"status": "OK",
			"message": "default data",
			"data": distributorInfo['default']
		});
	}
});

router.post("/getAllSubUser", function (req, res, next) {
	let user = req.body.user_id;
	User.getUserAsync(user).then(function(oUser){
		if(oUser && req.body.subUser){
			let oUser = req.body;
			oUser.selected_uid = req.body.user_id;
			let cb = function (err,resp) {
				if(resp){
					return res.status(200).json({"status": "OK","message": "User Data found","data":resp});
				}
			};
			return User.getUserById(oUser,cb);
		}else{
			return res.status(200).json({"status": "ERROR","message": "Either user_id,user token  are wrong incorrect"});
		}
	}).catch(next);
});

module.exports = router;
