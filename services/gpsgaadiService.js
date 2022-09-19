const BPromise = require('bluebird');
const GpsGaadi = BPromise.promisifyAll(require('../model/gpsgaadi'));
const deviceService = BPromise.promisifyAll(require('../services/deviceService'));
const addressService = BPromise.promisifyAll(require('../services/addressService'));
const Landmark = BPromise.promisifyAll(require('../model/landmark'));
const featureService = BPromise.promisifyAll(require('../services/featureService'));
// const Toll = BPromise.promisifyAll(require('../model/toll'));
const Device = require('../model/device');
const dateutils = require('../utils/dateutils');
const geozoneCalculator = require('./geozoneCalculator');
const dbUtil = BPromise.promisifyAll(require('../utils/dbUtil'));
const otherUtil = BPromise.promisifyAll(require('../utils/otherutils'));
const winston = require('../utils/logger');
const database = require('../config').database;
const async = require('async')
const cassandraDbInstance = require('../cassandraDBInstance');
const tracksheetCronTime = require('../config').tracksheetCronTime;
const mathutils = require('../utils/mathutils');

exports.getGpsGaadi = function (request, callback) {
	GpsGaadi.getGpsGaadi(request, function (err, res) {
		//  .log(new Date(), 'got gpsgaadi');
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
			return callback(null, response);
		} else if (!res) {
			response.message = 'GpsGaadi not found';
			return callback(null, response);
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi found.';
			let sIMEI = [];
			for (let i = 0; i < res.length; i++) {
				if (res[i].imei) {
					sIMEI.push(res[i].imei);
				}
			}
			sIMEI = sIMEI.toString();
			deviceService.getDeviceStatus(sIMEI, function (err, deviceResponse) {
				// console.log(new Date(), 'got inv');
				if (deviceResponse.status === 'OK' && deviceResponse.data) {
					for (let i = 0; i < res.length; i++) {
						for (let k = 0; k < deviceResponse.data.length; k++) {
							if (deviceResponse.data[k] && deviceResponse.data[k].imei && res[i].imei && deviceResponse.data[k].imei.toString() === res[i].imei.toString()) {
								res[i].status = deviceResponse.data[k].status;
								res[i].device_type = deviceResponse.data[k].device_type;
								res[i].lat = deviceResponse.data[k].lat;
								res[i].lng = deviceResponse.data[k].lng;
								res[i].speed = deviceResponse.data[k].speed;
								res[i].course = deviceResponse.data[k].course;
								res[i].location_time = deviceResponse.data[k].location_time;
								res[i].datetime = deviceResponse.data[k].location_time;
								res[i].positioning_time = deviceResponse.data[k].positioning_time;
								res[i].acc_high = deviceResponse.data[k].acc_high;
								res[i].on_trip = deviceResponse.data[k].on_trip;
								res[i].ac_on = deviceResponse.data[k].ac_on;
								res[i].addr = deviceResponse.data[k].address;
								/*
								if (deviceResponse.data[k].status === 'offline' && (Date.now() - new Date(deviceResponse.data[k].positioning_time).getTime()) <= 3600000) {
									res[i].status = 'online';
								}
								*/
							}
						}
					}
					response.data = res;
					return callback(null, response);
				}
			});
		}
	});
};

exports.getGpsGaadiWeb = function (request, callback) {
	GpsGaadi.getGpsGaadi(request, function (err, res) {
		//  .log(new Date(), 'got gpsgaadi');
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
			return callback(null, response);
		} else if (!res) {
			response.message = 'GpsGaadi not found';
			return callback(null, response);
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi found.';
			let sIMEI = [];
			for (let i = 0; i < res.length; i++) {
				if (res[i].imei) {
					sIMEI.push(res[i].imei);
				}
			}
			sIMEI = sIMEI.toString();
			deviceService.getDeviceStatus(sIMEI, function (err, deviceResponse) {
				// console.log(new Date(), 'got inv');
				if (deviceResponse.status === 'OK' && deviceResponse.data) {
					for (let i = 0; i < res.length; i++) {
						for (let k = 0; k < deviceResponse.data.length; k++) {
							if (deviceResponse.data[k] && deviceResponse.data[k].imei && res[i].imei && deviceResponse.data[k].imei.toString() === res[i].imei.toString()) {
								res[i].status = deviceResponse.data[k].status;
								res[i].device_type = deviceResponse.data[k].device_type;
								res[i].lat = deviceResponse.data[k].lat;
								res[i].lng = deviceResponse.data[k].lng;
								res[i].speed = deviceResponse.data[k].speed;
								res[i].course = deviceResponse.data[k].course;
								res[i].location_time = deviceResponse.data[k].location_time;
								res[i].datetime = deviceResponse.data[k].location_time;
								res[i].positioning_time = deviceResponse.data[k].positioning_time;
								res[i].acc_high = deviceResponse.data[k].acc_high;
								res[i].on_trip = deviceResponse.data[k].on_trip;
								res[i].ac_on = deviceResponse.data[k].ac_on;
								res[i].addr = deviceResponse.data[k].address;
								otherUtil.setStatus(res[i]);
								/*
								if (deviceResponse.data[k].status === 'offline' && (Date.now() - new Date(deviceResponse.data[k].positioning_time).getTime()) <= 3600000) {
									res[i].status = 'online';
								}
								*/
							}
						}
					}
					response.data = res;
					return callback(null, response);
				}
			});
		}
	});
};


exports.getGpsGaadiListCrone = function () {
	// winston.info(new Date().toString(), 'starting getGpsGaadiList');
	///get list of all users
	//...
    console.log('cron start ' + new Date().toString());
	let query = 'SELECT user_id FROM ' + database.table_users;
	cassandraDbInstance.execute(query, null, {prepare:1}, function (err, result) {
		if (err) {
			winston.error('GpsGaadi.Fetch users', err);
			return;
		}
		if (!result || !result.rows || result.rows.length === 0) {
			return;
		}
		const oRes = {};
		if (result && result.rows) {
			/*Asynchronously loop through all users and save their tracksheet data in mongoDB*/
		    var dbResponse={nMatched:0,nModified:0,nUpserted:0,nInserted:0,nRemoved:0};
			async.forEachSeries(result.rows,function (user,callback) {
				let request={selected_uid:user.user_id};
				let response;
				GpsGaadi.getGpsGaadiListAsync(request)
					.then(function (res) {
						if(res && res.data){
                            const sIMEI = [];
                            for (let i = 0; i < res.data.length; i++) {
                                if (res.data[i].imei) {
                                    sIMEI.push(res.data[i].imei);
                                }
                            }
                            res.user_id=user.user_id;
                            return BPromise.promisify(fillGpsgaadiWithInfoMongo)(sIMEI, res);
						}else{
                            return undefined;
						}

					})
					.then(function (response) {
						///upsert response.data in mongodb
						if(response){
                            var bulk = TracksheetModel.collection.initializeOrderedBulkOp();
                            for(let resIndex=0; resIndex<response.data.length; resIndex++){
                                bulk.find({user_id:response.data[resIndex].user_id,imei:response.data[resIndex].imei}).upsert().updateOne(response.data[resIndex]);
                            }
                            bulk.execute(function (error,res) {
                                //res;
                                if(error){
                                    callback(error);
                                }
                                else {
                                    dbResponse.nInserted = res.nInserted;
                                    dbResponse.nMatched += res.nMatched;
                                    dbResponse.nModified += res.nModified;
                                    dbResponse.nRemoved += res.nRemoved;
                                    dbResponse.nUpserted += res.nUpserted;
                                    callback (null, dbResponse);
                                }
                            });
						}else{
							callback('no response');
						}

					})
					.catch(function (err) {
						callback();
					});
			},
				function (err,message) {
					if(err) {
                        console.log(err);
					}else {
						 console.log('cron ends ' + new Date().toString());
					}
				})
		}
	});

};

