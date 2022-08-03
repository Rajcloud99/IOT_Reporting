/**
 * Created by Kamal on 07-05-2016.
 */
const Geozone = require('../model/geozone');
const geolib = require('geolib');

function getGeozone(request, callback) {
	Geozone.getGeozone(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Geozone not found';
		} else {
			response.status = 'OK';
			response.message = 'Geozone found.';
			response.pageState = res.pageState;
			response.data = res.data;
		}
		return callback(response);
	});
}

function updateGeozone(request, callback) {
	Geozone.updateGeozone(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Geozone update  failed';
		} else {
			response.status = 'OK';
			response.message = 'Geozone update done succefully';
			response.data = res;
		}
		return callback(response);
	});
}

function addGeozone(request, callback) {
	Geozone.addGeozone(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Geozone registration failed';
		} else {
			response.status = 'OK';
			response.message = 'Geozone registration done succefully';
			response.data = request;
		}
		return callback(response);
	});
}
function removeGeozone(request, callback) {
	Geozone.removeGeozone(request, function (err, res) {
		const response = {status: 'ERROR', message: ""};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'Geozone removal failed';
		} else {
			response.status = 'OK';
			response.message = 'Geozone removed succefully';
		}
		return callback(response);
	});
}

function getNearestGeozoneForPoint(request, callback) {
    let point ={latitude:Number(request.lat),longitude:Number(request.lng)};
    let radius = request.radius;
    let request_ = {selected_uid:request.user_id,row_count:0};
    Geozone.getGeozone(request_,  function (err,result) {
        let response = {
            status: 'ERROR',
            message: ""
        };
        if (err) {
            response.message = err.toString();
        } else if (!result) {
            response.message = 'no nearest geozone found';
        } else {
            response.status = 'OK';
            response.message = 'Nearest geofences found';
            let finalResult = {data:[]};
            let nearest ;
            let minDist = Number.POSITIVE_INFINITY;
            for (let i=0;i<result.data.length;i++){
                let geozone = result.data[i].geozone;
                let ptype = result.data[i].ptype;
                if (ptype ==="circle" ||ptype ==="cirlce"){
                    let center = geozone[0];
                    let r = result.data[i].radius;
                    let dist_point_center = geolib.getDistance(point,center);
                    let dist = dist_point_center -r ;
                    if (dist<=radius){
                        result.data[i].dist = dist;
                        finalResult.data.push(result.data[i]);
                        if (dist<minDist){
                            minDist = dist;
                            nearest=result.data[i];
                        }
                    }
                }else{
                    let bounds = geolib.getBounds(geozone);
                    let corner = {latitude:bounds.minLat,longitude:bounds.minLng};
                    let center = geolib.getCenter(geozone);
                    let r = geolib.getDistance(corner,center);
                    let dist_point_center = geolib.getDistance(point,center);
                    let dist = dist_point_center -r ;
                    if (dist<=radius){
                        result.data[i].dist = dist;
                        finalResult.data.push(result.data[i]);
                        if (dist<minDist){
                            minDist = dist;
                            nearest=result.data[i];
                        }
                    }
                }
            }
            finalResult.nearest = nearest;
            response.data = finalResult;
        }
        return callback(response);
    })
}
module.exports.addGeozone = addGeozone;
module.exports.getGeozone = getGeozone;
module.exports.updateGeozone = updateGeozone;
module.exports.removeGeozone = removeGeozone;
module.exports.getNearestGeozoneForPoint= getNearestGeozoneForPoint;