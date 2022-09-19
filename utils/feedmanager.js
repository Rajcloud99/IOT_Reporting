const feedtype = require('../config').feedtype;
const BPromise = require('bluebird');
const otherUtil = BPromise.promisifyAll(require('../utils/otherutils'));
const geolib = require('geolib');

class FeedManager {

	constructor(user_id, cb) {
		this.user_id = user_id;
		this.feedRequestsForDevice = {};
		this.deviceCache = {};
		this.callback = cb;
		this.receivermanager = require('./receivermanager');
	}

	handleFeed(response) {
	    //console.log('feedmanager live feed data:' + response.data.device_id,this.feedRequestsForDevice[response.data.device_id]);
		if (response.status === 'OK' && this.feedRequestsForDevice[response.data.device_id] && this.callback) {
			if(this.feedRequestsForDevice[response.data.device_id].destination || this.feedRequestsForDevice[response.data.device_id].stop){
				let cPoint = {latitude:response.data.latitude || response.data.lat ,longitude:response.data.longitude || response.data.lng};
				let avgSpeed = 40;//KM/Hr
				response.data.destination = this.feedRequestsForDevice[response.data.device_id].destination;
				response.data.stop = this.feedRequestsForDevice[response.data.device_id].stop;
				if(response.data.destination && response.data.destination.latitude){
					response.data.destination = this.feedRequestsForDevice[response.data.device_id].destination;
					let destPoint = {latitude:response.data.destination.latitude,longitude:response.data.destination.longitude};
					response.data.destination.dist = geolib.getDistance(cPoint,destPoint);
					response.data.destination.distUnit = "Meter";
					response.data.destination.eta = (((response.data.destination.dist/1000)/avgSpeed)* 60).toFixed(2);
					response.data.destination.etaUnit = "Min";
				}
				if(response.data.stop && response.data.stop.latitude){
					response.data.stop = this.feedRequestsForDevice[response.data.device_id].stop;
					let stopPoint = {latitude:response.data.stop.latitude,longitude:response.data.stop.longitude};
					response.data.stop.dist = geolib.getDistance(cPoint, stopPoint);
					response.data.stop.distUnit = "Meter";
					response.data.stop.eta = (((response.data.stop.dist / 1000) / avgSpeed) * 60).toFixed(2);
					response.data.stop.etaUnit = "Min";
				}
			}
			/*
			if (this.deviceCache[response.data.device_id]) {
				this.deviceCache[response.data.device_id].status = response.data.status;
				response.data = JSON.parse(JSON.stringify(this.deviceCache[response.data.device_id]));
				this.deviceCache[response.data.device_id] = null;
				delete this.deviceCache[response.data.device_id];
			}
			*/
			// winston.info('sending live feed data to cb');
			//console.log(response.data.status);
			if(response.request == 'live_feedV2'){
                otherUtil.setStatus(response.data,5);
            }
            //console.log(response.data.status);
			this.callback(response);
		}else if(response.request == 'alerts'){
			//TODO check if device suncribed alert or not
			//this.callback(response);
		}else{
			console.log('no feed handling for ',response.data.device_id);
		}
	}

	handleAlert(data) {
		 //winston.info('feedmanager alerts data:' + JSON.stringify(data));
		if (this.callback) {
			// winston.info('sending alerts data to cb');
			this.callback(data);
		}
	}

	startFeed(device, device_type) {
		// if(feedRequestsForDevice[device_id]) return;
		// winston.info('feedmanager: requesting for feed');
		if (!device_type) //TODO temporaty
			device_type = "tr06";
		this.receivermanager.sendMessage(device.device_id, device_type, feedtype.live_feed);
		this.feedRequestsForDevice[device.device_id] = device;
		// this.deviceCache[device.device_id] = device;
	}

    startFeedV2(device, device_type) {
        // if(feedRequestsForDevice[device_id]) return;
        // winston.info('feedmanager: requesting for feed');
        if (!device_type) //TODO temporaty
            device_type = "tr06";
        //console.log(feedtype.live_feedV2,device.device_id);
        this.receivermanager.sendMessage(device.device_id, device_type, feedtype.live_feedV2);
        this.feedRequestsForDevice[device.device_id] = device;
        // this.deviceCache[device.device_id] = device;
    }

	startFeedForDestAndStops(device, device_type) {
		// if(feedRequestsForDevice[device_id]) return;
		// winston.info('feedmanager: requesting for feed');
		if (!device_type) //TODO temporaty
			device_type = "atlanta_e101";
		//console.log(feedtype.live_feedV2,device.device_id);
		this.receivermanager.sendMessage(device.device_id, device_type, feedtype.live_feedV2);
		this.feedRequestsForDevice[device.device_id] = {destination:device.destination,stop:device.stop,speed:device.speed};
		// this.deviceCache[device.device_id] = device;
	}

	stopFeed(device_id, device_type) {
		if (!device_type) //TODO temporaty
			device_type = "atlanta_e101";
		if (this.feedRequestsForDevice[device_id]) {
			// this.receivermanager.sendMessage(device_id, device_type, feedtype.stop_feed);
			delete this.feedRequestsForDevice[device_id];
		}
	}

	stopAllFeeds() {
		for (const key in this.feedRequestsForDevice) {
			if (this.feedRequestsForDevice[key]) {
				// this.receivermanager.sendMessage(device_id, device_type, feedtype.stop_feed);
				delete this.feedRequestsForDevice[key];
			}
		}
	}

}

module.exports = FeedManager;
