/**
 * Created by manish on 28/6/16.
 */

const _ = require('lodash');
const constants = require('../constants');
const stringUtil = require('./stringutils');
const utils = {};

/***Check if object is empty ***/
utils.isEmpty = function (obj) {
	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			return false;
		}
	}
	return true;
};

/***Generates a client suitable status string ***/
utils.clientSuitableStatus = function (speed, statusKey, dateTime) {
	if (statusKey === "online") {
		if (speed > 3) {
			return constants.clientStatuses[0];
		} else if (speed < 0 && (new Date(dateTime) - new Date()) < 15 * 60 * 1000) {
			return constants.clientStatuses[0];
		} else {
			return constants.clientStatuses[1];
		}
	} else {
		return stringUtil.capitalize(statusKey);
	}
};

utils.pruneEmpty = function (obj) {
	return function prune(current) {
		_.forOwn(current, function (value, key) {
			if (!(value instanceof Date)) {
				if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
					(_.isString(value) && _.isEmpty(value)) ||
					(_.isObject(value) && _.isEmpty(prune(value)))) {

					delete current[key];
				}
			}

		});
		// remove any leftover undefined values from the delete
		// operation on an array
		if (_.isArray(current)) _.pull(current, undefined);

		return current;

	}(_.cloneDeep(obj));  // Do not modify the original object, create a clone instead
};

utils.setStatus = function (obj,stoppageTime) {
	stoppageTime = stoppageTime?stoppageTime:5;
	let positionTime = new Date(obj.positioning_time);
	let locationTime = new Date(obj.location_time);
	let speed = obj.speed;
	let ptDiffMin=Math.ceil((new Date()-positionTime)/60000);
	let ltDiffMin=Math.ceil((new Date()-locationTime)/60000);
	if(!obj.status || obj.status === null){
		obj.s_status=4;
		return;
	}
	if (ptDiffMin < 300) { //15 hr no offline
		if (ltDiffMin <= stoppageTime && speed > 0) {
			obj.status = "running";
			obj.s_status = 1;
		}else {
			obj.status = "stopped";
			obj.s_status = 2;
			obj.speed = 0;
		}
	}else {
		obj.status="offline";
		obj.s_status=3;
	}
};

module.exports = utils;
