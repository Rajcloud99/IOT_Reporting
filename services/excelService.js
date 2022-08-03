//const gpsService = require('../services/gpsService');
//const deviceService = require('../services/deviceService');
//const exec = require('child_process').exec;
const mkdirp = require('mkdirp');
const Excel = require('exceljs');
//Excel.config.setValue('promise', require('bluebird'));
const dateutils = require('../utils/dateutils');
//const mathutils = require('../utils/mathutils');
const async = require('async');
//const request = require('request');
const activeusersmanager = require('../utils/activeusersmanager');
const dateUtil = require('../utils/dateutils');
const otherUtil = require('../utils/otherutils');
const addressService = require('../services/addressService');
const externalip = require('../config').externalip;
//const moment = require('moment-timezone');
const moment = require('moment');
const path = require('path');


const alphabet = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('');

const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'b2d8b2'
    }
};

const columnFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
        argb: 'ccccff'
    }
};
let addWorkbookRow = function (data, workbook, headers, rowNum, showNA, options = {}) {
    let count = 0;
    let show = (showNA === false) ? "" : "NA";
    for (let j = 0; j < headers.length; j++) {

        if (j % 26 == 0) {
            count = 0
        }
        let column;
        if (j > 51) {
            column = "B" + (String.fromCharCode(65 + count));
        } else if (j > 25) {
            column = "A" + (String.fromCharCode(65 + count));
        } else {
            column = String.fromCharCode(65 + j);
        }
        /*
        if (j === 26) {
          count = 0
        }
        let column = (j > 25) ? ("A" + (String.fromCharCode(65 + count))) : String.fromCharCode(65 + j);

     */
        workbook.getCell(column + rowNum).value = (typeof data[headers[j]] === "number") ? data[headers[j]] : (data[headers[j]] || show);
        (typeof data[headers[j]] === "string" && data[headers[j]].length > 40) && (workbook.getCell(column + rowNum).alignment = {wrapText: true});
        if (data.hasOwnProperty(headers[j]) && options) {
            if (options.fill)
                workbook.getCell(column + rowNum).fill = options.fill;
           /*
            if (options.alignment)
                workbook.getCell(column + rowNum).alignment = {
                    ... options && options.alignment,
                    ...((typeof data[headers[j]] === "string" && data[headers[j]].length > 40) ? {wrapText: true} : {})
                };
            */
            if (options.border)
                workbook.getCell(column + rowNum).border = options.border;
            if (options.numFmt && options.numFmt[headers[j]]) {
                workbook.getCell(column + rowNum).numFmt = options.numFmt[headers[j]];
            }
        }
        count++;
    }
};

exports.getParkingReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    for (const key in data.data) {
        const device = data.data[key];

        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 6, 'Parking Report');

        for (let i = 2; i < 8; i++) {
            ws.mergeCells('A' + i + ':D' + i);
            ws.mergeCells('E' + i + ':F' + i);
        }

        mergeCells(ws, 8, 8);
        if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no
        } else {
            ws.getCell('A3').value = 'Reg No : ' + key;
        }
        ws.getCell('E2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time);
        ws.getCell('E3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time);

        ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;

        ws.getCell('E5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);


        formatColumnHeaders(ws, 9, ['START TIME', 'END TIME', 'STATUS', 'DURATION', 'LOCATION', 'NEAREST LANDMARK'], [20, 20, 10, 10, 60, 50]);
        for (let i = 0; i < device.data.length; i++) {

            ws.getCell('A' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
            ws.getCell('B' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].end_time, timezone);
            ws.getCell('C' + (i + 10)).value = device.data[i].status;
            ws.getCell('D' + (i + 10)).value = dateutils.getDurationFromSecsWithColon(device.data[i].duration);
            ws.getCell('E' + (i + 10)).value = device.data[i].start_addr;
            if (device.user_id == 'kd') {
                if (device.data[i].ldist) {
                    ws.getCell('F' + (i + 10)).value = (device.data[i].ldist / 1000).toFixed(2) + ' KMs from ' + device.data[i].landmark;
                } else if (device.data[i].landmark) {
                    ws.getCell('F' + (i + 10)).value = device.data[i].landmark;
                }
            } else {
                ws.getCell('F' + (i + 10)).value = device.data[i].nearest_landmark ? device.data[i].nearest_landmark.dist / 1000 + "KM from " + device.data[i].nearest_landmark.name : 'NA';
            }
        }
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, new Date(), 'hal_report', 'hal_report', callback);

};

exports.getParkingReportWCPL = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    for (const key in data.data) {
        const device = data.data[key];

        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 6, 'Parking Report');

        for (let i = 2; i < 8; i++) {
            ws.mergeCells('A' + i + ':D' + i);
            ws.mergeCells('E' + i + ':F' + i);
        }

        mergeCells(ws, 8, 8);
        if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no
        } else {
            ws.getCell('A3').value = 'Reg No : ' + key;
        }
        ws.getCell('E2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time);
        ws.getCell('E3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time);

        ws.getCell('A5').value = 'Total KM. : ' + (device.tot_dist / 1000).toFixed(2) + ' Kms';
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;

        ws.getCell('E5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);


        formatColumnHeaders(ws, 9, ['START TIME', 'END TIME', 'STATUS', 'DURATION', 'LOCATION'], [20, 20, 10, 10, 60]);
        for (let i = 0; i < device.data.length; i++) {

            ws.getCell('A' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
            ws.getCell('B' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].end_time, timezone);
            ws.getCell('C' + (i + 10)).value = device.data[i].status;
            ws.getCell('D' + (i + 10)).value = dateutils.getDurationFromSecsWithColon(device.data[i].duration);
            ws.getCell('E' + (i + 10)).value = device.data[i].start_addr;
        }
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, new Date(), 'hal_report', 'hal_report', callback);

};

exports.getCombinedHaltsReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet('Combined Halt Report');
    formatTitle(ws, 6, 'Combined Halt Report');
    mergeCells(ws, 8, 8);
    formatColumnHeaders(ws, 9, ['VEHICLE','START TIME', 'END TIME', 'STATUS', 'DURATION', 'LOCATION', 'NEAREST LANDMARK'], [10,20, 20, 10, 10, 60, 50]);

    const device = {data: data.combinedData};
    ws.getCell('B2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time);
    ws.getCell('B3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time);

    ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
    for (let i = 0; i < device.data.length; i++) {
        if (activeusersmanager.getDeviceWithIMEI(device.data[i].imei) && activeusersmanager.getDeviceWithIMEI(device.data[i].imei).reg_no) {
            ws.getCell('A' + (i + 10)).value = device.data[i].reg_no || activeusersmanager.getDeviceWithIMEI(device.data[i].imei).reg_no
        } else {
            ws.getCell('A' + (i + 10)).value = device.data[i].reg_no || device.data[i].imei;
        }
        ws.getCell('B' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
        ws.getCell('C' + (i + 10)).value = dateutils.getFormattedDateTimeByZone(device.data[i].end_time, timezone);
        ws.getCell('D' + (i + 10)).value = device.data[i].status;
        ws.getCell('E' + (i + 10)).value = dateutils.getDurationFromSecs(device.data[i].duration);
        ws.getCell('F' + (i + 10)).value = device.data[i].start_addr;
        ws.getCell('G' + (i + 10)).value = device.data[i].nearest_landmark ? device.data[i].nearest_landmark.dist / 1000 + "KM from " + device.data[i].nearest_landmark.name : 'NA';
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, new Date(), 'combined_hal_report', 'combined_halt_report', callback);

};

exports.getMileageReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    const processed = 0;

    for (const key in data.data) {
        const day = data.data[key];

        const ws = workbook.addWorksheet(key);

        formatTitle(ws, 5, 'Mileage Report');

        formatColumnHeaders(ws, 2, ['VEHICLE', 'DISTANCE(Kms)', 'DURATION', 'SPEED', 'TOP SPEED'], [15, 10, 10, 10, 10]);
        let i = 0;
        for (const imei in day) {
            if (activeusersmanager.getDeviceWithIMEI(imei) && activeusersmanager.getDeviceWithIMEI(imei).reg_no) {
                ws.getCell('A' + (i + 3)).value = activeusersmanager.getDeviceWithIMEI(imei).reg_no;
            } else {
                ws.getCell('A' + (i + 3)).value = imei;
            }
            ws.getCell('B' + (i + 3)).value = +((day[imei].distance / 1000).toFixed(2));
            ws.getCell('C' + (i + 3)).value = dateutils.getDurationFromSecs(day[imei].duration);
            ws.getCell('D' + (i + 3)).value = day[imei].average_speed;
            ws.getCell('D' + (i + 3)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            ws.getCell('E' + (i + 3)).value = day[imei].top_speed;
            ws.getCell('E' + (i + 3)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            i++;
        }

    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time, 'report_mileage', 'mileage-report', callback);

};

exports.getMileageReport2 = function (res, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    //if(data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    let data = res.data;
    let summary;
    if (data.Summary) {
        summary = Object.assign({}, data.Summary);
        delete data.Summary;
    }

    const total = Object.keys(data).length;
    const processed = 0;

    const ws = workbook.addWorksheet('Kilometer Report');

    formatTitle(ws, 5, 'Kilometer Report');

    let dateHeaders = dateUtil.getDateArray(res.start_time, res.end_time);
    let colHeaders = ['VEHICLE', 'Total Distance'];
    let colSizes = [15, 11];

    for (let i = 0; i < dateHeaders.length; i++) {
        colHeaders.splice(2, 0, dateHeaders[i]);
        colSizes.push(10);
    }

    formatColumnHeaders(ws, 2, colHeaders, colSizes);
    let i = 0;

    for (let imei in data) {

        ws.getCell('A' + (i + 3)).value = activeusersmanager.getDeviceWithIMEI(imei) ? activeusersmanager.getDeviceWithIMEI(imei).reg_no : imei;
        if (summary) {
            let sumCell = 'B' + (i + 3);
            setCellNumFormat(ws,sumCell);
            ws.getCell(sumCell).value = (summary[imei].distance / 1000);
        }

        for (let j = 0; j < dateHeaders.length; j++) {
            let cell = getAlphabet(dateHeaders.length - j + 1) + (i + 3);
            setCellNumFormat(ws,cell);
           // ws.getCell(cell).value = data[imei][dateHeaders[j]] ? (data[imei][dateHeaders[j]].distance / 1000).toFixed(1) : 0;
            ws.getCell(cell).value = data[imei][dateHeaders[j]] ? (data[imei][dateHeaders[j]].distance / 1000) : 0;

        }
        i++;
    }

    saveFileAndReturnCallback(workbook, res.misType || "miscellaneous", res.login_uid, res.start_time, 'report_mileage2', 'mileage-report', callback);

};

function setCellNumFormat(ws, cell, format = '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)') {
	ws.getCell(cell).numFmt = format;
}

exports.getOverspeedReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;

    for (const key in data.data) {
        const device = data.data[key];
        let ws;
        if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 4, 'Overspeed Report');

        ws.mergeCells('A2:D2');
        ws.getCell('A2').value = 'Start time:' + dateutils.getDDMMYYYY(data.start_time);

        formatColumnHeaders(ws, 3, ['START TIME', 'TOP SPEED', 'LOCATION'], [20, 10, 35]);

        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 4)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
            ws.getCell('B' + (i + 4)).value = device.data[i].top_speed;
            ws.getCell('B' + (i + 4)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
        }

        fillAddress(ws, 'C', 4, device.data, function (err) {
            processed++;
            if (processed === total) {
                saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time, 'report_overspeed', 'overspeed-report', callback);
            }
        });
    }

};