function tracksheetFilters (reqFilters) {
	let filter={};
	let startDate,endDate;
	for(let key in reqFilters){
		switch (key){
			case 'user_id':
				filter[key]=reqFilters[key];
				break;
			case 'positionTimeStart':
				startDate = new Date(reqFilters[key]);
				startDate.setSeconds(0);
				startDate.setHours(0);
				startDate.setMinutes(0);
				if(reqFilters.positionTimeEnd){
					endDate = new Date(reqFilters['positionTimeEnd']);
				}
				else {
					endDate = new Date(startDate);
				}
				endDate.setDate(endDate.getDate() + 1);
				filter["positioning_time"] = {
					"$gte" :startDate,
					"$lt":endDate
				};
				break;
			case 'locationTimeStart':
				startDate = new Date(reqFilters[key]);
				startDate.setSeconds(0);
				startDate.setHours(0);
				startDate.setMinutes(0);
				if(reqFilters.locationTimeEnd){
					endDate = new Date(reqFilters['locationTimeEnd']);
				}
				else {
					endDate = new Date(startDate);
				}
				endDate.setDate(endDate.getDate() + 1);
				filter["location_time"] = {
					"$gte" :startDate,
					"$lt":endDate
				};
				break;
			case 'locationTimeEnd':
			case 'positionTimeEnd':
				//ignore them
					break;
			default:
				filter[key]={$regex:reqFilters[key], $options:'i'};
		}
	}
	return filter;
}

