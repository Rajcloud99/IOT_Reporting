const winston = require('../utils/logger');

/** returns true if api usage limit exceeds, else returns false **/
module.exports.addIncrementAPIUsage = function(userId,ipAddress,dailyLimit,next){
    APIUsageModel.findOneAsync({userId:userId,ipAddress:ipAddress})
        .then(function(api_usage_doc) {
            if (api_usage_doc && api_usage_doc.daily < dailyLimit){
                APIUsageModel.findOneAndUpdateAsync({_id:api_usage_doc._id},{$inc:{total:1,daily:1}});
                return next(null,false);
            }else if (api_usage_doc && api_usage_doc.daily === dailyLimit){
                return next(null,true);
            }else{
                let toInsert = {"userId":userId, "ipAddress": ipAddress, "total": 1, "daily": 1};
                let newApiUsageDoc = new APIUsageModel(toInsert);
                newApiUsageDoc.save(toInsert);
                return next(null, false);
            }
        })
        .catch(function(err) {
            winston.error("error in addIncrementAPIUsage:" + err);
            return next(err);
        });
};

module.exports.resetDailyAPIUsageCounters = function() {
    APIUsageModel.updateManyAsync({}, {$set: {daily: 0}});
};

