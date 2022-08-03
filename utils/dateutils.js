const moment = require('moment-timezone');
exports.getDDMMYYYY = function (date_) {
	let date;
	if (date_) {
		date = new Date(date_);
	} else {
		date = new Date();
	}
	let dMonth, dDate;
	if (date.getMonth() < 9) {
		dMonth = "0" + (date.getMonth() + 1).toString();
	} else {
		dMonth = (date.getMonth() + 1).toString();
	}
	if (date.getDate() < 10) {
		dDate = "0" + date.getDate().toString();
	} else {
		dDate = date.getDate().toString();
	}
	return dDate + "-" + dMonth + "-" + date.getFullYear().toString();
};

exports.getMorning = function (date) {
	if (date === undefined) {
		date = new Date();
	} else {
		date = new Date(date);
	}
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
};

exports.getYesterdayEvening = function () {
    return new Date(exports.getMorning().getTime()-1);
};

exports.getYesterdayMorning = function (date) {
	if (date === undefined) {
		date = new Date();
	} else {
		date = new Date(date);
	}

	date.setDate(date.getDate() - 1);
	return exports.getMorning(date);
};

exports.getPrevDayMorning = function (numDay) {
	const date = new Date();
	date.setDate(date.getDate() - numDay);
	return exports.getMorning(date);
};

exports.gethhmmaa = function (date) {
	date = new Date(date);
	let hours = date.getHours();
	let minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	const strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
};

exports.getFormattedDateTime = function (date) {
	date = new Date(date);
	return exports.getDDMMYYYY(date) + ' ' + exports.gethhmmaa(date);
};
exports.getFormattedDateTimeByZone = function (date,timezone) {
	return moment.tz(date,timezone).format('LLL');
};

exports.getDMYHMS = function (d) {
	d = new Date(d);
	return ("00" + d.getDate()).slice(-2) + "/" +
		("00" + (d.getMonth() + 1)).slice(-2) + "/" +
		d.getFullYear() + " " +
		("00" + d.getHours()).slice(-2) + ":" +
		("00" + d.getMinutes()).slice(-2) + ":" +
		("00" + d.getSeconds()).slice(-2);
};

exports.getDMYHMSMs = function (d) {
    d = new Date(d);
    return d.getFullYear() +"-"+
        ("00" + (d.getMonth() + 1)).slice(-2) + "-" +
		("00" + d.getDate()).slice(-2) + " " +
        ("00" + d.getHours()).slice(-2) + ":" +
        ("00" + d.getMinutes()).slice(-2) + ":" +
        ("00" + d.getSeconds()).slice(-2) +"."+
        ("00" + d.getMilliseconds()).slice(-3);
};

exports.getMMDDYYYY = function () {
	let dateNow = new Date(),
		dMonth, dDate;
	if (dateNow.getMonth() < 9) {
		dMonth = "0" + (dateNow.getMonth() + 1).toString();
	} else {
		dMonth = (dateNow.getMonth() + 1).toString();
	}
	if (dateNow.getDate() < 10) {
		dDate = "0" + dateNow.getDate().toString();
	} else {
		dDate = dateNow.getDate().toString();
	}
	return dMonth + "-" + dDate + "-" + dateNow.getFullYear().toString();
};

exports.getYYYYMMDDHHMM = function (date) {
	date = new Date(date);
	let hours = date.getHours();
	hours = hours < 10 ? '0' + hours : hours;
	let minutes = date.getMinutes();
	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	return exports.getYYYYMMDD(date) + hours + minutes;
};

exports.getYYYYMMDDHHMM = function (date) {
	date = new Date(date);
	let hours = date.getHours();
	hours = hours < 10 ? '0' + hours : hours;
	let minutes = date.getMinutes();
	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;
	return exports.getYYYYMMDD(date, true) + hours + ':' + minutes;
};