exports.getActivityReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;

    for (const key in data.data) {
        const device = data.data[key];
        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 8, 'Activity Report');

        const offset = device.datewise_dist ? device.datewise_dist.length : 0;

        mergeCells(ws, 12 + offset, 8);

        for (let i = 2; i < 12 + offset; i++) {
            ws.mergeCells('A' + i + ':E' + i);
            ws.mergeCells('F' + i + ':H' + i);
        }

        if (device.reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + device.reg_no;
            data.reportName = device.reg_no + "_Activity";
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no;
            data.reportName = activeusersmanager.getDeviceWithIMEI(key).reg_no + "_Activity";
        } else {
            ws.getCell('A3').value = 'Reg No : ' + key;
            data.reportName = key + "_Activity";
        }
        ws.getCell('F2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time instanceof Array ? data.start_time[0] : data.start_time);
        ws.getCell('F3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time instanceof Array ? data.end_time[data.end_time.length - 1] : data.end_time);

        ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;
        ws.getCell('A7').value = 'Max Speed : ' + device.top_speed + ' Kmph';
        ws.getCell('A8').value = 'Average Speed (including stops) : ' + device.avg_speed_w_stops + ' Kmph';

        if (device.datewise_dist) {
            for (let i = 0; i < device.datewise_dist.length; i++) {
                ws.getCell('A' + (9 + i)).value = device.datewise_dist[i].date + ' - ' + (device.datewise_dist[i].dist / 1000).toFixed(2) + ' Kms';
            }
        }

        ws.getCell('A' + (9 + offset)).value = 'Total Distance Travelled : ' + (device.tot_dist / 1000).toFixed(2) + ' Kms';

        ws.getCell('F5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);
        ws.getCell('F6').value = 'Travel Time(excluding Stoppage) : ' + dateutils.getDurationFromSecs(device.dur_wo_stop);
        ws.getCell('F7').value = 'Average Speed (excluding stops) : ' + device.avg_speed_wo_stops + ' Kmph';
        //ws.getCell('F8').value = 'Number Of Overspeed : ' + device.num_of_overspeed;
        if (device.user_id == 'kd') {
            formatColumnHeaders(ws, 13 + offset, ['START TIME', 'ADDRESS', 'END TIME', 'ADDRESS', 'DURATION', 'CATEGORY', 'DISTANCE(Kms)', 'Speed', 'Landmark'], [20, 70, 20, 70, 6, 10, 10, 6, 70]);
        } else {
            formatColumnHeaders(ws, 13 + offset, ['START TIME', 'ADDRESS', 'END TIME', 'ADDRESS', 'DURATION', 'CATEGORY', 'DISTANCE(Kms)', 'Speed'], [20, 70, 20, 70, 6, 10, 10, 6]);
        }
        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 14 + offset)).value = dateutils.getFormattedDateTime(device.data[i].start_time, timezone);
            ws.getCell('C' + (i + 14 + offset)).value = dateutils.getFormattedDateTime(device.data[i].end_time, timezone);
            ws.getCell('H' + (i + 14 + offset)).value = device.data[i].average_speed;
            ws.getCell('D' + (i + 14 + offset)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            ws.getCell('E' + (i + 14 + offset)).value = dateutils.getDurationFromSecs(device.data[i].duration);
            ws.getCell('F' + (i + 14 + offset)).value = device.data[i].status;
            if (device.data[i].status == 'stopped') device.data[i].distance = 0;
            ws.getCell('G' + (i + 14 + offset)).value = +((device.data[i].distance / 1000).toFixed(2));
            if (device.user_id == 'kd') {
                if (device.data[i].ldist) {
                    ws.getCell('I' + (i + 14 + offset)).value = (device.data[i].ldist / 1000).toFixed(2) + ' Kms from ' + device.data[i].landmark;
                } else {
                    ws.getCell('I' + (i + 14 + offset)).value = device.data[i].landmark;
                }
            }
        }
        fillAddress(ws, 'B', 14 + offset, device.data, function (err) {
        });
        fillAddressEnd(ws, 'D', 14 + offset, device.data, function (err) {
            processed++;
            if (processed === total) {
                saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_activity', data.reportName || 'activity-report', callback);
            }
        });
    }

};

exports.getActivityReport2 = function (data, callback) { //ritika raj
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;
    for (const key in data.data) {
        const device = data.data[key];
        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 8, 'Activity Report');

        const imagePath = path.resolve('./files/images/logo.jpg');

        const imageId2 = workbook.addImage({
            filename: imagePath,
            extension: 'jpg',
        });
        ws.addImage(imageId2, {
            tl: { col: 0, row: 1 },
            ext: { width: 350, height: 80 }
        });
        // ws.addImage(imageId2, 'A2:B2');


        const offset = device.datewise_dist ? device.datewise_dist.length : 0;

        mergeCells(ws, 12 + offset, 8);

        for (let i = 2; i < 12 + offset; i++) {
            ws.mergeCells('A' + i + ':E' + i);
            ws.mergeCells('F' + i + ':H' + i);
        }

        if (device.reg_no) {
            ws.getCell('A6').value = 'Reg No : ' + device.reg_no;
            data.reportName = device.reg_no + "_Activity";
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A6').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no;
            data.reportName = activeusersmanager.getDeviceWithIMEI(key).reg_no + "_Activity";
        } else {
            ws.getCell('A6').value = 'Reg No : ' + key;
            data.reportName = key + "_Activity";
        }
        ws.getCell('F6').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time instanceof Array ? data.start_time[0] : data.start_time);
        ws.getCell('F7').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time instanceof Array ? data.end_time[data.end_time.length - 1] : data.end_time);

        ws.getCell('A9').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A10').value = 'Total number of stops : ' + device.num_stops;
        ws.getCell('A11').value = 'Max Speed : ' + device.top_speed + ' Kmph';
        ws.getCell('A11').value = 'Average Speed (including stops) : ' + device.avg_speed_w_stops + ' Kmph';

        if (device.datewise_dist) {
            for (let i = 0; i < device.datewise_dist.length; i++) {
                ws.getCell('A' + (9 + i)).value = device.datewise_dist[i].date + ' - ' + (device.datewise_dist[i].dist / 1000).toFixed(2) + ' Kms';
            }
        }

        ws.getCell('A' + (9 + offset)).value = 'Total Distance Travelled : ' + (device.tot_dist / 1000).toFixed(2) + ' Kms';

        ws.getCell('F9').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);
        ws.getCell('F10').value = 'Travel Time(excluding Stoppage) : ' + dateutils.getDurationFromSecs(device.dur_wo_stop);
        ws.getCell('F11').value = 'Average Speed (excluding stops) : ' + device.avg_speed_wo_stops + ' Kmph';
        //ws.getCell('F8').value = 'Number Of Overspeed : ' + device.num_of_overspeed;
        // if (device.user_id == 'kd') {
        //     formatColumnHeaders(ws, 13 + offset, ['Vehicle No', 'START TIME', 'END TIME','DURATION','DISTANCE(Kms)', 'Start Location', 'End Location', 'Start Location Coordinates', 'End Location Coordinates', 'Stop Page Time',  'Landmark'], [15, 25, 25, 10, 13, 70, 70, 45, 45, 22]);
        // } else {
            formatColumnHeaders(ws, 13 + offset, ['Vehicle No', 'START TIME', 'END TIME','DURATION','KMS', 'Start Location', 'End Location', 'Start Location Coordinates', 'End Location Coordinates', 'Status'], [15, 25, 25, 10, 13, 70, 70, 45, 45, 22]);
        // }
        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 14 + offset)).value = device.reg_no;
            ws.getCell('B' + (i + 14 + offset)).value = dateutils.getYYYYMMDDHHMM(device.data[i].start_time, timezone);
            ws.getCell('C' + (i + 14 + offset)).value = dateutils.getYYYYMMDDHHMM(device.data[i].end_time, timezone);
            ws.getCell('H' + (i + 14 + offset)).value = device.data[i].start && device.data[i].start.latitude + ' , ' + (device.data[i].start && device.data[i].start.longitude) ;
            ws.getCell('I' + (i + 14 + offset)).value = (device.data[i].stop && device.data[i].stop.latitude) + ' , ' + (device.data[i].stop && device.data[i].stop.longitude);

            ws.getCell('J' + (i + 14 + offset)).value = device.data[i].status;

            ws.getCell('D' + (i + 14 + offset)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            ws.getCell('D' + (i + 14 + offset)).value = dateutils.getDurationFromSecs(device.data[i].duration);
            // ws.getCell('F' + (i + 14 + offset)).value = device.data[i].status;
            if (device.data[i].status == 'stopped') device.data[i].distance = 0;
            ws.getCell('E' + (i + 14 + offset)).value = +((device.data[i].distance / 1000).toFixed(2));
            // if (device.user_id == 'kd') {
            //     if (device.data[i].ldist) {
            //         ws.getCell('I' + (i + 14 + offset)).value = (device.data[i].ldist / 1000).toFixed(2) + ' Kms from ' + device.data[i].landmark;
            //     } else {
            //         ws.getCell('I' + (i + 14 + offset)).value = device.data[i].landmark;
            //     }
            // }
        }
        fillAddress(ws, 'F', 14 + offset, device.data, function (err) {
        });
        fillAddressEnd(ws, 'G', 14 + offset, device.data, function (err) {
            processed++;
            if (processed === total) {
                saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_activity', data.reportName || 'activity-report', callback);
            }
        });
    }

};


