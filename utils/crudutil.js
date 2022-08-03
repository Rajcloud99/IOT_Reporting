exports.prepareUpdateQuery = function (oTrip, allowedFieldsForUpdate) {
	let sQuery = "",
		aParam = [],
		oRet = {};
	for (const key in oTrip) {
		if (allowedFieldsForUpdate.indexOf(key) > -1 && oTrip[key] !== null && oTrip[key] !== undefined) {
			aParam.push(oTrip[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key + "=?";
			} else {
				sQuery = key + "=?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.aParam = aParam;
	return oRet;
};
exports.prepareCreateQuery = function (oTrip, allowedFieldsForCreate) {
	let sQuery = "",
		sValues = "",
		aParam = [],
		oRet = {};
	for (const key in oTrip) {
		if (allowedFieldsForCreate.indexOf(key) > -1) {
			aParam.push(oTrip[key]);
			if (sQuery) { // prevent ',' to append initially
				sQuery = sQuery + "," + key;
				sValues = sValues + ",?";
			} else {
				sQuery = key;
				sValues = "?";
			}
		}
	}
	oRet.sQuery = sQuery;
	oRet.sValues = sValues;
	oRet.aParam = aParam;
	return oRet;
};