exports.getYYYYMMDD = function (date, sepByHyphn) {
	date = new Date(date);
	let dMonth, dDate;
	if (date.getMonth() < 9) {
		dMonth = "0" + (date.getMonth() + 1).toString();
	} else {
		dMonth = (date.getMonth() + 1).toString();
	}
	if (date.getDate() < 10) {
		dDate = "0" + date.getDate().toString();
	} else {
		dDate = date.getDate().toString();
	}
	if(sepByHyphn === true)
		return date.getFullYear().toString() + '-' + dMonth + '-'  + dDate + '   ' ;
	else
		return date.getFullYear().toString() + dMonth + dDate;
};

exports.getDuration = function (start, end) {
	start = new Date(start);
	end = new Date(end);
	const dur = end.getTime() - start.getTime();
	return exports.getDurationFromSecs(parseInt(dur / 1000));
};

exports.getHrDurationFromSecs = function (dur) {
	if (dur < 60) return 0;
	return parseFloat(dur / (60 * 60)).toFixed(2);
};
exports.getDurationFromSecs = function (dur) {
    if (dur < 60) return dur + ' Sec ';
    let days = parseInt(dur / (60 * 60 * 24));
    let hours = parseInt((dur % (60 * 60 * 24)) / (60 * 60));
    let mins = parseInt((dur % (60 * 60)) / 60);
    days = days > 0 ? days + ' D ' : '';
    hours = hours > 0 ? hours + ' H ' : '';
    mins = mins > 0 ? mins + ' M ' : '';
    return days + hours + mins;
};

exports.getDurationFromSecsWithColon = function (dur) {
	if (dur < 60) return 0;
	//let days = parseInt(dur / (60 * 60 * 24));
	let hours = parseInt(dur / (60 * 60));
	let mins = parseInt((dur % (60 * 60)) / 60);
	let secs = parseInt(dur % 60);
	//days = days > 0 ? days + ':' : '0:';
	hours = hours > 0 ? hours + ':' : '0:';
	mins = mins > 0 ? mins +':' : '0:';
	secs = secs > 0 ? secs  : '0';

	return hours + mins + secs;
};

exports.getSecs = function (dt) {
	return parseInt(new Date(dt).getTime() / 1000);
};

exports.sortAscComparator = function (a, b) {
	const keyA = new Date(a),
		keyB = new Date(b);
	// Compare the 2 dates
	if (keyA < keyB) return -1;
	if (keyA > keyB) return 1;
	return 0;
};

exports.sortSplitComparator = function (a, b) {
	a = a.split('-');
	b = b.split('-');
	a = a[2] + a[1] + a[0];
	b = b[2] + b[1] + b[0];
	a = parseInt(a);
	b = parseInt(b);
	return a < b ? (a === b ? 0 : 1) : -1;
};

exports.getDateArray = function (start, end) {
	start = new Date(start).getTime();
	end = new Date(end).getTime();
	let current = start;
	let dateArray = [];
	while (current < end) {
		dateArray.push(exports.getDDMMYYYY(current));
		current += 24 * 60 * 60 * 1000;
	}
	let endD = exports.getDDMMYYYY(end);
	if(dateArray.indexOf(endD) == -1){
		dateArray.push(endD);
	}
	return dateArray;
};

exports.getHrDifference = function (start, end) {
    start = new Date(start);
    end = new Date(end);
    const diffInHrs = parseInt((end.getTime() - start.getTime())/(1000*60*60));
    return diffInHrs;
};
exports.getDateFromYYYYMMDD = function (start) {
	let year = start.toString().substr(0,4);
    let month = start.toString().substr(4,2);
    let day = start.toString().substr(6,2);
    let sDate = new Date();
    sDate.setYear(year);
    sDate.setMonth(parseInt(month)-1);
    sDate.setDate(day);
    sDate.setHours(0);
    sDate.setMinutes(0);
    return sDate;
};

exports.stringToDate = function (string, format='DD-MM-YYYY') {
    return moment(string, format).toDate();
};

exports.add = function (date, duration, unit = 'day', format = 'DD-MM-YYYY') {
    let obj = moment(date).add(duration, unit);
    if(format)
        obj.format(format);
    return obj.toDate();
};

exports.startOf = function (date = new Date(), unit = 'day') {
    return moment(date, 'DD-MM-YYYY').startOf(unit).toDate();
};