exports.getDriverActivityReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;

    for (const key in data.data) {
        const device = data.data[key];
        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }

        formatTitle(ws, 10  , 'Activity Report');

        const offset = device.datewise_dist ? device.datewise_dist.length : 0;

        mergeCells(ws, 9 , 8);

        for (let i = 2; i < 9 + offset; i++) {
            ws.mergeCells('A' + i + ':E' + i);
            ws.mergeCells('F' + i + ':J' + i);
        }

        if (device.reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + device.reg_no;
            data.reportName = device.reg_no + "_Activity";
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no;
            data.reportName = activeusersmanager.getDeviceWithIMEI(key).reg_no + "_Activity";
        } else {
            ws.getCell('A3').value = 'Reg No : ' + key;
            data.reportName = key + "_Activity";
        }
        ws.getCell('F2').value = 'From : ' + dateutils.getDDMMYYYY( data.start_time instanceof Array ? data.start_time[0] : data.start_time);
        ws.getCell('F3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time instanceof Array ? data.end_time[data.end_time.length - 1] : data.end_time);

        ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;
        ws.getCell('A7').value = 'Max Speed : ' + device.top_speed + ' Kmph';
        ws.getCell('A8').value = 'Average Speed (including stops) : ' + device.avg_speed_w_stops + ' Kmph';

        if (device.datewise_dist) {
            for (let i = 0; i < device.datewise_dist.length; i++) {
                ws.getCell('A' + (9 + i)).value = device.datewise_dist[i].date + ' - ' + (device.datewise_dist[i].dist / 1000).toFixed(2) + ' Kms';
            }
        }

        ws.getCell('A' + (9 + offset)).value = 'Total Distance Travelled : ' + (device.tot_dist / 1000).toFixed(2) + ' Kms';

        ws.getCell('F5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);
        ws.getCell('F6').value = 'Travel Time(excluding Stoppage) : ' + dateutils.getDurationFromSecs(device.dur_wo_stop);
        ws.getCell('F7').value = 'Average Speed (excluding stops) : ' + device.avg_speed_wo_stops + ' Kmph';
        //ws.getCell('F8').value = 'Number Of Overspeed : ' + device.num_of_overspeed;
        if (device.user_id == 'kd') {
            formatColumnHeaders(ws, 10 + offset, ['START TIME', 'ADDRESS', 'END TIME', 'ADDRESS', 'DURATION', 'CATEGORY', 'DISTANCE(Kms)', 'Speed', 'Driver', 'Landmark'], [20, 70, 20, 70, 6, 10, 10, 6, 20]);
            formatColumnHeaders(ws, 11 , ['Date, Time', 'Start ADDRESS', 'Date, Time', 'End Address', 'D:Hr:Min', ' ', '(Kms)', 'Km/Hour','Name', 'D:Hr:Min'], [20, 70, 20, 70, 6, 10, 10, 6, 20]);

        } else {
            formatColumnHeaders(ws, 10 + offset, ['START TIME', 'ADDRESS', 'END TIME', 'ADDRESS', 'DURATION', 'CATEGORY', 'DISTANCE(Kms)', 'Speed', 'Driver'], [20, 70, 20, 70, 6, 10, 10, 20,10]);
            formatColumnHeaders(ws, 11 , ['Date, Time', 'Start ADDRESS', 'Date, Time', 'End Address', 'Hr:Min:Sec', ' ', '(Kms)', 'Km/Hour','Name'], [20, 70, 20, 70, 6, 10, 10, 20,10]);

        }
        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 12 + offset)).value = dateutils.getFormattedDateTime(device.data[i].start_time, timezone);
            ws.getCell('C' + (i + 12 + offset)).value = dateutils.getFormattedDateTime(device.data[i].end_time, timezone);
            ws.getCell('H' + (i + 12 + offset)).value = device.data[i].average_speed;
            ws.getCell('D' + (i + 12 + offset)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            ws.getCell('E' + (i + 12 + offset)).value = dateutils.getDurationFromSecsWithColon(device.data[i].duration);
            ws.getCell('F' + (i + 12 + offset)).value = device.data[i].status;
            if (device.data[i].status == 'stopped') device.data[i].distance = 0;
            ws.getCell('G' + (i + 12 + offset)).value = +((device.data[i].distance / 1000).toFixed(2));
            ws.getCell('I' + (i + 12 + offset)).value = device.data[i].driver || device.driver || device.driver_name || device.driver_name2;
            //ws.getCell('J' + (i + 12 + offset)).value = dateutils.getDurationFromSecsWithColon(device.data[i].pre_halt_dur);
            if (device.user_id == 'kd') {
                if (device.data[i].ldist) {
                    ws.getCell('K' + (i + 12 + offset)).value = (device.data[i].ldist / 1000).toFixed(2) + ' Kms from ' + device.data[i].landmark;
                } else {
                    ws.getCell('K' + (i + 12 + offset)).value = device.data[i].landmark;
                }
            }
            if(device.data[i].landmark){
                device.data[i].start_addr = device.data[i].landmark;
                device.data[i].stop_addr = device.data[i].landmark;
            }
            if (device.data[i-1] && device.data[i-1].status == 'stopped'){
                device.data[i].start_addr =  device.data[i-1].stop_addr;
            }
        }

        fillAddress(ws, 'B', 12 + offset, device.data, function (err) {
        });
        fillAddressEnd(ws, 'D', 12 + offset, device.data, function (err) {
            processed++;
            if (processed === total) {
                saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_activity', data.reportName || 'Trip Overview Report', callback);
            }
        });
    }

};

exports.getDriverDayWiseActivityReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet();
    let headIndex = 3;
    let offset = 4;

    for (let i = 0; i < data.data.length; i += 3) {
        let row = data.data[i];
        let rIndex = i + offset;
        let colPosition = 2;
        let alphabet;

        ws.mergeCells(`A${headIndex - 1}:A${headIndex}`);
        ws.getCell('A' + headIndex).value = "Vehicle No.";
        ws.getCell(`A${rIndex}`).value = row.summary.reg_no;
        ws.getCell(`A${rIndex + 1}`).value = row.summary.reg_no;

        let aNames = Object.keys(row.dr);
        let d1 = {
            name: aNames[0],
            month: row.dr[aNames[0]],
            summary: {
                hrs: 0,
                dis: 0,
                rest: 0
            }
        };
        let d2 = {
            name: aNames[1],
            month: row.dr[aNames[1]],
            summary: {
                hrs: 0,
                dis: 0,
                onRest: 0
            }
        };

        // let totRowHrs = 0, totRowDis = 0, totRowRest = 0;
        let totColOffRest = 0, totColDutyHrs = 0;
        ws.mergeCells(`B${headIndex - 1}:B${headIndex}`);
        ws.getCell(`B${headIndex}`).value = "Current Driver Name";
        ws.getCell(`B${rIndex}`).value = d1.name;
        ws.getCell(`B${rIndex + 1}`).value = d2.name;

        for (let dayIndex = 0; dayIndex < data.aDays.length; dayIndex++) {
            let eachDay = data.aDays[dayIndex];
            let d1MonthRec = d1.month[eachDay] || {};
            let d2MonthRec = d2.month[eachDay] || {};
            let smry = row.smry[eachDay];

            ws.mergeCells(`${getAlphabet(colPosition)}${headIndex - 1}:${getAlphabet(colPosition + 4)}${headIndex - 1}`);
            ws.getCell(`${getAlphabet(colPosition + 4)}${headIndex - 1}`).value = eachDay;

            // Duty Hrs
            alphabet = getAlphabet(colPosition++);

            ws.getCell(`${alphabet}${headIndex}`).value = "Duty Hrs";
            ws.mergeCells(`${alphabet}${rIndex}:${alphabet}${rIndex + 1}`);
            ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(smry.hrs) || '';
            totColDutyHrs += smry.hrs || 0;

            // Driving Hrs
            alphabet = getAlphabet(colPosition++);

            ws.getCell(`${alphabet}${headIndex}`).value = "Driving Hrs";
            ws.getCell(`${alphabet}${rIndex}`).value = dateUtil.getDurationFromSecsWithColon(d1MonthRec.hrs) || '';
            d1.summary.hrs += d1MonthRec.hrs || 0;
            ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(d2MonthRec.hrs) || '';
            d2.summary.hrs += d2MonthRec.hrs || 0;
            ws.getCell(`${alphabet}${rIndex + 2}`).value = dateUtil.getDurationFromSecsWithColon((d1MonthRec.hrs || 0) + (d2MonthRec.hrs || 0)) || '';

            // Kms
            alphabet = getAlphabet(colPosition++);

            ws.getCell(`${alphabet}${headIndex}`).value = "KMs";
            ws.getCell(`${alphabet}${rIndex}`).value = ((d1MonthRec.dis || 0) / 1000).toFixed(2);
            d1.summary.dis += d1MonthRec.dis || 0;
            ws.getCell(`${alphabet}${rIndex + 1}`).value = ((d2MonthRec.dis || 0) / 1000).toFixed(2);
            d2.summary.dis += d2MonthRec.dis || 0;
            ws.getCell(`${alphabet}${rIndex + 2}`).value = ((smry.dis || 0) / 1000).toFixed(2);

            // Total Rest Break
            alphabet = getAlphabet(colPosition++);

            ws.getCell(`${alphabet}${headIndex}`).value = "Total Rest Break";
            ws.mergeCells(`${alphabet}${rIndex}:${alphabet}${rIndex + 1}`);
            ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(smry.offRest) || '';
            totColOffRest += smry.offRest || 0;

            // Rest Break
            alphabet = getAlphabet(colPosition++);

            ws.getCell(`${alphabet}${headIndex}`).value = "Rest Break";
            ws.getCell(`${alphabet}${rIndex}`).value = dateUtil.getDurationFromSecsWithColon(d1MonthRec.onRest) || '';
            d1.summary.onRest += d1MonthRec.onRest || 0;
            ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(d2MonthRec.onRest) || '';
            d2.summary.onRest += d2MonthRec.onRest || 0;
            ws.getCell(`${alphabet}${rIndex + 2}`).value = dateUtil.getDurationFromSecsWithColon((d1MonthRec.onRest || 0) + (d2MonthRec.onRest || 0)) || '';
        }

        ws.mergeCells(`${getAlphabet(colPosition)}${headIndex - 1}:${getAlphabet(colPosition + 4)}${headIndex - 1}`);
        ws.getCell(`${getAlphabet(colPosition + 4)}${headIndex - 1}`).value = "Summary";

        // Duty Hrs
        alphabet = getAlphabet(colPosition++);

        ws.getCell(`${alphabet}${headIndex}`).value = "Duty Hrs";
        ws.mergeCells(`${alphabet}${rIndex}:${alphabet}${rIndex + 1}`);
        ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(totColDutyHrs) || '';

        // Driving Hrs
        alphabet = getAlphabet(colPosition++);

        ws.getCell(`${alphabet}${headIndex}`).value = "Driving Hrs";
        ws.getCell(`${alphabet}${rIndex}`).value = dateUtil.getDurationFromSecsWithColon(d1.summary.hrs) || '';
        ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(d2.summary.hrs) || '';
        ws.getCell(`${alphabet}${rIndex + 2}`).value = dateUtil.getDurationFromSecsWithColon((d1.summary.hrs || 0) + (d2.summary.hrs || 0)) || '';

        // Kms
        alphabet = getAlphabet(colPosition++);

        ws.getCell(`${alphabet}${headIndex}`).value = "Kms";
        ws.getCell(`${alphabet}${rIndex}`).value = ((d1.summary.dis || 0) / 1000).toFixed(2);
        ws.getCell(`${alphabet}${rIndex + 1}`).value = ((d2.summary.dis || 0) / 1000).toFixed(2);
        ws.getCell(`${alphabet}${rIndex + 2}`).value = (((d1.summary.dis || 0) + (d2.summary.dis || 0)) / 1000).toFixed(2);

        // Total Rest Break
        alphabet = getAlphabet(colPosition++);

        ws.getCell(`${alphabet}${headIndex}`).value = "Total Rest Break";
        ws.mergeCells(`${alphabet}${rIndex}:${alphabet}${rIndex + 1}`);
        ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(totColOffRest) || '';

        // Rest Break
        alphabet = getAlphabet(colPosition++);

        ws.getCell(`${alphabet}${headIndex}`).value = "Rest Break";
        ws.getCell(`${alphabet}${rIndex}`).value = dateUtil.getDurationFromSecsWithColon(d1.summary.onRest) || '';
        ws.getCell(`${alphabet}${rIndex + 1}`).value = dateUtil.getDurationFromSecsWithColon(d2.summary.onRest) || '';
        ws.getCell(`${alphabet}${rIndex + 2}`).value = dateUtil.getDurationFromSecsWithColon((d1.summary.onRest || 0) + (d2.summary.onRest || 0)) || '';
    }

    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_activity', 'driver_day_activity', callback);

};

exports.getDriverDayWiseActivityReportVertically = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet();
    let headIndex = 3;
    let rowOffset = 1;

    ws.mergeCells(`A${rowOffset}:G${rowOffset}`);
    setVal(ws, 'G', rowOffset, "Driver Report", {fill: '34abeb', border: true});
    rowOffset++;

    data.data.forEach(oData => {

        let aNames = Object.keys(oData.dr);

        ws.mergeCells(`A${rowOffset}:C${rowOffset}`);
        setVal(ws, 'C', rowOffset, `Vehicle No. ${oData.summary && oData.summary.reg_no}`, {fill: 'fcf232', border: true});
        setVal(ws, 'D', rowOffset, `From. ${dateutils.getFormattedDateTime(data.start_time)}`, {fill: 'fcbf32', border: true});
        setVal(ws, 'E', rowOffset, `To. ${dateutils.getFormattedDateTime(data.end_time)}`, {fill: 'fcbf32', border: true});
        rowOffset++;

        aNames.forEach(name => {
            let driver = oData.dr[name] || {};

            ws.mergeCells(`A${rowOffset}:B${rowOffset}`);
            setVal(ws, 'B', rowOffset, `Driver Name - ${name}`, {fill: 'fcbf32', border: true});
            rowOffset++;

            setVal(ws, 'A', rowOffset, 'Date', {fill: true, border: true, width: 11});
            setVal(ws, 'B', rowOffset, 'Duty Start time', {fill: true, border: true, width: 24});
            setVal(ws, 'C', rowOffset, 'Duty End time', {fill: true, border: true, width: 24});
            setVal(ws, 'D', rowOffset, 'Duty Time (H:M:S)', {fill: true, border: true, width: 17});
            setVal(ws, 'E', rowOffset, 'KM Covered', {fill: true, border: true, width: 14});
            setVal(ws, 'F', rowOffset, 'Total Driving Hrs (H:M:S)', {fill: true, border: true, width: 23});
            setVal(ws, 'G', rowOffset, 'Rest Break (H:M:S)', {fill: true, border: true, width: 17});
            rowOffset++;

            data.aDays.forEach(day => {
                let oDriver = driver[day] || {};
                let oSmry = oData.smry[day] || {};
                setVal(ws, 'A', rowOffset, day, {border: true});
                setVal(ws, 'B', rowOffset, dateutils.getFormattedDateTime(oSmry.start_time ? oSmry.start_time : dateUtil.startOf(day), timezone), {border: true});
                oSmry.end_time = oSmry.start_time ? new Date(new Date(oSmry.start_time).getTime() + ((oDriver.onRest || 0) * 1000) + ((oDriver.hrs || 0) * 1000)) : false;
                setVal(ws, 'C', rowOffset, oSmry.end_time ? dateutils.getFormattedDateTime(oSmry.end_time, timezone) : '' , {border: true});
                let dutyHrs = ((oSmry.end_time || 0) - (oSmry.start_time || 0))/1000;
                setVal(ws, 'D', rowOffset, (dateUtil.getDurationFromSecsWithColon(dutyHrs) || '0:0:0'), {border: true});
                setVal(ws, 'E', rowOffset, (oDriver.dis || 0)/ 1000, {border: true});
                setVal(ws, 'F', rowOffset, dateUtil.getDurationFromSecsWithColon(oDriver.hrs || '0:0:0'), {border: true});
                let restHrs = oDriver.onRest /* dutyHrs - (oDriver.hrs || 0) */;
                setVal(ws, 'G', rowOffset, dateUtil.getDurationFromSecsWithColon(restHrs || '0:0:0'), {border: true});
                rowOffset++;
            });
            rowOffset++;
        });
    });

    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_activity', 'driver_day_activity', callback);

};

