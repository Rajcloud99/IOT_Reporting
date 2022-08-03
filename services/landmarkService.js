/**
 * @Author: bharath
 * @Date:   2016-12-14
 */

const Landmark = require('../model/landmark');
const geozoneCalculator = require('./geozoneCalculator');
const geolib = require('geolib');

exports.addLandmark = function (request, callback) {
	Landmark.addLandmark(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Add landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark added successfully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.addBulkLandmark = function (request, callback) {
	Landmark.addBulkLandmark(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Add landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark added successfully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.getLandmark = function (request, callback) {
	Landmark.getLandmark(request, function (err, res) {
		let response = {
			status: 'OK',
			message: "",
			data: []
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Get landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark fetched successfully';
			response.data = res;
		}
		return callback(response);
	});
};

exports.getLandmarkPage = function (request, callback) {
	Landmark.getLandmarkPage(request, function (err, res) {
		let response = {
			status: 'OK',
			message: "",
			data: []
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Get landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark fetched successfully';
			response.data = res.data;
			response.pageState = res.pageState;
		}
		return callback(response);
	});
};

exports.getNearestLandmarkForPoint = function (request, callback) {

    let point = {latitude:Number(request.lat),longitude:Number(request.lng)};
    let radius = request.radius;

    Landmark.getLandmark({user_id:request.user_id},  function (err,result) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
        } else if (!result) {
            response.message = 'No nearest landmarks found';
        } else {
            response.status = 'OK';
            response.message = 'Nearest landmarks found';
            let finalResult = {data:[]};
            let nearest ;
            let minDist = Number.POSITIVE_INFINITY;
            for (let i=0;i<result.length;i++){
                let dist = geolib.getDistance(result[i].location, point);
                if (dist<radius){
                    result[i].dist= dist;
                    finalResult.data.push(result[i]);
                    if (dist<minDist){
                        minDist = dist;
                        nearest = result[i];
                    }
                }
            }
            finalResult.nearest = nearest;
            response.data = finalResult;
        }
        return callback(response);
    })
};

exports.updateLandmark = function (request, callback) {
	Landmark.updateLandmark(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'update landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark updated successfully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.removeLandmark = function (request, callback) {
	Landmark.removeLandmark(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'remove landmark failed';
		} else {
			response.status = 'OK';
			response.message = 'Landmark removed successfully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.injectLandmarkInAdas = function (user_id, adas, callback) {
	if (!adas) return callback(null, true);
	Landmark.getLandmarkAsync({user_id: user_id})
		.then(function (landmarks) {
			for (let device_id in adas) {
				let data = adas[device_id].data;
				injectLandmark(data, landmarks);
			}

		})
		.error(function () {
		})
		.then(function () {
			callback(null, true);
		});
};

exports.injectLandmarkGeneric = function (user_id, data, callback) {
	if (!data) return callback(null, true);
	Landmark.getLandmarkAsync({user_id: user_id})
		.then(function (landmarks) {
			injectLandmark(data, landmarks);
		})
		.error(function () {
		})
		.then(function () {
			callback(null, true);
		});
};

function injectLandmark(data, landmarks) {
	if (data && landmarks) {
		if (!(data instanceof Array)) return injectLandmarkInDatum(data, landmarks);
		for (let i = 0; i < data.length; i++) {
			//if (data[i].drive || data[i].duration < 14 * 60) continue;
			injectLandmarkInDatum(data[i], landmarks);
		}
	}
}

function injectLandmarkInDatum(datum, landmarks) {
	let nearest_landmark;
	let nearestDist = 1000000000000;
    let nearest_landmarkEnd;
    let nearestDistEnd = 1000000000000;
	for (let j = 0; j < landmarks.length; j++) {
		let dist = geozoneCalculator.getDistance(landmarks[j].location, datum.start ? datum.start : {
			latitude: datum.lat,
			longitude: datum.lng
		});
		if (dist < nearestDist) {
			nearest_landmark = landmarks[j];
			nearestDist = dist;
		}
		//end point
        let distEnd = geozoneCalculator.getDistance(landmarks[j].location, datum.stop ? datum.stop : {
            latitude: datum.lat,
            longitude: datum.lng
        });
        if (distEnd < nearestDistEnd) {
            nearest_landmarkEnd = landmarks[j];
            nearestDistEnd = distEnd;
        }
	}
	nearest_landmark.dist = nearestDist;
	datum.nearest_landmark = JSON.parse(JSON.stringify(nearest_landmark));
	let allowedUsers = ['PHL','SPB','SPWA','PK','SPD'];
	if(allowedUsers.indexOf(nearest_landmark.user_id) > -1){
        datum.start_addr = nearest_landmark.name + ", " + nearest_landmark.address;
        datum.stop_addr = nearest_landmarkEnd.name + ", " +nearest_landmarkEnd.address;
    }
}