exports.getGpsGaadiListFromMongo=function (request, callback) {
	request.search=request.search || {};
	request.search['user_id']=request.selected_uid || request.login_uid;
	let queryFilters=tracksheetFilters(request.search);
	let response={};
	let sort={};
	if(request.sort){
		sort[request.sort]=request.sort_desc?-1:1;
	}
	else {
		sort['s_status']=1
	}
	var no_of_pages = 1;

	response.user_id = request.user_id || request.login_uid;

	const oReq = {};
	oReq.feature = 'tracksheet';
	oReq.selected_uid = response.user_id;
	featureService.getFeatureAsync(oReq)
		.then(function (features) {
			if (features.data && features.data.shown_fields) {
				response.shown_fields = features.data.shown_fields;
			} else {
				response.shown_fields = ['branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
			}
			if (features.data && features.data.allowed_fields) {
				response.allowed_fields = features.data.allowed_fields;
			} else {
				response.allowed_fileds = ['s_status','branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
			}

			let project={};
			for(let i=0; i<response.allowed_fields.length; i++){
				project[response.allowed_fields[i]]=1;
			}
			project.imei=1;
			project.course=1;
			project.lat=1;
			project.lng=1;
			TracksheetModel.countAsync(queryFilters)
				.then(function(count){
					let cursor = TracksheetModel.find(queryFilters,project);
					cursor.sort(sort);
					let no_of_documents;
					no_of_documents = request && request.no_of_docs ? parseInt(request.no_of_docs) : 12;
					if(request.all){
						no_of_documents=count;
					}
					if(count/no_of_documents>1){
						no_of_pages = count/no_of_documents;
					}
					cursor.limit(parseInt(no_of_documents));

					if(request.page){
						let skip_docs = (request.page) * no_of_documents;
						cursor.skip(parseInt(skip_docs));
					}

					cursor.exec(
						function(err,available) {
							if (err){
								return next(err);
							}
							else {
								let temp = JSON.parse (JSON.stringify (available));
								///use for loop to modify position time & location time to new Date() conditionally
								for(let i=0; i<temp.length; i++){
									if(temp[i].status=='running'){
										let stoppageTime = tracksheetCronTime+300000;
										otherUtil.setStatus(temp[i],stoppageTime/60000);
										let ptDiff = new Date()-new Date(temp[i].positioning_time);
										let ltDiff = new Date()-new Date(temp[i].location_time);
										if(ptDiff<=stoppageTime){
											temp[i].positioning_time=new Date();
										}
										if(ltDiff<=tracksheetCronTime){
											temp[i].location_time=new Date();
										}
									}
								}
								response.status = 'OK';
								response.message = "GpsGaadi found.";
								response.data = temp;
								response.page = request.page;
								response.sort = request.sort;
								response.sort_desc = !!request.sort_desc;
								response.no_of_pages =Math.ceil(no_of_pages);
								return callback(response);
							}
						}
					)
				})
				.catch(
					function(err) {
						const response = {
							status: 'ERROR',
							message: ""
						};
						response.message = err.toString();
						return callback(response);
					}
				);
		})

};

exports.getGpsGaadiList = function (request, callback) {
	// winston.info(new Date().toString(), 'starting getGpsGaadiList');
	let response;
	GpsGaadi.getGpsGaadiListAsync(request)
		.then(function (res) {
			// winston.info(new Date(), 'got getGpsGaadiList from cassandra');
			response = {
				status: 'OK',
				message: "GpsGaadi found.",
				user_id: request.user_id || request.login_uid
			};
			response.data = res.data;
			response.page = request.page;
			response.search = request.search;
			response.sort = request.sort;
			response.sort_desc = !!request.sort_desc;

			const sIMEI = [];
			for (let i = 0; i < res.data.length; i++) {
				if (res.data[i].imei) {
					sIMEI.push(res.data[i].imei);
				}
			}
			return BPromise.promisify(fillGpsgaadiWithInfo)(sIMEI, response);
		})
		.then(function () {
			searchSortAndPaginate(response);
			callback(response);
		})
		.error(function (err) {
			const response = {
				status: 'ERROR',
				message: ""
			};
			response.message = err.toString();
			return callback(response);
		});
};

exports.getTracksheetData = function (request, callback) {
	// winston.info(new Date().toString(), 'starting getGpsGaadiList');
	let response;
	GpsGaadi.getGpsGaadiListAsync(request)
		.then(function (res) {
			// winston.info(new Date(), 'got getGpsGaadiList from cassandra');
			if(res.data && res.data[0]){
				response = {
					status: 'OK',
					message: "GpsGaadi found.",
					user_id: request.user_id || request.login_uid,
					data:[]
				};
				const data=[];
				const packetSize=100;
				let sIMEI=[];
				request.count = {'running':0,'stopped':0,'offline':0,'inactive':0};
				request.total_count=res.data.length;
				for (let i = 0; i < res.data.length; i++) {
					if (res.data[i].imei) {
						sIMEI.push(res.data[i].imei);
					}
				}
				deviceService.getDeviceStatusAsync(sIMEI)
					.then(function (deviceResponse) {
					// winston.info(new Date(), 'got device from inv, starting for loop');
					for (let i = 0; i < res.data.length; i++) {
						for (let k = 0; k < deviceResponse.data.length; k++) {
							if (deviceResponse.data && deviceResponse.data[k] && deviceResponse.data[k].imei && res.data[i].imei && deviceResponse.data[k].imei.toString () === res.data[i].imei.toString ()) {
								res.data[i].status = (deviceResponse.data[k].status === 'online') ? (deviceResponse.data[k].speed > 0 ? 'running' : 'stopped') : (deviceResponse.data[k].status || 'offline');
								res.data[i].driver_name = deviceResponse.data[k].driver_name;
								res.data[i].ip = deviceResponse.data[k].ip;
								res.data[i].driver_name2 = deviceResponse.data[k].driver_name2;
								res.data[i].rfid1 = deviceResponse.data[k].rfid1;
								res.data[i].rfid2 = deviceResponse.data[k].rfid2;
								res.data[i].lat = deviceResponse.data[k].lat;
								res.data[i].lng = deviceResponse.data[k].lng;
								res.data[i].speed = deviceResponse.data[k].speed;
								res.data[i].course = deviceResponse.data[k].course;
								res.data[i].positioning_time = deviceResponse.data[k].positioning_time;
								res.data[i].location_time = deviceResponse.data[k].location_time;
								res.data[i].datetime = deviceResponse.data[k].location_time;
								res.data[i].acc_high = deviceResponse.data[k].acc_high;
								res.data[i].geofence_status = deviceResponse.data[k].geofence_status;
								//res.data[i].nearest_landmark = 'landmark';
								res.data[i].on_trip = deviceResponse.data[k].on_trip;
								res.data[i].ac_on = deviceResponse.data[k].ac_on;
								res.data[i].addr = deviceResponse.data[k].address;
								res.data[i].dist_today = (dateutils.getMorning ().getTime () < new Date (res.data[i].positioning_time).getTime ()) ? deviceResponse.data[k].dist_today : 0;
								res.data[i].dist_yesterday = deviceResponse.data[k].dist_yesterday;
								res.data[i].dist_d_2 = deviceResponse.data[k].dist_d_2;
								res.data[i].dist_d_3 = deviceResponse.data[k].dist_d_3;
								res.data[i].dist_d_4 = deviceResponse.data[k].dist_d_4;
								res.data[i].dist_d_5 = deviceResponse.data[k].dist_d_5;
								res.data[i].dist_d_6 = deviceResponse.data[k].dist_d_6;
								res.data[i].dist_d_7 = deviceResponse.data[k].dist_d_7;

								res.data[i].dist_last_week = 0;
								res.data[i].dist_last_week += (res.data[i].dist_yesterday || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_2 || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_3 || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_4 || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_5 || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_6 || 0);
								res.data[i].dist_last_week += (res.data[i].dist_d_7 || 0);
								otherUtil.setStatus (res.data[i]);
								switch (res.data[i].status) {
									case 'running':
										request.count.running++;
										break;
									case 'stopped':
										request.count.stopped++;
										break;
									case 'offline':
										request.count.offline++;
										break;
									default    :
										request.count.inactive++;
										break;
								}

							}
						}
						if(!data[parseInt(i/packetSize)]){
							data[parseInt(i/packetSize)]={response:JSON.parse(JSON.stringify(response))};
						}
						data[parseInt (i / packetSize)].response.data.push (res.data[i]);
					}
					return null;
				})
				.then(function () {
					let dLen = data.length,cLen=0;
                    async.eachSeries(data,function (d,cb) {
					//async.forEachOf(data,function (d,index,cb) {
						setTimeout((d) => {
                            cLen++;
							d.response.packetId=cLen;
							fillGpsgaadiWithInfoTracksheet(d.response, (err,response)=>{
								if(err){
									const response = {
										status: 'ERROR',
										message: ""
									};
									response.message = err.toString();
									callback(response);
									cb();
								}
								response.count = request.count;
								response.total_count = request.total_count;
								callback(response);
								//console.log(new Date()+"--Res: "+response.packetId+"---Data: "+response.data.length);
								cb();
							})
						}, 500,d);
					},function (err) {
						response.request="tracksheetDataAck";
						response.no_of_packet=data.length;
						callback(response);
					});
				});
			}else {
				response = {
					status: 'OK',
					message: "GpsGaadi found.",
					user_id: request.user_id || request.login_uid,
					data:[],
					packetId:0
				};
				callback(response);
			}

		})
};

function searchSortAndPaginate(response) {
	// console.log(new Date(), 'starting searchSortAndPaginate');
	if (response.search) {
		for (const search in response.search) {
			switch (search) {
				case 'addr':
					for (let i = 0; i < response.data.length; i++) {
						if (!response.data[i].addr || response.data[i].addr.search(new RegExp(response.search[search].toLowerCase(), 'i')) === -1) {
							response.data.splice(i, 1);
							i--;
						}
					}
					break;
				case 'branch':
					for (let i = 0; i < response.data.length; i++) {
						if (!response.data[i].branch || response.data[i].branch.search(new RegExp(response.search[search].toLowerCase(), 'i')) === -1) {
							response.data.splice(i, 1);
							i--;
						}
					}
					break;
				case 'route':
					for (let i = 0; i < response.data.length; i++) {
						if (!response.data[i].route || response.data[i].route.search(new RegExp(response.search[search].toLowerCase(), 'i')) === -1) {
							response.data.splice(i, 1);
							i--;
						}
					}
					break;
				case 'driver':
					for (let i = 0; i < response.data.length; i++) {
						if (!response.data[i].driver_name || response.data[i].driver_name.search(new RegExp(response.search[search].toLowerCase(), 'i')) === -1) {
							response.data.splice(i, 1);
							i--;
						}
					}
					break;
				case 'status':
					for (let i = 0; i < response.data.length; i++) {
						if (!response.data[i].status || response.data[i].status.search(new RegExp(response.search[search].toLowerCase(), 'i')) === -1) {
							response.data.splice(i, 1);
							i--;
						}
					}
					break;
			}
		}
	}
	if(!response.sort) {
		response.sort = 'status';
		response.sort_desc = true;
	}
	if (response.sort) {

		const reverse = (i) => {
			if(response.sort_desc) return -1*i;
			return i;
		};

		switch (response.sort) {
			case 'branch':
				response.data.sort(function(a, b) {
					if(!a.branch || !b.branch) return 0;
					if (a.branch < b.branch)
						return reverse(-1);
					if (a.branch > b.branch)
						return reverse(1);
					return 0;
				});
				break;
			case 'status':
				response.data.sort(function(a, b) {
					const order = {'running':4, 'stopped':3, 'offline':2, 'inactive':1};

					if(!a.status || !b.status) return 0;
					if (order[a.status] < order[b.status])
						return reverse(-1);
					if (order[a.status] > order[b.status])
						return reverse(1);
					return 0;
				});
				break;
			case 'vehicle_no':
				response.data.sort(function(a, b) {
					if(!a.reg_no || !b.reg_no) return 0;
					if (a.reg_no < b.reg_no)
						return reverse(-1);
					if (a.reg_no > b.reg_no)
						return reverse(1);
					return 0;
				});
				break;
			case 'location_time':
				response.data.sort(function(a, b){
					if(!a.location_time || !b.location_time) return 0;
					if (new Date(a.location_time).getTime() < new Date(b.location_time).getTime())
						return reverse(-1);
					if (new Date(a.location_time).getTime() > new Date(b.location_time).getTime())
						return reverse(1);
					return 0;
				});
				break;
			case 'positioning_time':
				response.data.sort(function(a, b){
					if(!a.positioning_time || !b.positioning_time) return 0;
					if (new Date(a.positioning_time).getTime() < new Date(b.positioning_time).getTime())
						return reverse(-1);
					if (new Date(a.positioning_time).getTime() > new Date(b.positioning_time).getTime())
						return reverse(1);
					return 0;
				});
				break;
		}
	}

	response.no_of_pages = parseInt(response.data.length/10) + (response.data.length%10>0 ? 1 : 0);
	if(!(response.page === null || response.page === undefined)) {
		response.data = response.data.splice(response.page*10,10);
	}
	// console.log(new Date(), 'finished searchSortAndPaginate');

}

exports.getGpsGaadiListForWeb = function (request, callback) {
	// winston.info(new Date().toString(), 'starting getGpsGaadiList');
	let response;
	GpsGaadi.getGpsGaadiListAsync(request)
		.then(function (res) {
			// winston.info(new Date().toString(), 'got getGpsGaadiList from cassandra');
			response = {
				status: 'OK',
				message: "GpsGaadi found.",
				user_id: request.user_id || request.login_uid
			};
			response.data = res.data;
			// console.log('length of gpsgaadi', res.data.length);
			response.pageState = res.pageState;
			let no_of_rows = 20;
			const copyResponse = JSON.parse(JSON.stringify(response));
			let splitedData, j = 0;
			while (copyResponse.data.length > 0) {
				splitedData = copyResponse.data.splice(0, no_of_rows);
				response.data = splitedData;
				if (j > 0) response.addMore = true;
				// console.log(splitedData.length, copyResponse.data.length);
				const sIMEI = [];
				for (let i = 0; i < response.data.length; i++) {
					if (response.data[i].imei) {
						sIMEI.push(response.data[i].imei);
					}
				}
				BPromise.promisify(fillGpsgaadiWithInfo)(sIMEI, JSON.parse(JSON.stringify(response)))
					.then(function (resp) {
						callback(resp);
					});
				j++;
			}
		}).error(function (err) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		response.message = err.toString();
		return callback(response);
	});
};

function fillGpsgaadiWithInfoTracksheet(res, callback)  {
	const oReq = {};
	oReq.feature = 'tracksheet';
	oReq.selected_uid = res.user_id;
	featureService.getFeatureAsync(oReq)
		.then(function (features) {
		if (features.data && features.data.shown_fields) {
			res.shown_fields = features.data.shown_fields;
		} else {
			res.shown_fields = ['branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
		}
		if (features.data && features.data.allowed_fields) {
			res.allowed_fields = features.data.allowed_fields;
		} else {
			res.allowed_fileds = ['branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
		}
	}).error(function (err) {
		winston.error(err);
	}).then(function () {
		const asyncTasks = [];
		asyncTasks.push(function (cb) {
			// winston.info(new Date(), 'getting landmarks');
			Landmark.getLandmarkAsync(res).then(function (landmarks) {
				// winston.info(new Date(), 'got landmarks');
				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};
					let nearest_landmark;
					let nearestDist = 1000000000000;
					for (let j = 0; j < landmarks.length; j++) {
						const dist = geozoneCalculator.getDistance(landmarks[j].location, devLoc);
						if (dist < nearestDist) {
							nearest_landmark = landmarks[j];
							nearestDist = dist;
						}
					}
					nearest_landmark.dist = nearestDist;
					res.data[i].nearest_landmark = JSON.parse(JSON.stringify(nearest_landmark));
					// winston.info(JSON.stringify(nearest_landmark));
				}
			}).error(function (err) {
				//winston.error(err);
				//console.log(err);
			}).then(function () {
				cb();
			});
		});

		asyncTasks.push(function (cb) {
			// winston.info(new Date(), 'getting geozones');
			dbUtil.getAsync(database.table_geozone, ['name', 'geozone', 'ptype', 'radius'], {user_id: res.user_id || res.login_uid}).then(function (geozones) {
				// winston.info(new Date(), 'got geozones', geozones.length);

				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};

					if (!devLoc.latitude || !devLoc.longitude) continue;

					for (let j = 0; j < geozones.length; j++) {
						const geozone = geozones[j];
                        if (!geozone.geozone || !geozone.geozone[0]) continue;

						let is_inside = false;

						if (geozone.ptype === 'polygon' || geozone.ptype === 'rectangle') {
							is_inside = geozoneCalculator.isPointInside(devLoc, geozone.geozone);
						} else if (geozone.ptype === 'circle') {
							is_inside = geozoneCalculator.isPointInCircle(devLoc, geozone.geozone[0], geozone.radius);
						}
						if (is_inside) {
							res.data[i].geozone = geozone.name;
							// console.log('is inside');
							break;
						}
					}
				}
			}).catch(function (err) {
				winston.error(err);
			}).then(function () {
				cb();
			});
		});
		async.parallel(asyncTasks, function () {
			// winston.info(new Date(), 'finished fillGpsgaadiWithInfo');
			for (let i = 0; i < res.data.length; i++) {
				if (res.data[i].nearest_landmark && res.data[i].nearest_landmark.dist < 200) {
					res.data[i].addr = res.data[i].nearest_landmark.name;
				}
				if (res.data[i].geozone) {
					res.data[i].addr = res.data[i].geozone;
					delete res.data[i].geozone;
					// winston.info('geozone as address');
				}
			}
			return callback(null, res);
		});
	});
}

