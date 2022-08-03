const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

/**postData structure
 *  {
 *      userIds: ["kamal"],
 *      server_intercommunication_key:"-#'&tW&wk3eaodR"
 *      data:{
 *          title: "Notif halt"
 *          content: "blah"
 *      }
 *  }
* */

module.exports.sendNotifDataToNotifServer = function (postData, callback) {
    postData.server_intercommunication_key ="-#'&tW&wk3eaodR";

    let req = http.request(options, function (res) {
        console.log('STATUS:', res.statusCode);
        console.log('HEADERS:', JSON.stringify(res.headers));

        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            console.log('BODY:', chunk);

        });
        res.on('end', function () {
            console.log('No more data in response.');
        });
    });

    req.on('error', function (e) {
        console.log('Problem with request:', e.message);
    });

    req.write(JSON.stringify(postData));
    req.end();
};