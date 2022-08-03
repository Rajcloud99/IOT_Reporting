/**
 * @Author: bharath
 * @Date:   2016-11-30
 */

const BPromise = require('bluebird');
const jwt = require('jwt-simple');
const User = BPromise.promisifyAll(require('../model/user'));
const serverConfig = require('../config');
const winston = require('../utils/logger');

module.exports.authenticateRoutes = function (req, res, next) {
	// winston.info("request body :"+ JSON.stringify(req.body));

	const token = req.headers.authorization;
	if (!token) return res.status(403).send({
		status: 'ERROR',
		message: 'No token provided.'
	});
	// winston.info('got token:' + token);
	let decoded;
	try {
		decoded = jwt.decode(token, serverConfig.app_secret);
	} catch (err) {
		return res.status(500).json({'status': 'ERROR', 'message': err.message || "Invalid token"});
	}
	// winston.info("JWT payload decoded:" + decoded._id);
	if (decoded._id === 'gpsgaadiAdmin') return next();
	User.getUserAsync(decoded._id)
		.then(function (user) {
			//logger.info("Passed JWT:");
			if (!user) throw new Error('user not found');
			if(user && user.access && user.access===false){return res.status(500).json({'status': 'ERROR', 'message': "access disabled by admin"});}
			req.decoded = decoded;
			req.user = user;
			return next();
		})
		.catch(function (err) {
				winston.error(err);
				return res.status(500).json({'status': 'ERROR', 'message': "Could not find user"});
			}
		);
};

module.exports.generateToken = function (user_id) {
	return jwt.encode({'_id': user_id, 'rand_int': getRandomInt(11111111, 99999999)}, serverConfig.app_secret);
};

module.exports.generateSocketToken = function (user_id, date) {
	return jwt.encode({
		'_id': user_id,
		'date': date
	}, serverConfig.app_secret);
};

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}