function fillGpsgaadiWithInfo(sIMEI, res, callback) {
	// winston.info(new Date(), 'starting fillGpsgaadiWithInfo');
	deviceService.getDeviceStatusAsync(sIMEI).then(function (deviceResponse) {
		// winston.info(new Date(), 'got device from inv, starting for loop');
		for (let i = 0; i < res.data.length; i++) {
			for (let k = 0; k < deviceResponse.data.length; k++) {
				if (deviceResponse.data && deviceResponse.data[k] && deviceResponse.data[k].imei && res.data[i].imei && deviceResponse.data[k].imei.toString() === res.data[i].imei.toString()) {
					res.data[i].status = (deviceResponse.data[k].status === 'online') ? (deviceResponse.data[k].speed > 0 ? 'running' : 'stopped') : deviceResponse.data[k].status;
					res.data[i].lat = deviceResponse.data[k].lat;
					res.data[i].lng = deviceResponse.data[k].lng;
					res.data[i].speed = deviceResponse.data[k].speed;
					res.data[i].course = deviceResponse.data[k].course;
					res.data[i].positioning_time = deviceResponse.data[k].positioning_time;
					res.data[i].location_time = deviceResponse.data[k].location_time;
					res.data[i].datetime = deviceResponse.data[k].location_time;
					res.data[i].acc_high = deviceResponse.data[k].acc_high;
					res.data[i].geofence_status = deviceResponse.data[k].geofence_status;
					//res.data[i].nearest_landmark = 'landmark';
					res.data[i].on_trip = deviceResponse.data[k].on_trip;
					res.data[i].ac_on = deviceResponse.data[k].ac_on;
					res.data[i].addr = deviceResponse.data[k].address;
					res.data[i].dist_today = (dateutils.getMorning().getTime() < new Date(res.data[i].positioning_time).getTime()) ? deviceResponse.data[k].dist_today : 0;
					res.data[i].dist_yesterday = deviceResponse.data[k].dist_yesterday;
					res.data[i].dist_d_2 = deviceResponse.data[k].dist_d_2;
					res.data[i].dist_d_3 = deviceResponse.data[k].dist_d_3;
					res.data[i].dist_d_4 = deviceResponse.data[k].dist_d_4;
					res.data[i].dist_d_5 = deviceResponse.data[k].dist_d_5;
					res.data[i].dist_d_6 = deviceResponse.data[k].dist_d_6;
					res.data[i].dist_d_7 = deviceResponse.data[k].dist_d_7;

					res.data[i].dist_last_week = 0;
					res.data[i].dist_last_week += (res.data[i].dist_yesterday || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_2 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_3 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_4 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_5 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_6 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_7 || 0);
					otherUtil.setStatus(res.data[i]);
				}
			}
		}
		// winston.info(new Date(), 'ending for loop');
	}).then(function () {
		// winston.info(new Date(), 'getting features');
		const oReq = {};
		oReq.feature = 'tracksheet';
		oReq.selected_uid = res.user_id;
		return featureService.getFeatureAsync(oReq);
	}).then(function (features) {
		// winston.info(new Date(), 'got features');
		if (features.data && features.data.shown_fields) {
			res.shown_fields = features.data.shown_fields;
		} else {
			res.shown_fields = ['branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
		}
		if (features.data && features.data.allowed_fields) {
			res.allowed_fields = features.data.allowed_fields;
		} else {
			res.allowed_fileds = ['branch', 'reg_no', 'vehicle_type', 'driver_name', 'status', 'addr', 'positioning_time', 'location_time', 'stoppage_time', 'speed', 'dist_today', 'dist_yesterday', 'remark', 'nearest_landmark', 'geofence_status'];
		}
	}).error(function (err) {
		winston.error(err);
	}).then(function () {
		const asyncTasks = [];

		// asyncTasks.push(function(cb) {
		// winston.info(new Date().toString(), 'getting address');
		// addressService.getAddressFromArrayAsync(res.data)
		// .then(function(address) {
		// 	winston.info(new Date().toString(), 'got address');
		// 	// winston.error(JSON.stringify(addr));
		// 	for (const i = 0; i < res.data.length; i++) {
		// 		res.data[i].addr = address[res.data[i].imei];
		// 	}
		// })
		// .error(function(err) {
		// 	winston.error(err);
		// })
		//     .then(function(){
		//         cb();
		//     });
		// });

		asyncTasks.push(function (cb) {
			// winston.info(new Date(), 'getting landmarks');
			Landmark.getLandmarkAsync(res).then(function (landmarks) {
				// winston.info(new Date(), 'got landmarks');
				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};
					let nearest_landmark;
					let nearestDist = 1000000000000;
					for (let j = 0; j < landmarks.length; j++) {
						const dist = geozoneCalculator.getDistance(landmarks[j].location, devLoc);
						if (dist < nearestDist) {
							nearest_landmark = landmarks[j];
							nearestDist = dist;
						}
					}
					nearest_landmark.dist = nearestDist;
					res.data[i].nearest_landmark = JSON.parse(JSON.stringify(nearest_landmark));
					// winston.info(JSON.stringify(nearest_landmark));
				}
			}).error(function (err) {
				//winston.error(err);
				console.log(err);
			}).then(function () {
				cb();
			});
		});

		asyncTasks.push(function (cb) {
			// winston.info(new Date(), 'getting geozones');
			dbUtil.getAsync(database.table_geozone, ['name', 'geozone', 'ptype', 'radius'], {user_id: res.user_id || res.login_uid}).then(function (geozones) {
				// winston.info(new Date(), 'got geozones', geozones.length);

				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};

					if (!devLoc.latitude || !devLoc.longitude) continue;

					for (let j = 0; j < geozones.length; j++) {
						const geozone = geozones[j];

						let is_inside = false;

						if (geozone.ptype === 'polygon') {
							is_inside = geozoneCalculator.isPointInside(devLoc, geozone.geozone);
						} else if (geozone.ptype === 'circle') {

							is_inside = geozoneCalculator.isPointInCircle(devLoc, geozone.geozone[0], geozone.radius);
						}
						if (is_inside) {
							res.data[i].geozone = geozone.name;
							// console.log('is inside');
							break;
						}
					}
				}
			}).catch(function (err) {
				winston.error(err);
			}).then(function () {
				cb();
			});
		});
		/*
		 asyncTasks.push(function(cb) {
		 Toll.getTollAsync()
		 .then(function(tolls) {
		 for(let i = 0; i < res.data.length; i++){
		 let devLoc = {
		 latitude: res.data[i].lat,
		 longitude: res.data[i].lng
		 };
		 let nearest_toll;
		 let nearestDist = 1000000000000;
		 for(let j = 0; j < tolls.length; j++) {
		 let tollLoc = {
		 latitude: tolls[j].latitude,
		 longitude: tolls[j].longitude
		 };
		 let dist = geozoneCalculator.getDistance(tollLoc, devLoc);
		 if(dist < nearestDist) {
		 nearest_toll = tolls[j];
		 nearestDist = dist;
		 }
		 }
		 nearest_toll.dist = nearestDist;
		 res.data[i].nearest_toll = JSON.parse(JSON.stringify(nearest_toll));
		 }
		 }).error(function(err) {
		 winston.error(err);
		 }).then(function(){
		 cb();
		 });
		 });
		 */
		async.parallel(asyncTasks, function () {
			// winston.info(new Date(), 'finished fillGpsgaadiWithInfo');
			for (let i = 0; i < res.data.length; i++) {
				if (res.data[i].nearest_landmark && res.data[i].nearest_landmark.dist < 200) {
					res.data[i].addr = res.data[i].nearest_landmark.name;
				}
				if (res.data[i].geozone) {
					res.data[i].addr = res.data[i].geozone;
					delete res.data[i].geozone;
					// winston.info('geozone as address');
				}
			}
			return callback(null, res);
		});
	});
}

