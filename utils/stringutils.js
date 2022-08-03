const utils = {};

utils.capitalize = function (str) {
	return str.substr(0, 1).toUpperCase() + str.substring(1).toLowerCase();
};


module.exports = utils;