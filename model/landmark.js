/**
 * @Author: kamal
 * @Date:   2016-12-14
 */

const cassandraDbInstance = require('../cassandraDBInstance');
const winston = require('../utils/logger');
const database = require('../config').database;
const geozoneCalculator = require('./../services/geozoneCalculator');

const allowedFieldsForUpdate = ['name', 'address', 'location','category'];

const prepareUpdateQuery = function (obj) {
    let sQuery = "",
        aParam = [],
        oRet = {};
    for (const key in obj) {
        if (allowedFieldsForUpdate.indexOf(key) > -1) {
            aParam.push(obj[key]);
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

exports.getLandmark = function (request, callback) {
    if (!request.user_id && !request.login_uid) return callback('no user id');

    const query = 'SELECT user_id, created_at, address, location, name FROM ' + database.table_landmarks + ' WHERE user_id = ?';
    cassandraDbInstance.execute(query, [request.user_id || request.login_uid], {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('landmark.getLandmarks ' + request.user_id, err);
            callback(err);
            return;
        }
        if (!result.rows || result.rows.length === 0) return callback('no landmarks found');
        callback(err, result.rows);
    });
};

exports.getLandmarkPage = function (request, callback) {
    if (!request.user_id && !request.login_uid) return callback('no user id');
    let oConfig = { prepare: 1};
    if (request.pageState) {
		oConfig.pageState = new Buffer(request.pageState);
	}
	if (request.row_count) {
		oConfig.fetchSize = request.row_count;
	} else { //default no of rows 30
		oConfig.fetchSize = 10;
	}
    const query = 'SELECT user_id, created_at, address, location, name FROM ' + database.table_landmarks + ' WHERE user_id = ?';
    cassandraDbInstance.execute(query, [request.user_id || request.login_uid], oConfig , function (err, result) {
        if (err) {
            winston.error('landmark.getLandmarks ' + request.user_id, err);
            callback(err);
            return;
        }
        if (!result.rows || result.rows.length === 0) return callback('no landmarks found');
        const oRes = {};
		if (result && result.rows) {
			oRes.data = result.rows;
		}
		if (result && result.meta) {
			oRes.pageState = result.meta.pageState;
		}
		callback(err, oRes);
    });
};

exports.addLandmark = function (landmark, callback) {
    const query = 'INSERT INTO ' + database.table_landmarks + ' (user_id, name, address, location, created_at)  VALUES (?,?,?,?,?)';
    cassandraDbInstance.execute(query, [
        landmark.user_id,
        landmark.name,
        landmark.address,
        landmark.location,
        landmark.created_at || Date.now()
    ], {
        prepare: true
    }, function (err, result) {
        if (err) {
            callback(err, null);
            winston.error('landmark.addLandmark', err);
            return;
        }
        if (!result) {
            return callback(err, null);
        }
        return callback(err, result);
    });
};

exports.addBulkLandmark = function (landmarkReq,callback) {
   let queries = [];
    const query = 'INSERT INTO ' + database.table_landmarks + ' (user_id, name, address, location, created_at)  VALUES (?,?,?,?,?)';
	for (let i = 0; i < landmarkReq.landmarks.length; i++) {
    	queries.push({
    		query: query,
    		params: [
                landmarkReq.user_id,
                landmarkReq.landmarks[i].name,
                landmarkReq.landmarks[i].address,
                landmarkReq.landmarks[i].location,
                landmarkReq.landmarks[i].created_at || Date.now()
                ]
    		});
    }
    cassandraDbInstance.batch(queries, {
   		prepare: true
     }, function (err, result) {
     	callback(err, result);
     });
}

exports.updateLandmark = function (landmark, callback) {
    const oQueryParam = prepareUpdateQuery(landmark);
    const sQuery = oQueryParam.sQuery;
    const aParam = oQueryParam.aParam;
    aParam.push(landmark.user_id);
    aParam.push(new Date(landmark.created_at));
    const query = 'UPDATE ' + database.table_landmarks + ' SET ' + sQuery + ' WHERE user_id = ? AND created_at = ?';
    cassandraDbInstance.execute(query, aParam, {
        prepare: true
    }, function (err, result) {
        if (err) {
            callback(err, null);
            winston.error('landmark.updateLandmark', err);
            return;
        }
        if (!result) {
            return callback(err, null);
        }
        return callback(err, result);
    });
};

exports.removeLandmark = function (request, callback) {
    request.selected_uid = request.selected_uid || request.login_uid || request.user_id;
    const query = 'DELETE FROM ' + database.table_landmarks + ' WHERE user_id = ?  AND created_at = ?';
    cassandraDbInstance.execute(query, [request.selected_uid, new Date(request.created_at).getTime()], {
        prepare: true
    }, function (err, result) {
        if (err) {
            callback(err, null);
            winston.error('landmark.removeLandmark', err);
            return;
        }
        if (!result) {
            return callback(err, null);
        }
        return callback(err, result);
    });
};

exports.getLandmarkWithinPointRadius = function (request, callback) {
    if (!request.user_id && !request.login_uid) return callback('no user id');
    let radius = request.radius;
    let point = request.point;
    let user_id = request.user_id;
    let minMaxRectBounds = geozoneCalculator.getBoundingRectangle(point, radius/1000);
    const aParams = [user_id, minMaxRectBounds.minLat, minMaxRectBounds.maxLat, minMaxRectBounds.minLng, minMaxRectBounds.maxLng];
    const query = 'SELECT user_id, created_at, address, location, name FROM ' + database.table_landmarks + ' WHERE user_id = ? AND location.latitude >= ? AND location.latitude<= ? AND location.longitude >= ? AND location.longitude <= ? ALLOW FILTERING';
    cassandraDbInstance.execute(query, aParams, {
        prepare: true
    }, function (err, result) {
        if (err) {
            winston.error('landmark.getLandmarks ' + request.user_id, err);
            callback(err);
            return;
        }
        if (!result.rows || result.rows.length === 0) return callback('no landmarks found');

        let finalResult = {data:[]};
        let minDist=Number.POSITIVE_INFINITY;
        let nearest ;
        for (let i=0;i<result.rows.length;i++){
            let loc = {latitude:result.rows[i].lat,longitude:result.rows[i].lng};
            let dist = geozoneCalculator.getDistance(loc,point);
            if (dist<=radius){
                result.rows[i].dist=dist;finalResult.data.push(result.rows[i]);
                if (dist<minDist){minDist=dist;nearest=result.rows[i];}
            }
        }
        finalResult.nearest=nearest;
        return callback(err, finalResult);
    });
};