function fillGpsgaadiWithInfoMongo(sIMEI, res, callback) {
	// winston.info(new Date(), 'starting fillGpsgaadiWithInfo');
	deviceService.getDeviceStatusAsync(sIMEI).then(function (deviceResponse) {
		for (let i = 0; i < res.data.length; i++) {
			for (let k = 0; k < deviceResponse.data.length; k++) {
				if (deviceResponse.data && deviceResponse.data[k] && deviceResponse.data[k].imei && res.data[i].imei && deviceResponse.data[k].imei.toString() === res.data[i].imei.toString()) {
					res.data[i].imei=deviceResponse.data[k].imei.toString();
					//res.data[i].status = (deviceResponse.data[k].status === 'online') ? (deviceResponse.data[k].speed > 0 ? 'running' : 'stopped') : deviceResponse.data[k].status;
					res.data[i].lat = deviceResponse.data[k].lat;
					res.data[i].lng = deviceResponse.data[k].lng;
					res.data[i].speed = deviceResponse.data[k].speed;
					res.data[i].course = deviceResponse.data[k].course;
					res.data[i].positioning_time = deviceResponse.data[k].positioning_time;
					res.data[i].location_time = deviceResponse.data[k].location_time;
					res.data[i].datetime = deviceResponse.data[k].location_time;
					res.data[i].acc_high = deviceResponse.data[k].acc_high;
					res.data[i].geofence_status = deviceResponse.data[k].geofence_status;
					res.data[i].nearest_landmark = 'landmark';
					res.data[i].on_trip = deviceResponse.data[k].on_trip;
					res.data[i].ac_on = deviceResponse.data[k].ac_on;
					res.data[i].addr = deviceResponse.data[k].address;
					res.data[i].dist_today = (dateutils.getMorning().getTime() < new Date(res.data[i].positioning_time).getTime()) ? deviceResponse.data[k].dist_today : 0;
					res.data[i].dist_yesterday = deviceResponse.data[k].dist_yesterday;
					res.data[i].dist_d_2 = deviceResponse.data[k].dist_d_2;
					res.data[i].dist_d_3 = deviceResponse.data[k].dist_d_3;
					res.data[i].dist_d_4 = deviceResponse.data[k].dist_d_4;
					res.data[i].dist_d_5 = deviceResponse.data[k].dist_d_5;
					res.data[i].dist_d_6 = deviceResponse.data[k].dist_d_6;
					res.data[i].dist_d_7 = deviceResponse.data[k].dist_d_7;

					res.data[i].dist_last_week = 0;
					res.data[i].dist_last_week += (res.data[i].dist_yesterday || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_2 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_3 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_4 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_5 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_6 || 0);
					res.data[i].dist_last_week += (res.data[i].dist_d_7 || 0);
					otherUtil.setStatus(res.data[i]);
				}
			}
		}
		// winston.info(new Date(), 'ending for loop');
	}).then(function () {
		const asyncTasks = [];
		asyncTasks.push(function (cb) {
			// winston.info(new Date(), 'getting landmarks');
			//console.log('getting landmark for '+ res.user_id);
			Landmark.getLandmarkAsync(res).then(function (landmarks) {
				// winston.info(new Date(), 'got landmarks');
				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};
					let nearest_landmark;
					let nearestDist = 1000000000000;
					for (let j = 0; j < landmarks.length; j++) {
						const dist = geozoneCalculator.getDistance(landmarks[j].location, devLoc);
						if (dist < nearestDist) {
							nearest_landmark = landmarks[j];
							nearestDist = dist;
						}
					}
					nearest_landmark.dist = nearestDist;
					res.data[i].nearest_landmark = JSON.parse(JSON.stringify(nearest_landmark));
					// winston.info(JSON.stringify(nearest_landmark));
				}
			}).error(function (err) {
				//console.log(err);
               // cb();
			}).then(function () {
              //  console.log('finished landmark for '+ res.user_id);
				cb();
			});
		});

		asyncTasks.push(function (cb) {
			dbUtil.getAsync(database.table_geozone, ['name', 'geozone', 'ptype', 'radius'], {user_id: res.user_id || res.login_uid}).then(function (geozones) {
				for (let i = 0; i < res.data.length; i++) {
					const devLoc = {
						latitude: res.data[i].lat,
						longitude: res.data[i].lng
					};

					if (!devLoc.latitude || !devLoc.longitude) continue;

					for (let j = 0; j < geozones.length; j++) {
						const geozone = geozones[j];

						let is_inside = false;

						if (geozone.ptype === 'polygon') {
							is_inside = geozoneCalculator.isPointInside(devLoc, geozone.geozone);
						} else if (geozone.ptype === 'circle') {

							is_inside = geozoneCalculator.isPointInCircle(devLoc, geozone.geozone[0], geozone.radius);
						}
						if (is_inside) {
							res.data[i].geozone = geozone.name;
							break;
						}
					}
				}
			}).catch(function (err) {
				//winston.error(err);
			}).then(function () {
				cb();
			});
		});
		async.parallel(asyncTasks, function () {
			for (let i = 0; i < res.data.length; i++) {
				if (res.data[i].nearest_landmark && res.data[i].nearest_landmark.dist < 200) {
					res.data[i].addr = res.data[i].nearest_landmark.name;
				}
				if (res.data[i].geozone) {
					res.data[i].addr = res.data[i].geozone;
					delete res.data[i].geozone;
				}
			}
			return callback(null, res);
		});
	});
}

