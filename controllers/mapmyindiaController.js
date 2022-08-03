/**
 * @Author: kamal
 * @Date:   2018-01-15
 */
const BPromise = require('bluebird');
const dateUtil = require('../utils/dateutils');
const router = require('express').Router();
const async = BPromise.promisifyAll(require('async'));
const config = require('../config');
const request = require('request');

router.post("/*", function (req, res, next) {
    let base_url = config.mapmyindia.r_b_url +config.mapmyindia.r_lic_key+ req.url;
	//https://apis.mapmyindia.com/advancedmaps/v1/vc795p286g3jn764zca481cd27m28hz3/autosuggest?q=new%20delhi
    let key = req.query.authcode;
    let code = 'fubYFBw785fk';
    if (base_url) {
        request(base_url, function (error, response, body) {
            if (!error && (response.body || body) && (response.statusCode < 400)) {
                body = JSON.parse(response.body || body);
                if(body){
                    return res.status(body.responseCode).send(body);
                }else{
					return res.status(200).send(response.body);
                }
            } else {
                return res.status(200).send(response.body);
            }
        });
    }else{
        return res.status(200).send({message:'URL is not correct'});
    }
});

let authResponse;
router.get("/atlas/*", function (req, res, next) {
	let authUrl = "https://outpost.mapmyindia.com/api/security/oauth/token";
	let authQuery = {
		grant_type: "client_credentials",
		client_id: "fuMmOYQuBeAl1Es43PiV8fb8RqUcmKD8ZryVH-_HYHKes7LnfIcR6rORGaKqTH-f",
		//client_id: "vFCQtO8J0WBfnjk-TPq0sLbK-xBfb6WvTQUotBikQpPVUCMZd3NOXKOIDybC59gsz5pe5yUgL6U=",
		client_secret: "S982Zy3GJW83wD86I0JWZSuXy2muGeU_RQsazDxAnuAj_J__vHbO2eKuQQ7gBvPZ"
		//client_secret: "7_ZZHmp0pKYUs2AS6FR3CaBtISP_lSiVfrGX3BudvZMtj_u-TBKCaXO3p2gFWhekYWx4j4o_EBbpdLYtf4I12A=="
	};
	let currentTime = Date.now()/1000;
	if(authResponse && authResponse.access_token && currentTime - authResponse.time < authResponse.expires_in-20){
		getData()
	}else {
		request.post(authUrl,{form: authQuery}, function (error, response, body) {
			if (!error && (response.statusCode < 400)) {
				try{
					body = JSON.parse(response.body || body);
					authResponse = body;
					authResponse.time = Date.now()/1000;
					getData()
				}
				catch (err) {
					console.error(err);
					return res.status(500).send();
				}
			} else {
				return res.status(200).send(error);
			}
		});
	}


	function getData () {
		let base_url = config.mapmyindia.atlas_url +req.url.replace("/atlas","")+"&access_token="+authResponse.access_token;
		let key = req.query.authcode;
		let code = 'fubYFBw785fk';
		//if (key !== code) return res.status(200).send('No data');
		//base_url = base_url + req.query.q;
		if (base_url) {
			request(base_url, function (error, response, body) {
				if (!error && (response.statusCode < 400)) {
					try{
						body = JSON.parse(response.body || body);
						return res.status(response.statusCode).send(body);
					}
					catch (err) {
						console.error('auto sugest error',err);
						return res.status(500).send();
					}
				} else {
					return res.status(200).send(error);
				}
			});
		}else{
			return res.status(200).send({message:'URL is not correct'});
		}
	}

});

router.get("/*", function (req, res, next) {
    let base_url = config.mapmyindia.r_b_url +config.mapmyindia.r_lic_key+ req.url;
    //https://apis.mapmyindia.com/advancedmaps/v1/vc795p286g3jn764zca481cd27m28hz3/autosuggest?q=new%20delhi
    let key = req.query.authcode;
    let code = 'fubYFBw785fk';
    if (base_url) {
        request(base_url, function (error, response, body) {
            if (!error && (response.body || body) && (response.statusCode < 400)) {
                body = JSON.parse(response.body || body);
                if(body){
                    res.status(body.responseCode).send(body);
                }else{
                    res.status(200).send({message:'data not found'});
                }

            } else {
                res.status(200).send(error);
            }
        });
    }else{
        return res.status(200).send({message:'URL is not correct'});
    }
});
module.exports = router;