exports.getTripActivityReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;

    for (const key in data.data) {
        const device = data.data[key];

        const reg_no = activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no ? activeusersmanager.getDeviceWithIMEI(key).reg_no : key;

        const ws = workbook.addWorksheet(reg_no);

        formatTitle(ws, 8, 'Activity Report');

        const offset = device.datewise_dist ? device.datewise_dist.length : 0;

        mergeCells(ws, 12 + offset, 8);

        for (let i = 2; i < 12 + offset; i++) {
            ws.mergeCells('A' + i + ':E' + i);
            ws.mergeCells('F' + i + ':H' + i);
        }

        ws.getCell('A3').value = 'Reg No : ' + reg_no;
        ws.getCell('F2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time instanceof Array ? data.start_time[0] : data.start_time);
        ws.getCell('F3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time instanceof Array ? data.end_time[data.end_time.length - 1] : data.end_time);

        ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;
        ws.getCell('A7').value = 'Max Speed : ' + device.top_speed + ' Kmph';
        ws.getCell('A8').value = 'Average Speed (including stops) : ' + device.avg_speed_w_stops + ' Kmph';

        if (device.datewise_dist) {
            for (let i = 0; i < device.datewise_dist.length; i++) {
                ws.getCell('A' + (9 + i)).value = device.datewise_dist[i].date + ' - ' + (device.datewise_dist[i].dist / 1000).toFixed(2) + ' Kms';
            }
        }

        ws.getCell('A' + (9 + offset)).value = 'Total Distance Travelled : ' + (device.tot_dist / 1000).toFixed(2) + ' Kms';

        ws.getCell('F5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);
        ws.getCell('F6').value = 'Travel Time(excluding Stoppage) : ' + dateutils.getDurationFromSecs(device.dur_wo_stop);
        ws.getCell('F7').value = 'Average Speed (excluding stops) : ' + device.avg_speed_wo_stops + ' Kmph';
        ws.getCell('F8').value = 'Number Of Overspeed : ' + device.num_of_overspeed;

        ws.getCell('F9').value = 'Trip No. : ' + data.trip_no;
        ws.getCell('F10').value = 'Driver : ' + data.driver;
        ws.getCell('F11').value = 'Route : ' + data.route;

        formatColumnHeaders(ws, 13 + offset, ['START TIME', 'END TIME', 'SPEED', 'DURATION', 'CATEGORY', 'DISTANCE(Kms)', 'LOCATION'], [20, 20, 6, 10, 10, 10, 70]);

        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 14 + offset)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
            ws.getCell('B' + (i + 14 + offset)).value = dateutils.getFormattedDateTimeByZone(device.data[i].end_time, timezone);
            ws.getCell('C' + (i + 14 + offset)).value = device.data[i].average_speed;
            ws.getCell('C' + (i + 14 + offset)).alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            ws.getCell('D' + (i + 14 + offset)).value = dateutils.getDurationFromSecs(device.data[i].duration);
            ws.getCell('E' + (i + 14 + offset)).value = device.data[i].status;
            ws.getCell('F' + (i + 14 + offset)).value = +((device.data[i].distance / 1000).toFixed(2));
        }

        fillAddress(ws, 'G', 14 + offset, device.data, function (err) {
            processed++;
            if (processed === total) {
                saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, 'report_activity', 'activity-report', callback);
            }
        });
    }

};

exports.getTripReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Report');

    formatTitle(ws, 24, 'Trip Report');

    ws.mergeCells('A2:O2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY(data.created_at);

    formatColumnHeaders(ws, 3, [
        'VEHICLE',
        'TRIP NO.',
        'SOURCE',
        'DESTINATION',
        'CONSIGNEE',
        'CONSIGNOR',
        'MANAGER',
        'STATUS',
        'DRIVER',
        'DRIVER NO.',
        'ENABLED',
        'ESTIMATED DISTANCE',
        'FORWORDER',
        'ETOA',
        'CURRENT LOCATION',
        'LAST TRACKING',
        'GPS STATUS',
        'START TIME',
        'END TIME',
        'CREATED AT',
        'CREATED BY',
        'USER ID',
        'ALARM',
        'REMARK 1',
        'REMARK 2',
        'REMARK 3'
    ], [13, 10, 20, 20, 15, 15, 15, 15, 20, 15, 10, 20, 20, 20, 60, 60, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 4)).value = data.data[i].vehicle_no || 'NA';
        ws.getCell('B' + (i + 4)).value = data.data[i].trip_no || 'NA';
        ws.getCell('C' + (i + 4)).value = data.data[i].source || 'NA';
        ws.getCell('D' + (i + 4)).value = data.data[i].destination || 'NA';
        ws.getCell('E' + (i + 4)).value = data.data[i].consignee || 'NA';
        ws.getCell('F' + (i + 4)).value = data.data[i].consignor || 'NA';
        ws.getCell('G' + (i + 4)).value = data.data[i].manager || 'NA';
        ws.getCell('H' + (i + 4)).value = data.data[i].status || 'NA';
        ws.getCell('I' + (i + 4)).value = data.data[i].driver || 'NA';
        ws.getCell('J' + (i + 4)).value = data.data[i].driver_no || 'NA';
        ws.getCell('K' + (i + 4)).value = data.data[i].enabled || 'NA';
        ws.getCell('L' + (i + 4)).value = data.data[i].estimated_dist || 'NA';
        ws.getCell('M' + (i + 4)).value = data.data[i].forworder || 'NA';
        ws.getCell('N' + (i + 4)).value = data.data[i].etoa || 'NA';
        ws.getCell('O' + (i + 4)).value = data.data[i].cur_location.address || 'NA';
        ws.getCell('P' + (i + 4)).value = data.data[i].cur_location.address || 'NA';
        ws.getCell('Q' + (i + 4)).value = data.data[i].gps_status || 'NA';
        ws.getCell('R' + (i + 4)).value = dateutils.getFormattedDateTimeByZone(data.data[i].start_time, timezone) || 'NA';
        ws.getCell('S' + (i + 4)).value = dateutils.getFormattedDateTimeByZone(data.data[i].end_time, timezone) || 'NA';
        ws.getCell('T' + (i + 4)).value = data.data[i].created_at || 'NA';
        ws.getCell('U' + (i + 4)).value = data.data[i].created_by || 'NA';
        ws.getCell('V' + (i + 4)).value = data.data[i].user_id || 'NA';
        ws.getCell('W' + (i + 4)).value = data.data[i].alarm || 'NA';
        ws.getCell('X' + (i + 4)).value = data.data[i].remark1 || 'NA';
        ws.getCell('Y' + (i + 4)).value = data.data[i].remark2 || 'NA';
        ws.getCell('Z' + (i + 4)).value = data.data[i].remark3 || 'NA';
    }

    fillAddress(ws, 'F', 4, data.data, function (err) {
        saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.user_id, data.created_at, 'report_trip', 'trip-report', callback);
    });

};