// function fillGpsgaadiWithInfoTracksheetForLMS(res, callback)  {
// 	const asyncTasks = [];
// 	asyncTasks.push(function (cb) {
// 		// winston.info(new Date(), 'getting landmarks');
// 		Landmark.getLandmarkAsync(res).then(function (landmarks) {
// 			// winston.info(new Date(), 'got landmarks');
// 			for (let i = 0; i < res.data.length; i++) {
// 				const devLoc = {
// 					latitude: res.data[i].lat,
// 					longitude: res.data[i].lng
// 				};
// 				let nearest_landmark;
// 				let nearestDist = 1000000000000;
// 				for (let j = 0; j < landmarks.length; j++) {
// 					const dist = geozoneCalculator.getDistance(landmarks[j].location, devLoc);
// 					if (dist < nearestDist) {
// 						nearest_landmark = landmarks[j];
// 						nearestDist = dist;
// 					}
// 				}
// 				nearest_landmark.dist = nearestDist;
// 				res.data[i].nearest_landmark = JSON.parse(JSON.stringify(nearest_landmark));
// 				// winston.info(JSON.stringify(nearest_landmark));
// 			}
// 		}).error(function (err) {
// 			//winston.error(err);
// 			//console.log(err);
// 		}).then(function () {
// 			cb();
// 		});
// 	});
//
// 	asyncTasks.push(function (cb) {
// 		// winston.info(new Date(), 'getting geozones');
// 		dbUtil.getAsync(database.table_geozone, ['name', 'geozone', 'ptype', 'radius'], {user_id: res.user_id || res.login_uid}).then(function (geozones) {
// 			// winston.info(new Date(), 'got geozones', geozones.length);
//
// 			for (let i = 0; i < res.data.length; i++) {
// 				const devLoc = {
// 					latitude: res.data[i].lat,
// 					longitude: res.data[i].lng
// 				};
//
// 				if (!devLoc.latitude || !devLoc.longitude) continue;
//
// 				for (let j = 0; j < geozones.length; j++) {
// 					const geozone = geozones[j];
// 					if (!geozone.geozone || !geozone.geozone[0]) continue;
//
// 					let is_inside = false;
//
// 					if (geozone.ptype === 'polygon' || geozone.ptype === 'rectangle') {
// 						is_inside = geozoneCalculator.isPointInside(devLoc, geozone.geozone);
// 					} else if (geozone.ptype === 'circle') {
// 						is_inside = geozoneCalculator.isPointInCircle(devLoc, geozone.geozone[0], geozone.radius);
// 					}
// 					if (is_inside) {
// 						res.data[i].geozone = geozone.name;
// 						res.data[i].geofence = {
// 							name:geozone.name,
//                             category:'yard'
// 						};
// 						// console.log('is inside');
// 						break;
// 					}
// 				}
// 			}
// 		}).catch(function (err) {
// 			winston.error(err);
// 		}).then(function () {
// 			cb();
// 		});
// 	});
// 	async.parallel(asyncTasks, function () {
// 		// winston.info(new Date(), 'finished fillGpsgaadiWithInfo');
// 		for (let i = 0; i < res.data.length; i++) {
// 			if (res.data[i].nearest_landmark && res.data[i].nearest_landmark.dist < 200) {
// 				res.data[i].addr = res.data[i].nearest_landmark.name;
// 			}
// 			if (res.data[i].geozone) {
// 				res.data[i].addr = res.data[i].geozone;
// 				delete res.data[i].geozone;
// 				// winston.info('geozone as address');
// 			}
// 		}
// 		return callback(null, res);
// 	});
// }

