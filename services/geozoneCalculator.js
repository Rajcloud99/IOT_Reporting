const geolib = require('geolib');

function isPointInside(point, polygon) {
	if (point && polygon) {
		return geolib.isPointInside(point, polygon);
	} else {
		return false;
	}
}

function isPointInCircle(point, center, radius) {
	if (point && center && radius) {
		return geolib.isPointInCircle(point, center, parseInt(radius));
	} else {
		return false;
	}
}

function getDistance(objStart, objEnd) {
	if (objStart.latitude && objStart.longitude && objEnd.latitude && objEnd.longitude) {
		return geolib.getDistance(objStart, objEnd);
	} else {
		return 0;
	}
}

module.exports.getBoundingRectangle = function(point, radiusInKm){
	let R  = 6371;  // earth radius in km
    let deltaLng = ((radiusInKm/R/Math.cos(point.latitude*Math.PI/180))*180/Math.PI);
    let deltaLat =  (radiusInKm*180/(R*Math.PI));
    let x1 = point.longitude - deltaLng;
	let x2 = point.longitude + deltaLng;
	let y1 = point.latitude + deltaLat;
	let y2 = point.latitude - deltaLat;

	return {minLat:y2,maxLat:y1,minLng:x1,maxLng:x2};
};

module.exports.isPointInside = isPointInside;
module.exports.isPointInCircle = isPointInCircle;
module.exports.getDistance = getDistance;