exports.getTrackingSheetReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Tracking Sheet');
    formatTitle(ws, 12, 'Tracking Sheet');
    ws.mergeCells('A2:L2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    const all_fields = {
        "branch": {header: "BRANCH", size: 15, field: "branch"},
        "reg_no": {header: "VEHICLE", size: 15, field: "reg_no"},
        "vehicle_type": {header: "VEHICLE TYPE", size: 17, field: "vehicle_type"},
        "driver_name": {header: "DRIVER", size: 15, field: "driver_name"},
        "status": {header: "STATUS", size: 8, field: "status"},
        "addr": {header: "ADDRESS", size: 40, field: "addr"},
        "positioning_time": {header: "POSITION TIME", size: 18, field: "positioning_time"},
        "location_time": {header: "LOCATION TIME", size: 18, field: "location_time"},
        "stoppage_time": {header: "STOPPAGE (HRS)", size: 18, field: "stoppage_time"},
        "speed": {header: "SPEED (km/h)", size: 12, field: "speed"},
        "estimated_dist": {header: "EST. DISTANCE(km)", size: 15, field: "estimated_dist"},
        "dist_today": {header: "DISTANCE TODAY (km)", size: 15, field: "dist_today"},
        "dist_yesterday": {header: "DISTANCE YESTERDAY (km)", size: 15, field: "dist_yesterday"},
        "dist_d_2": {header: dateUtil.getDDMMYYYY(dateUtil.getPrevDayMorning(2)), size: 15, field: "dist_d_2"},
        "dist_d_3": {header: dateUtil.getDDMMYYYY(dateUtil.getPrevDayMorning(3)), size: 15, field: "dist_d_3"},
        "dist_d_4": {header: dateUtil.getDDMMYYYY(dateUtil.getPrevDayMorning(4)), size: 15, field: "dist_d_4"},
        "dist_d_5": {header: dateUtil.getDDMMYYYY(dateUtil.getPrevDayMorning(5)), size: 15, field: "dist_d_5"},
        "dist_last_week": {header: "DISTANCE LAST WEEK (km)", size: 15, field: "dist_last_week"},
        "remark": {header: "REMARK", size: 15, field: "remark"},
        "nearest_landmark": {header: "NEAREST LANDMARK", size: 15, field: "nearest_landmark"},
        "customer": {header: "CUSTOMER", size: 20, field: "customer"},
        "owner_group": {header: "OWNER GROUP", size: 12, field: "owner_group"},
        "route": {header: "ROUTE", size: 20, field: "route"},
        "vehicle_status": {header: "VEHICLE STATUS", size: 12, field: "vehicle_status"},
        "trip_status": {header: "TRIP STATUS", size: 12, field: "trip_status"},
        "trip_start_time": {header: "TRIP START", size: 12, field: "trip_start_time"}


    };
    let fields = [], headers = [], sizes = [], shown_order = [];
    if (data.login_uid == 'maple' || data.login_uid == 'kamal') {
        shown_order = ["branch", "reg_no", "vehicle_type", "driver_name", "status", "vehicle_status", "trip_status", "trip_start_time", "route", "owner_group", "customer", "addr", "positioning_time", "location_time",
            "stoppage_time", "speed", "estimated_dist", "dist_today", "dist_yesterday", "dist_d_2", "dist_d_3", "dist_d_4", "dist_d_5", "dist_last_week",
            "remark", "nearest_landmark"];
    } else {
        shown_order = ["branch", "reg_no", "vehicle_type", "driver_name", "status", "addr", "positioning_time", "location_time",
            "stoppage_time", "speed", "estimated_dist", "dist_today", "dist_yesterday", "dist_d_2", "dist_d_3", "dist_d_4", "dist_d_5", "dist_last_week",
            "remark", "nearest_landmark"];
    }


    for (let i = 0; i < shown_order.length; i++) {// to preseve order in Excel
        if (data.shown_fields && data.shown_fields.indexOf(shown_order[i]) > -1) {
            fields.push(all_fields[shown_order[i]].field);
            headers.push(all_fields[shown_order[i]].header);
            sizes.push(all_fields[shown_order[i]].size);
        }
    }
    formatColumnHeaders(ws, 3, headers, sizes);

    for (let i = 0; i < data.data.length; i++) {
        for (let j = 0; j < fields.length; j++) {//ordered fileds, headers and sizes Array
            leftAlign(ws.getCell(alphabet[j] + (i + 4)));
            switch (fields[j]) {
                case 'nearest_landmark':
                    if (data.data[i] && data.data[i][fields[j]] && data.data[i][fields[j]].dist) {
                        ws.getCell(alphabet[j] + (i + 4)).value = (data.data[i][fields[j]].dist / 1000).toFixed(2) + ' kms from ' + data.data[i][fields[j]].name || '-';
                    }
                    break;
                case 'estimated_dist':
                case 'dist_today':
                case 'dist_yesterday':
                case 'dist_d_2':
                case 'dist_d_3':
                case 'dist_d_4':
                case 'dist_d_5':
                case 'dist_last_week':
                    if (data.data[i] && data.data[i][fields[j]]) {
                        ws.getCell(alphabet[j] + (i + 4)).value = data.data[i][fields[j]] / 1000 || '-';
                    }
                    break;
                case 'positioning_time':
                case 'location_time':
                    ws.getCell(alphabet[j] + (i + 4)).value = dateutils.getFormattedDateTimeByZone(data.data[i][fields[j]], timezone);
                    break;
                case 'stoppage_time':
                    if (data.login_uid == 'maple' || data.login_uid == 'kamal') {//TODO read it from feature configs
                        ws.getCell(alphabet[j] + (i + 4)).value = dateutils.getHrDurationFromSecs((new Date().getTime() - new Date(data.data[i].location_time).getTime()) / 1000);
                    } else {
                        ws.getCell(alphabet[j] + (i + 4)).value = dateutils.getDurationFromSecs((new Date().getTime() - new Date(data.data[i].location_time).getTime()) / 1000);
                    }
                    break;
                case 'status':
                    ws.getCell(alphabet[j] + (i + 4)).value = otherUtil.clientSuitableStatus(data.data[i].speed, data.data[i].status, data.data[i].datetime);
                    break;
                default:
                    if (data.data[i] && data.data[i][fields[j]]) {
                        ws.getCell(alphabet[j] + (i + 4)).value = data.data[i][fields[j]] || '-';
                    }
                    break;
            }
        }
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'tracking_sheet', 'tracking-sheet', callback);
};
exports.getGeofenceNotificationReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Geofence Notification Report');
    formatTitle(ws, 12, 'Geofence Notification Report');
    ws.mergeCells('A2:F2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    formatColumnHeaders(ws, 3, ['VEHICLE', 'Entry Message', 'Entry Time', 'Exit Message', 'Exit Time', 'Duration'], [10, 30, 15, 30, 15, 10]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 4)).value = data.data[i].vehicle_no || '-';
        ws.getCell('B' + (i + 4)).value = data.data[i].entry ? data.data[i].entry.message : 'NA';
        ws.getCell('C' + (i + 4)).value = data.data[i].entry ? dateutils.getFormattedDateTimeByZone(data.data[i].entry.datetime, timezone) : 'NA';
        ws.getCell('D' + (i + 4)).value = data.data[i].exit ? data.data[i].exit.message : 'NA';
        ws.getCell('E' + (i + 4)).value = data.data[i].exit ? dateutils.getFormattedDateTimeByZone(data.data[i].exit.datetime, timezone) : 'NA';
        ws.getCell('F' + (i + 4)).value = data.data[i].exit && data.data[i].entry ? dateutils.getDurationFromSecs((new Date(data.data[i].exit.datetime).getTime() - new Date(data.data[i].entry.datetime).getTime()) / 1000) : 'NA';
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'geofence_report', 'geofence_report', callback);

};
exports.getGeofenceScheduleReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Trip Geofence Report');
    formatTitle(ws, 12, 'Trip Geofence Report');
    ws.mergeCells('A2:K2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    formatColumnHeaders(ws, 3, ['VEHICLE', 'Load Address', 'Load In', 'Load Out', 'Load Duration', 'Unload Address',
        'Unload In', 'Unload Out', 'Unload Duration', 'Journey Time', 'Total Time'], [10, 30, 15, 15, 10, 30, 15, 15, 10, 10, 10]);
    let rowNo = 0;
    for (const key in data.data) {
        let aData = [];
        let oData = data.data[key];
        if (oData && oData.data) aData = oData.data;
        for (let i = 0; i < aData.length; i++) {
            ws.getCell('A' + (rowNo + 4)).value = aData[i].vehicle_no || '-';
            ws.getCell('B' + (rowNo + 4)).value = aData[i].load_area;
            ws.getCell('C' + (rowNo + 4)).value = aData[i].load_in ? dateutils.getFormattedDateTimeByZone(aData[i].load_in, timezone) : 'NA';
            ws.getCell('D' + (rowNo + 4)).value = aData[i].load_out ? dateutils.getFormattedDateTimeByZone(aData[i].load_out, timezone) : 'NA';
            ws.getCell('E' + (rowNo + 4)).value = dateutils.getDurationFromSecs(aData[i].load_dur);
            ws.getCell('F' + (rowNo + 4)).value = aData[i].unload_area;
            ws.getCell('G' + (rowNo + 4)).value = aData[i].unload_in ? dateutils.getFormattedDateTimeByZone(aData[i].unload_in, timezone) : 'NA';
            ws.getCell('H' + (rowNo + 4)).value = aData[i].unload_out ? dateutils.getFormattedDateTimeByZone(aData[i].unload_out, timezone) : 'NA';
            ws.getCell('I' + (rowNo + 4)).value = dateutils.getDurationFromSecs(aData[i].unload_dur);
            ws.getCell('J' + (rowNo + 4)).value = dateutils.getDurationFromSecs(aData[i].lead_load_to_unload);
            ws.getCell('K' + (rowNo + 4)).value = dateutils.getDurationFromSecs(aData[i].total_dur);
            rowNo++;
        }
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'trip_geofence_report', 'trip_geofence_report', callback);

};
exports.getHaltNotificationReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Halt Notification Report');
    formatTitle(ws, 12, 'Halt Notification Report');
    ws.mergeCells('A2:C2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    formatColumnHeaders(ws, 3, ['VEHICLE', 'Time', 'Message'], [10, 15, 40]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 4)).value = data.data[i].vehicle_no || '-';
        ws.getCell('B' + (i + 4)).value = dateutils.getFormattedDateTimeByZone(data.data[i].datetime, timezone) || 'NA';
        ws.getCell('C' + (i + 4)).value = data.data[i].message || 'NA';
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'halt_notif_report', 'halt_notif_report', callback);
};
exports.getOverSpeedNotificationReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Over Speed Notification Report');
    formatTitle(ws, 12, 'Over Speed Notification Report');
    ws.mergeCells('A2:C2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    formatColumnHeaders(ws, 3, ['VEHICLE', 'Time', 'Message'], [10, 15, 40]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 4)).value = data.data[i].vehicle_no || '-';
        ws.getCell('B' + (i + 4)).value = dateutils.getFormattedDateTimeByZone(data.data[i].datetime, timezone) || 'NA';
        ws.getCell('C' + (i + 4)).value = data.data[i].message || 'NA';
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'over_speed_notif_report', 'over_speed_notif_report', callback);
};