function fillGpsgaadiWithInfoTracksheetForLMSV2(res, callback)  {

		// winston.info(new Date(), 'getting geozones');
		dbUtil.getAsync(database.table_geozone, ['name', 'geozone', 'ptype', 'radius'], {user_id: res.user_id || res.login_uid}).then(function (geozones) {
			// winston.info(new Date(), 'got geozones', geozones.length);

			for (let i = 0; i < res.data.length; i++) {
				const devLoc = {
					latitude: res.data[i].lat,
					longitude: res.data[i].lng
				};

				if (!devLoc.latitude || !devLoc.longitude) continue;

				for (let j = 0; j < geozones.length; j++) {
					const geozone = geozones[j];
					if (!geozone.geozone || !geozone.geozone[0]) continue;

					let is_inside = false;

					if (geozone.ptype === 'polygon' || geozone.ptype === 'rectangle') {
						is_inside = geozoneCalculator.isPointInside(devLoc, geozone.geozone);
					} else if (geozone.ptype === 'circle') {
						is_inside = geozoneCalculator.isPointInCircle(devLoc, geozone.geozone[0], geozone.radius);
					}
					if (is_inside) {
						res.data[i].addr = geozone.name;
						res.data[i].geofence = {
							name:geozone.name,
							category:'yard'
						};
						// console.log('is inside');
						break;
					}
				}
			}

			return callback(null, res);
		}).catch(function (err) {
			winston.error(err);
		})

}

exports.updateGpsGaadi = function (request, callback) {
	GpsGaadi.updateGpsGaadi(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'GpsGaadi update registration failed';
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi update done succefully';
			response.data = res;
		}
		return callback(response);
	});
};

exports.associateGpsGaadiWithUser = function (request, callback) {
	GpsGaadi.associateGpsGaadiWithUser(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'GpsGaadi update registration failed';
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi update done succefully';
			//response.data = res;
		}
		return callback(response);
	});
};

exports.registerGpsGaadi = function (request, callback) {
	GpsGaadi.registerGpsGaadi(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'GpsGaadi registration failed';
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi registration done succefully';
		}
		return callback(response);
	});
};

exports.addGpsGaadiFromPool = function (request, callback) {
	const oReq = {};
	if (request.imei) {
		oReq.request = 'device_by_imei';
		oReq.imei = request.imei;
	} else if (request.reg_no) {
		oReq.request = 'device_by_reg_no';
		oReq.reg_no = request.reg_no;
	}
	Device.getDevice(oReq, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'vehicle  not found in Database.';
			return callback(response);
		} else {
			let newReq;
			if (res instanceof Array) {
				if (res.length > 0) {
					newReq = res[0];
				} else {
					response.message = 'vehicle  not found in Database.';
					return callback(response);
				}
			} else {
				newReq = res;
			}
			if (newReq.imei) {
				newReq.user_id = request.selected_uid || request.login_uid;
				newReq.created_at = new Date();
				newReq.ownership = 'partner';
				GpsGaadi.addGpsGaadiFromPool(newReq, function (err, res) {
					const response = {
						status: 'ERROR',
						message: ""
					};
					if (err) {
						response.message = err.toString();
					} else if (!res) {
						response.message = 'vehicle addition failed.';
					} else {
						response.status = 'OK';
						response.message = 'vehicle added from pool';
						response.data = newReq;
					}
					return callback(response);
				});
			} else {
				response.message = 'vehicle  not found in Database.';
				return callback(response);
			}
		}
	});

};

