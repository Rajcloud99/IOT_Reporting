exports.getRandomArbitrary = function (min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
};

exports.roundUpto = function (number, upto) {
	return Number(number.toFixed(upto));
};