exports.getVehicleExceptionReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Vehicle Exception Report');
    formatTitle(ws, 5, 'Vehicle Exception Report');
    ws.mergeCells('A2:E2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();
    ws.getCell('A2').alignment = {horizontal: 'center'};
    formatColumnHeaders(ws, 3, ['Driver', 'Time', 'Exception', 'Address', 'Duration'], [10, 15, 15, 45, 10]);
    formatColumnHeaders(ws, 4, ['     ', 'Date, Time', '    ', '    ', 'Minutes'], [10, 15, 15, 45, 10]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 5)).value = data.data[i].driver;
        ws.getCell('B' + (i + 5)).value = dateutils.getFormattedDateTimeByZone(data.data[i].datetime, timezone) || 'NA';
        ws.getCell('C' + (i + 5)).value = data.data[i].code || 'Excessive Idle';
        ws.getCell('D' + (i + 5)).value = data.data[i].address || data.data[i].start_addr;
        ws.getCell('E' + (i + 5)).value = data.data[i].duration ? dateutils.getDurationFromSecs(data.data[i].duration) : 'NA';

    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'exceptions', 'exceptions', callback);
};
exports.getMalfunctionReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Device Malfunction');
    formatTitle(ws, 4, 'Device Malfunction');
    ws.mergeCells('A2:D2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY();

    formatColumnHeaders(ws, 3, ['VEHICLE', 'PROBLEM', 'NOTICE DATE', 'REMARK',], [15, 30, 12, 50]);

    for (let i = 0; i < data.data.length; i++) {
        ws.getCell('A' + (i + 4)).value = data.data[i].reg_no;
        ws.getCell('B' + (i + 4)).value = data.data[i].reason;
        ws.getCell('C' + (i + 4)).value = data.data[i].notice_date;
        ws.getCell('D' + (i + 4)).value = data.data[i].remark;
    }

    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.selected_uid || data.login_uid, new Date().getTime(), 'Device_Malfunction', 'Device_Malfunction', callback);

};

exports.getHaltSummryReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Report');

    formatTitle(ws, 6, 'Halt Summary Report');

    ws.mergeCells('A2:F2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY(data.created_at);

    formatColumnHeaders(ws, 3, [
        'VEHICLE',
        'Distance(KM)',
        'Stoppage',
        'Total Drive',
        'Start Location',
        'End Location'
    ], [13, 12, 12, 12, 30, 30]);
    let i = 0;
    data.user_id = data.user_id || data.login_uid;
    data.created_at = new Date();
    for (const key in data.data) {
        ws.getCell('A' + (i + 4)).value = data.data[key].reg_no;
        ws.getCell('B' + (i + 4)).value = (data.data[key].tot_dist / 1000).toFixed(2);
        ws.getCell('C' + (i + 4)).value = dateutils.getDurationFromSecs(data.data[key].dur_stop);
        ws.getCell('D' + (i + 4)).value = dateutils.getDurationFromSecs(data.data[key].dur_wo_stop);
        ws.getCell('E' + (i + 4)).value = data.data[key].start && data.data[key].start.start_addr;
        ws.getCell('F' + (i + 4)).value = data.data[key].end && data.data[key].end.stop_addr;
        i++;
    }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.user_id, data.created_at, 'report_mileage2', 'halt-summary-report', callback);

};

exports.detailAnalysisRpt = function (res, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (res.timezone) timezone = res.timezone;

    let row = 1;

    const workbook = new Excel.Workbook();
    let ws = workbook.addWorksheet('Detail Analysis');

    ws.getColumn('B').width = 23;
    ws.getCell(`A${row}`).value = 'SN';
    ws.getCell(`B${row}`).value = 'Time';
    ws.getCell(`C${row}`).value = 'Speed';
    ws.getCell(`D${row}`).value = 'latitude';
    ws.getCell(`E${row}`).value = 'longitude';
    ws.getCell(`F${row}`).value = 'Address';
    row++;

    res.data.forEach(oData => {
        if (!oData.points)
            return;

        oData.points.forEach((oPt, index) => {
            ws.getCell(`A${row}`).value = row -1;
            ws.getCell(`B${row}`).value = dateutils.getFormattedDateTimeByZone(oPt.datetime, timezone);
            ws.getCell(`C${row}`).value = oPt.speed;
            ws.getCell(`D${row}`).value = oPt.lat;
            ws.getCell(`E${row}`).value = oPt.lng;
            if (index == 0)
                ws.getCell(`F${row}`).value = oData.start_addr;
            if (index == oData.points.length - 1)
                ws.getCell(`F${row}`).value = oData.stop_addr;
            row++;
        });
    });

    saveFileAndReturnCallback(workbook, "miscellaneous", res.login_uid, new Date(), 'report_analysis', 'Detail-Analysis', callback);
};


exports.getBeatReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Report');

    formatTitle(ws, 9, 'Beat Report');

    ws.mergeCells('A2:I2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY(data.created_at);

    formatColumnHeaders(ws, 3, [
        'SECTION',
        'SSE',
        'DEVICE NAME',
        'Starting Point (Km)',
        'Ending Point (Km)',
        'Beat Completed',
        'Minimum Speed',
        'Maximum Speed',
        'Remarks',
     ], [10, 10, 15, 20, 20, 10, 10, 10, 30]);
    let i=0;
    ws.getCell('A' + (i + 4)).value = data && data.beat && data.beat.beatSection;
    ws.getCell('B' + (i + 4)).value = data && data.beat && data.beat.beatSSE;
    ws.getCell('C' + (i + 4)).value = data && data.beat && data.beat.reg_no;
    ws.getCell('D' + (i + 4)).value = data && data.beat && data.beat.beatStart && data.beat.beatStart.km;
    ws.getCell('E' + (i + 4)).value = data && data.beat && data.beat.beatStart && data.beat.beatEnd.km;
    ws.getCell('F' + (i + 4)).value = data.beat_completed;
    ws.getCell('G' + (i + 4)).value = data.minSpeed;
    ws.getCell('H' + (i + 4)).value = data.maxSpeed;
    ws.getCell('I' + (i + 4)).value = data.reason;

    saveFileAndReturnCallback(workbook, data.misType || "Beat", data.user_id, data.created_at, 'Beat', 'Beat-report', callback);
};

exports.getBeatReportCache = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('BeatReport');

    formatTitle(ws, 8, 'Beat Report');

    ws.mergeCells('A2:J2');
    ws.getCell('A2').value = 'Date: ' + dateutils.getDDMMYYYY(data.start_time);

    formatColumnHeaders(ws, 3, [
        'SECTION',
        'SSE',
        'Keyman',
        'Start Date',
        'Start Time',
        'End Date',
        'End Time',
        'Completed',
        'Min Speed',
        'Max Speed',
        'Distance',
        'Remarks',
     ], [10, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 40]);
    let aBeatsData = data.data;
    for(let i=0;i<aBeatsData.length;i++){
        let oBeat = aBeatsData[i];
        ws.getCell('A' + (i + 4)).value = oBeat.section;
        ws.getCell('B' + (i + 4)).value = oBeat.sse;
        ws.getCell('C' + (i + 4)).value = oBeat.reg_no;
        ws.getCell('D' + (i + 4)).value = dateutils.getDDMMYYYY(oBeat.start_time);
        ws.getCell('E' + (i + 4)).value = dateutils.gethhmmaa(oBeat.start_time);
        ws.getCell('F' + (i + 4)).value = dateutils.getDDMMYYYY(oBeat.end_time);
        ws.getCell('G' + (i + 4)).value = dateutils.gethhmmaa(oBeat.end_time);
        ws.getCell('H' + (i + 4)).value = oBeat.complete;
        ws.getCell('I' + (i + 4)).value = oBeat.min_speed;
        ws.getCell('J' + (i + 4)).value = oBeat.max_speed;
        ws.getCell('K' + (i + 4)).value = oBeat.beat_dist;
        ws.getCell('L' + (i + 4)).value = oBeat.remark;
    }

    saveFileAndReturnCallback(workbook, data.misType || "Beat", data.user_id, data.created_at, 'BeatCache', 'Beat-report', callback);
};

exports.getIdleReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;

    const workbook = new Excel.Workbook();

    const total = Object.keys(data.data).length;
    let processed = 0;

   // for (const key in data.data) {
        const device = data;
        let ws;
        if (device.reg_no) {
            ws = workbook.addWorksheet(device.reg_no);
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws = workbook.addWorksheet(activeusersmanager.getDeviceWithIMEI(key).reg_no);
        } else {
            ws = workbook.addWorksheet(key);
        }
      
        formatTitle(ws, 5, 'Idle Report');

        const offset = device.datewise_dist ? device.datewise_dist.length : 0;

        mergeCells(ws, 7 + offset, 5);

        for (let i = 2; i < 7 + offset; i++) {
            ws.mergeCells('A' + i + ':B' + i);
            ws.mergeCells('C' + i + ':E' + i);
        }

        if (device.reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + device.reg_no;
            data.reportName = device.reg_no + "_Idle";
        } else if (activeusersmanager.getDeviceWithIMEI(key) && activeusersmanager.getDeviceWithIMEI(key).reg_no) {
            ws.getCell('A3').value = 'Reg No : ' + activeusersmanager.getDeviceWithIMEI(key).reg_no;
            data.reportName = activeusersmanager.getDeviceWithIMEI(key).reg_no + "_Idle";
        } else {
            ws.getCell('A3').value = 'Reg No : ' + key;
            data.reportName = key + "_Idle";
        }
        ws.getCell('C2').value = 'From : ' + dateutils.getDDMMYYYY(data.start_time instanceof Array ? data.start_time[0] : data.start_time);
        ws.getCell('C3').value = 'To : ' + dateutils.getDDMMYYYY(data.end_time instanceof Array ? data.end_time[data.end_time.length - 1] : data.end_time);

        ws.getCell('A5').value = 'Duration selected : ' + dateutils.getDuration(data.start_time, data.end_time);
        ws.getCell('A6').value = 'Total number of stops : ' + device.num_stops;
      
        ws.getCell('C5').value = 'Total Stop Duration : ' + dateutils.getDurationFromSecs(device.dur_stop);

        let countNoOfIdle = 0, countDurOfIdle = 0;
       
        formatColumnHeaders(ws, 10 + offset, ['START TIME', 'ADDRESS', 'END TIME', 'DURATION', 'CATEGORY'], [20, 60, 20, 10, 10]);

        for (let i = 0; i < device.data.length; i++) {
            ws.getCell('A' + (i + 11 + offset)).value = dateutils.getFormattedDateTimeByZone(device.data[i].start_time, timezone);
            ws.getCell('C' + (i + 11 + offset)).value = dateutils.getFormattedDateTimeByZone(device.data[i].end_time, timezone);
            ws.getCell('D' + (i + 11 + offset)).value = dateutils.getDurationFromSecs(device.data[i].duration);
            ws.getCell('E' + (i + 11 + offset)).value = device.data[i].status;
            if(ws.getCell('E' + (i + 11 + offset)).value === 'idle'){
                countNoOfIdle++ ;
                countDurOfIdle += device.data[i].duration;
            }
        }
    ws.getCell('A7').value = 'Total number of idle : ' + countNoOfIdle;
    ws.getCell('A8').value = 'Total duration of idle : ' + dateutils.getDurationFromSecs(countDurOfIdle);
        fillAddress(ws, 'B', 11 + offset, device.data, function (err) {
            saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time instanceof Array ? data.start_time[0] : data.start_time, data.folderName || 'report_idle', data.reportName || 'idle-report', callback);
        });
    //}

};