exports.removeGpsGaadi = function (request, callback) {
	GpsGaadi.removeGpsGaadi(request, function (err, res) {
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
		} else if (!res) {
			response.message = 'GpsGaadi removal failed';
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi removed succefully';
		}
		return callback(response);
	});
};

exports.getTracksheetDataForLMS = function (request, callback) {
	// winston.info(new Date().toString(), 'starting getGpsGaadiList');
	let response;
	GpsGaadi.getGpsGaadiListAsync(request)
		.then(function (res) {
			// winston.info(new Date(), 'got getGpsGaadiList from cassandra');
			if(res.data && res.data[0]){
				response = {
					status: 'OK',
					message: "GpsGaadi found.",
					user_id: request.user_id || request.login_uid,
					data:[]
				};
				const data=[];
				const packetSize=100;
				let sIMEI=[];
				request.count = {'running':0,'stopped':0,'offline':0,'inactive':0};
				request.total_count=res.data.length;
				for (let i = 0; i < res.data.length; i++) {
					if (res.data[i].imei) {
						sIMEI.push(res.data[i].imei);
					}
				}
				deviceService.getDeviceStatusAsync(sIMEI)
					.then(function (deviceResponse) {
					// winston.info(new Date(), 'got device from inv, starting for loop');
					for (let i = 0; i < res.data.length; i++) {
						for (let k = 0; k < deviceResponse.data.length; k++) {
							if (deviceResponse.data && deviceResponse.data[k] && deviceResponse.data[k].imei && res.data[i].imei && deviceResponse.data[k].imei.toString () === res.data[i].imei.toString ()) {
								res.data[i].status = (deviceResponse.data[k].status === 'online') ? (deviceResponse.data[k].speed > 0 ? 'running' : 'stopped') : (deviceResponse.data[k].status || 'offline');
								res.data[i].driver_name = deviceResponse.data[k].driver_name;
								res.data[i].ip = deviceResponse.data[k].ip;
								res.data[i].driver_name2 = deviceResponse.data[k].driver_name2;
								res.data[i].rfid1 = deviceResponse.data[k].rfid1;
								res.data[i].rfid2 = deviceResponse.data[k].rfid2;
								res.data[i].lat = deviceResponse.data[k].lat;
								res.data[i].lng = deviceResponse.data[k].lng;
								res.data[i].speed = deviceResponse.data[k].speed;
								res.data[i].course = deviceResponse.data[k].course;
								res.data[i].positioning_time = deviceResponse.data[k].positioning_time;
								res.data[i].location_time = deviceResponse.data[k].location_time;
								res.data[i].datetime = deviceResponse.data[k].location_time;
								res.data[i].acc_high = deviceResponse.data[k].acc_high;
								res.data[i].geofence_status = deviceResponse.data[k].geofence_status;
								res.data[i].on_trip = deviceResponse.data[k].on_trip;
								res.data[i].ac_on = deviceResponse.data[k].ac_on;
								res.data[i].addr = deviceResponse.data[k].address;
								res.data[i].dist_today = (dateutils.getMorning ().getTime () < new Date (res.data[i].positioning_time).getTime ()) ? deviceResponse.data[k].dist_today : 0;
								res.data[i].dist_yesterday = deviceResponse.data[k].dist_yesterday;
								res.data[i].dist_d_2 = deviceResponse.data[k].dist_d_2;
								otherUtil.setStatus (res.data[i]);
								switch (res.data[i].status) {
									case 'running':
										request.count.running++;
										break;
									case 'stopped':
										request.count.stopped++;
										break;
									case 'offline':
										request.count.offline++;
										break;
									default    :
										request.count.inactive++;
										break;
								}
							}
						}
					}
					response.data = res.data;
					response.shownField = false;
					return BPromise.promisify(fillGpsgaadiWithInfoTracksheetForLMSV2)(response);
				})
				.then(function (gpsResp) {
					callback(gpsResp);
				});
			}else {
				response = {
					status: 'OK',
					message: "GpsGaadi found.",
					user_id: request.user_id || request.login_uid,
					data:[],
					packetId:0
				};
				callback(response);
			}

		})
};

exports.getGpsGaadiForTripBasedGps = function (request, callback) {
	GpsGaadi.getGpsGaadi(request, function (err, res) {
		//  .log(new Date(), 'got gpsgaadi');
		const response = {
			status: 'ERROR',
			message: ""
		};
		if (err) {
			response.message = err.toString();
			return callback(response);
		} else if (!res) {
			response.message = 'GpsGaadi not found';
			return callback(response);
		} else {
			response.status = 'OK';
			response.message = 'GpsGaadi found.';
			let sIMEI = [];
			for (let i = 0; i < res.length; i++) {
				if (res[i].imei) {
					sIMEI.push(res[i].imei);
				}
			}
			sIMEI = sIMEI.toString();
			deviceService.getDeviceStatus(sIMEI, function (err, deviceResponse) {
				// console.log(new Date(), 'got inv');
				if (deviceResponse.status === 'OK' && deviceResponse.data) {
					for (let i = 0; i < res.length; i++) {
						for (let k = 0; k < deviceResponse.data.length; k++) {
							if (deviceResponse.data[k] && deviceResponse.data[k].imei && res[i].imei && deviceResponse.data[k].imei.toString() === res[i].imei.toString()) {
								res[i].status = deviceResponse.data[k].status;
								res[i].device_type = deviceResponse.data[k].device_type;
								//res[i].lat = deviceResponse.data[k].lat;
								//res[i].lng = deviceResponse.data[k].lng;
								//res[i].speed = deviceResponse.data[k].speed;
								//res[i].course = deviceResponse.data[k].course;
								//res[i].location_time = deviceResponse.data[k].location_time;
								res[i].datetime = deviceResponse.data[k].location_time;
								//res[i].positioning_time = deviceResponse.data[k].positioning_time;
								//res[i].acc_high = deviceResponse.data[k].acc_high;
								//res[i].on_trip = deviceResponse.data[k].on_trip;
								//res[i].ac_on = deviceResponse.data[k].ac_on;
								res[i].addr = deviceResponse.data[k].address;
								/*
								if (deviceResponse.data[k].status === 'offline' && (Date.now() - new Date(deviceResponse.data[k].positioning_time).getTime()) <= 3600000) {
									res[i].status = 'online';
								}
								*/
							}
						}
					}
					response.data = res;
					return callback(response);
				}
			});
		}
	});
};
