const dbUtils = require('../utils/dbUtil');
const async = require('async');
const deviceService = require('./deviceService');

exports.getReportForDevice = (imei, type, start, end, callback) => {
	const asyncTasks = [];
	let activity, report;
	asyncTasks.push(done => {
		deviceService.getActivityReport(imei, start, end, 'web', true, (err, res) => {
			activity = res;
			done();
		});
	});
	asyncTasks.push(done => {
		dbUtils.getFromQueryAsync('select * from report_boolean where imei = ? and type = ? and datetime >= ? and datetime <= ?', [imei, type, start, end]).then(res => {
			report = res;
			done();
		});
	});

	async.parallel(asyncTasks, () => {
		const resp = {};
		resp.imei = imei;

		let data = [];
		let entry = {};
		for (let i = 0; i < report.length; i++) {
			const datum = report[i];
			if (i === 0 && datum.offline) continue;
			if (!entry.start_time) {
				entry.start_time = datum.datetime;
				entry.value = datum.value;
			} else {
				if (datum.offline) {
					if (datum.value === entry.value) {
						entry.end_time = datum.datetime;
						data.push(JSON.parse(JSON.stringify(entry)));

					}
					entry = {};
				} else {
					if (datum.value !== entry.value) {
						entry.end_time = datum.datetime;
						data.push(JSON.parse(JSON.stringify(entry)));
						entry = {start_time: datum.datetime, value: datum.value};
					}
				}

			}


		}

		if (data.length > 0) {
			resp.status = 'OK';
			resp.data = data;
			resp.message = 'Found data';
		} else {
			resp.status = 'ERROR';
			resp.message = 'No data';
		}
		callback(resp);
	});

};