exports.getVehicleSummaryReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('VehicleSummry');

    formatTitle(ws, 6, 'Vehicle Summary Report');
    formatColumnHeaders(ws, 2, ['VEHICLE', 'DISTANCE(Kms)', 'DRIVING DURATION', 'STOP DURATION','IDLE DURATION', 'COUNT'], [15, 15, 15, 15,15, 10]);
    let i = 0;
    for (let imei in data.data) {
        const device = data.data[imei];
        if (activeusersmanager.getDeviceWithIMEI(imei) && activeusersmanager.getDeviceWithIMEI(imei).reg_no) {
            ws.getCell('A' + (i + 3)).value = activeusersmanager.getDeviceWithIMEI(imei).reg_no;
        } else {
            ws.getCell('A' + (i + 3)).value = imei;
        }
        ws.getCell('B' + (i + 3)).value = ((device.tot_dist / 1000).toFixed(2));
        ws.getCell('C' + (i + 3)).value = dateutils.getDurationFromSecs(device.dur_stop);
        ws.getCell('D' + (i + 3)).value = dateutils.getDurationFromSecs(device.dur_wo_stop);
        ws.getCell('E' + (i + 3)).value = dateutils.getDurationFromSecs(device.dur_idle);
        ws.getCell('F' + (i + 3)).value = device.num_stops;
        i++;
       }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time, 'vehicle_summary', 'vehicle_summary', callback);

};

exports.getVehicleIdleSummaryReport = function (data, callback) {
    let timezone = "Asia/Calcutta";//moment.tz.guess();
    if (data.timezone) timezone = data.timezone;
    const workbook = new Excel.Workbook();
    const ws = workbook.addWorksheet('Idle Vehicle Report');

    formatTitle(ws, 6, 'Idle Vehicle Report');
    formatColumnHeaders(ws, 2, ['VEHICLE', 'Start Time', 'End Time', 'DURATION','After Idle'], [15, 15, 15, 15,15]);
    let i = 0;
    for (let imei in data.data) {
        const device = data.data[imei];
        for(let d=0;d<device.data.length;d++){
            if (device.reg_no) {
                ws.getCell('A' + (i + 3)).value = device.reg_no;
            } else {
                ws.getCell('A' + (i + 3)).value = imei;
            }
            ws.getCell('B' + (i + 3)).value = dateutils.getFormattedDateTimeByZone(device.data[d].start_time);
            ws.getCell('C' + (i + 3)).value = dateutils.getFormattedDateTimeByZone(device.data[d].end_time);
            ws.getCell('D' + (i + 3)).value = dateutils.getDurationFromSecs(device.data[d].idle_duration);
            ws.getCell('E' + (i + 3)).value =device.data[d].aist
          //  ws.getCell('F' + (i + 3)).value = device.data[d].start_addr;
            i++;
        }  
       }
    saveFileAndReturnCallback(workbook, data.misType || "miscellaneous", data.login_uid, data.start_time, 'idle_vehicle_summary', 'idle_vehicle_summary', callback);

};

function fillAddress(ws, cell, start_row, data, _callback) {
    async.eachLimit(data, 100, function (d, callback) {
        if (!d.start) return callback();
        if (d.start_addr) {
            ws.getCell(cell + (data.indexOf(d) + start_row)).value = d.start_addr;
            ws.getCell(cell + (data.indexOf(d) + start_row)).alignment = { horizontal: 'left', wrapText: true }
            return callback();
        }
        addressService.getAddressAsync(d.start.latitude, d.start.longitude)
            .then(function (addr) {
                ws.getCell(cell + (data.indexOf(d) + start_row)).value = addr;
                ws.getCell(cell + (data.indexOf(d) + start_row)).alignment = {  horizontal: 'left', wrapText: true }
                callback();
            })
            .error(function () {
                callback();
            });
    }, function (err) {
        _callback(err, ws);
    });
}

function fillAddressEnd(ws, cell, start_row, data, _callback) {
    async.eachLimit(data, 100, function (d, callback) {
        if (!d.stop) return callback();
        if (d.stop_addr) {
            ws.getCell(cell + (data.indexOf(d) + start_row)).value = d.stop_addr;
            ws.getCell(cell + (data.indexOf(d) + start_row)).alignment = {  horizontal: 'left', wrapText: true }
            return callback();
        }
        addressService.getAddressAsync(d.stop.latitude, d.stop.longitude)
            .then(function (addr) {
                ws.getCell(cell + (data.indexOf(d) + start_row)).value = addr;
                ws.getCell(cell + (data.indexOf(d) + start_row)).alignment = {  horizontal: 'left', wrapText: true }

                callback();
            })
            .error(function () {
                callback();
            });
    }, function (err) {
        _callback(err, ws);
    });
}

function saveFileAndReturnCallback(workbook, folderIdentifier, user_id, time, foldername, reportname, callback) {
    //const dir = 'reports/' + user_id + '/' + dateutils.getMMDDYYYY() + '/' + folderIdentifier + '/' + foldername + '/';
    const dir = 'reports/' + user_id + '/' + folderIdentifier + '/' + foldername + '/';
    const filename = reportname + '_' + dateutils.getYYYYMMDDHHMM(time) + '.xlsx';
    mkdirp.sync('./files/' + dir);
    const urlFile = 'http://' + externalip + ':8080/' + dir + filename;

    workbook.xlsx.writeFile('./files/' + dir + filename).then(function () {
        callback({filename: filename, dir: dir, url: urlFile});
    });
}

function formatTitle(ws, size, title) {
    const s = String.fromCharCode(65);
    const e = String.fromCharCode(64 + size);

    ws.mergeCells(s + 1 + ':' + e + 1);
    ws.getCell('A1').alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };

    ws.getCell('A1').fill = headerFill;
    ws.getCell('A1').value = title;
}

function centerAlign(cell) {
    cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };
}

function leftAlign(cell) {
    cell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
    };
}

function mergeCells(ws, offset, size) {
    const s = String.fromCharCode(65);
    const e = String.fromCharCode(64 + size);
    ws.mergeCells(s + offset + ':' + e + offset);
}

function formatColumnHeaders(ws, offset, names, sizes) {
    let count = 0;
    for (let i = 0; i < names.length; i++) {
        if (i % 26 == 0) {
            count = 0
        }
        if (names[i]) {
            let column;
            if (i > 129) {
                column = "E" + (String.fromCharCode(65 + count));
            }else if (i > 103) {
                column = "D" + (String.fromCharCode(65 + count));
            }else if (i > 77) {
                column = "C" + (String.fromCharCode(65 + count));
            }else if (i > 51) {
                column = "B" + (String.fromCharCode(65 + count));
            } else if (i > 25) {
                column = "A" + (String.fromCharCode(65 + count));
            } else {
                column = String.fromCharCode(65 + i);
            }

            ws.getCell(column + offset).value = names[i];
            ws.getColumn(column).width = sizes[i];
            ws.getCell(column + offset).fill = columnFill;
            ws.getCell(column + offset).font = {
                bold: true
            };
            ws.getCell(column + offset).border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
        }
        count++;
    }
}

function setVal(worksheet, column, row, value = '', prop = {}) {
    let cell = worksheet.getCell(column+row);
    cell.value = value;
    if (prop.fill) {
        cell.fill = typeof prop.fill === 'boolean' ? columnFill : {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
                argb: prop.fill
            }
        };
    }
    if (prop.border) {
        cell.border = {
            top: {style: 'thin'},
            left: {style: 'thin'},
            bottom: {style: 'thin'},
            right: {style: 'thin'}
        };
    }
    if (prop.width) {
        worksheet.getColumn(column).width = prop.width;
    }
}

function getAlphabet(j) {
    if (j > 129) {
        return 'E' +  alphabet[j - 130];
    }else if (j > 103) {
        return 'D' +  alphabet[j - 104];
    }else if(j>77){
        return 'C' +  alphabet[j - 78];
    }else if(j>51){
        return 'B' +  alphabet[j - 52];
    }else if(j>25){
        return 'A' +  alphabet[j - 26];
    }else{
        return alphabet[j];
    }
}
