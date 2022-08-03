/*jshint esversion: 6 */

module.exports = {
	"http_host": "localhost",
	"http_port": 8081,
	"app_secret": "gpsgaadi_05052016",
	"isLocal": true,
	"isLocalReceiver": false,
	"mongo":{
		"host":"localhost",
		"port":27017,
		"user":"",
		"password":"",
		"db":"gpsgaadi"
	},
	"lms_mongo":{
		"host":"localhost",
		"port":27017,
		"user":"",
		"password":"",
		"db":"lmsDB"
	},
	"tracksheetCronTime":720000,
	"tripSyncCronTime":59,//in minutes
	"database": {
		//"nodes": ["localhost"],
        "nodes":["15.206.33.235","101.53.139.123"],
		"keyspace": "gps_ups",
        "enable_email": true,
        "enable_sms": true,
		"enable_scheduler": true,
		"enable_server_checks": true,
		"table_gps_data": "gps_data",
		"table_cities": "cities",
		"table_users": "users",
		"table_vehicles": "vehicles",
		"table_device_inventory": "device_inventory",
		"table_report_parking": "report_parking",
		"table_report_overspeed": "report_overspeed",
		"table_report_acc": "report_acc",
		"table_drives_and_stops": "drives_and_stops",
		"table_aggregated_drives_and_stops": "aggregated_drives_and_stops",
		"table_notification": "notifications",
		"table_Alarm": "alarms",
		"table_geozone": "geozones",
		"table_heartbeat": "heartbeat_packet",
		"table_sim_info": "sim_info",
		"table_vehicle": "vehicles",
		"table_gpsgaadi": "gpsgaadi",
		"table_Trip": "trips",
		"table_shared_locations": "shared_locations",
		"table_mobile_device": "mobile_device",
		"table_notification_pref": "notification_pref",
		"table_report_user_config": "report_user_config",
		"table_Malfunction": "malfunction",
		"table_adas_refined": "adas_refined",
        "table_adas_refined_new": "adas_refined_new",
		"table_adas_daily": "adas_daily",
		"table_adas_weekly": "adas_weekly",
		"table_adas_monthly": "adas_monthly",
		"table_landmarks": "landmarks",
		"table_tolls": "tolls",
		"table_features": "features",
		"table_Alarm_schedule":"alarm_schedule",
		"table_device_alerts":"device_alerts"
	},

	"commands": {
		"location": {
			"desc": "Get Location",
			"param": false
		},
		"petrol_cut": {
			"desc": "Cut Petrol",
			"param": false
		},
		"petrol_restore": {
			"desc": "Restore Petrol",
			"param": false
		},
		"param": {
			"desc": "Get Parameters",
			"param": false
		},
		"gprs_param": {
			"desc": "Get Gprs Parameters",
			"param": false
		},
		"restore_factory": {
			"desc": "Restore Factory Settings",
			"param": false
		},
		"reboot": {
			"desc": "Reboot Device",
			"param": false
		},
		"activate_vibration_alarm": {
			"desc": "Activate Vibration Alarm",
			"param": false
		},
		"deactivate_vibration_alarm": {
			"desc": "Deactivate Vibration Alarm",
			"param": false
		},
		"change_apn": {
			"desc": "Change Apn",
			"param": "Provide new APN"
		},
		"change_dns": {
			"desc": "Change DNS",
			"param": "Provide new DNS,PORT"
		},
		"gprs_off": {
			"desc": "Turn Off Gprs",
			"param": false
		},
		"add_sos_number": {
			"desc": "Add sos Number(s)",
			"param": "Provide comma separated phone numbers"
		},
		"delete_sos_number": {
			"desc": "Delete sos Number",
			"param": "Provide phone number or index from parameters"
		},
		"set_center_number": {
			"desc": "Set Center Number",
			"param": "Provide phone number from which petrol can be cut/restored"
		},
		"delete_center_number": {
			"desc": "Delete Center Number",
			"param": false
		},
		"set_time_interval": {
			"desc": "Set Location Update Interval",
			"param": "Provide location update interval in seconds"
		},
		"t1_set_time_interval": {
			"desc": "Set Location Update Interval",
			"param": "Provide location update interval in seconds/10\nExample: 6 for 60 seconds"
		},
		"sensor_alarm_time": {
			"desc": "Sensor Alarm Trigger Duration",
			"param": "Provide time to wait in mins before triggering alarm"
		},
		"location_url": {
			"desc": "Get Location Url",
			"param": false
		},
		"overspeed_alarm": {
			"desc": "Set Overspeed Alarm",
			"param": "Provide duration in minutes,speed limit"
		},
		"version": {
			"desc": "Query software version",
			"param": false
		},
		"set_adaptive_timezone": {
			"desc": "Set adaptive time zone ",
			"param": "Type ON/OFF"
		},
		"get_adaptive_timezone": {
			"desc": "Get adaptive time zone ",
			"param": false
		},
		"set_timezone": {
			"desc": "Set the time zone",
			"param": "<A>,<B>[,C]\nA: The value is E or W. E: indicates the eastern time zone; W: indicates\nthe western time zone. Default value: E.\nB: indicates the time zone. Value range: 0ΓÇô12; default value: 8.\nC: indicates the half-hour time zone. Value: 0, 15, 30, or 45; default\nvalue: 0"
		},
		"get_timezone": {
			"desc": "Get the time zone",
			"param": false
		},
		"t1_set_heartbeat_interval": {
			"desc": "Set the heartbeat packet interval",
			"param": "Interval = 0: function disabled (default).\nInterval = [1...65535]: function enabled. Unit: minute."
		},
		"avl500_set_heartbeat_interval": {
			"desc": "Set heartbeat interval",
			"param": "Send M1 to M720. M1= 1 min"
		},
		"vt2_set_heartbeat_interval": {
			"desc": "Set the heartbeat packet interval",
			"param": "T1[,T2]\nT1: indicates the heartbeat packet interval when the ACC is on. Value\nrange: 1ΓÇô300; unit: minute; default value: 3.\nT2: indicates the heartbeat packet interval when the ACC is off. Value\nrange: 1ΓÇô300; unit: minute; default value: 5."
		},
		"get_heartbeat_interval": {
			"desc": "Get the heartbeat packet interval ",
			"param": false
		},
		"set_geofence_alarm": {
			"desc": "Set a geo-fence alarm",
			"param": "1.  Set a circular geo-fence.\nCommand format: <B>,0,<D>,<E>,<F>[,X][,M]\nB: The value is ON or OFF. ON: Enable the geo-fence alarm; OFF:\nDisable the geo-fence alarm. Default value: OFF.\nD: indicates the center's latitude.\nE: indicates the center's longitude.\nF: indicates the radius. Value range: 100ΓÇô9999; unit: meter.\nX: The value is IN or OUT. IN: indicates the entering geo-fence\nalarm; OUT: indicates the exiting geo-fence alarm. If the parameter\nis not set, it means that an alarm will be generated when you enter\nor exit the geo-fence (default).\nM: indicates the alarm reporting model. Value range: 0ΓÇô2; default\nvalue: 0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report\nby GPRS, SMS, and call.\n2.  Set a polygon geo-fence.\nCommand format: FENCE ,<B>,2 [,X][,M], N ,LAT1,LON1,\nLAT2 ,LON2,ΓÇªLATN,LONN#\nB: The value is ON or OFF. ON: Enable the geo-fence alarm; OFF:\nDisable the geo-fence alarm. Default value: OFF.\nN: indicates the number of points of a polygon geo-fence (3 Γëñ N Γëñ\n9).\nLATN: indicates the latitude of coordinate N. Value range: -90┬░C to\n90┬░C.\nLONN: indicates the longitude of coordinate N. Value range: -180┬░C\nto 180┬░C.\nYou can add symbols N/S and +/ΓÇô before the latitude value.\nYou can add symbols E/W and +/ΓÇô before the longitude value.\nX: The value is IN or OUT. IN: indicates the entering geo-fence\nalarm; OUT: indicates the exiting geo-fence alarm. If the parameter\nis not set, it means that an alarm will be generated when you enter\nor exit the geo-fence (default).\nM: indicates the alarm reporting model. Value range: 0ΓÇô2; default\nvalue: 0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report\nby GPRS, SMS, and call.\nYou are not allowed to add symbols before the east longitude and\nnorth latitude values; you can add symbol \"-\" before the west\nlongitude and south latitude values."
		},
		"get_geofence_alarm": {
			"desc": "Get geo-fence alarm",
			"param": false
		},
		"restore_default_password": {
			"desc": "Restore default SMS password",
			"param": false
		},
		"change_password": {
			"desc": "Change SMS password",
			"param": "Support digits and letters (A–Z, a–z, or 0–9); case-sensitive; contains 1–19 characters"
		},
		"set_sleep_interval": {
			"desc": "Set time before sleep mode",
			"param": "indicates the time between the last vibration and sleep mode. During this period, no vibration is detected. Value range: 0–60; unit: minute; default value: 10."
		},
		"get_sleep_interval": {
			"desc": "Get time before sleep mode",
			"param": false
		},
		"set_vibration_alarm": {
			"desc": "Set vibration alarm parameters",
			"param": "<A>[,B][,C]\nA: indicates the vibration time. Value range: 10–300; unit: second;\ndefault value: 10.\nB: indicates the delay time for sending a vibration alarm in arming\nmode. Value range: 10–300; unit: second; default value: 60.\nC: indicates the vibration alarm interval. Value range: 1–300; unit:\nminute; default value: 15."
		},
		"get_vibration_alarm": {
			"desc": "Get vibration alarm parameters",
			"param": false
		},
		"set_theft_alarm": {
			"desc": "Set vehicle theft alarm",
			"param": "<A>,[B]\nA: Whether to enable the alarm. The value is ON or OFF. Default value:\nON.\nB: indicates the alarm reporting model. Value range: 0–2; default value:\n0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report by GPRS,\nSMS, and call."
		},
		"get_theft_alarm": {
			"desc": "Get vehicle theft alarm parameters",
			"param": false
		},
		"vt2_vibration_alarm": {
			"desc": "Activate/Deactivate vibration alarm",
			"param": "<A>[,M]\nA: Whether to enable the alarm. The value is ON or OFF. The default\nvalue is OFF.\nM: indicates the alarm reporting model. Value range: 0–2; default value:\n0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report by GPRS,\nSMS, and call."
		},
		"get_vibration_params": {
			"desc": "Get vibration alarm status",
			"param": false
		},
		"set_arm_disarm": {
			"desc": "Set arm/disarm",
			"param": "Type ON/OFF"
		},
		"set_power_alarm": {
			"desc": "Set external power supply alarm(connect/disconnect)",
			"param": "<A>[,M][,T1]\nA: Whether to enable the alarm. The value is ON or OFF. The default\nvalue is ON.\nM: indicates the alarm reporting model. Value range: 0–2; default value:\n0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report by GPRS,\nSMS, and call.\nT1: indicates the delay time for sending a power cut-off alarm. Value\nrange: 2–60; unit: second; default value: 10."
		},
		"set_battery_alarm": {
			"desc": "Set low battery alarm",
			"param": "<A>[,M]\nA: Whether to enable the alarm. The value is ON or OFF. The default\nvalue is ON.\nM: indicates the alarm reporting model. Value: 0 or 1; default value: 0.\n0: Report by GPRS; 1: Report by SMS and GPRS."
		},
		"set_moving_alarm": {
			"desc": "Set moving alarm",
			"param": "<A>[,R][,M]\nA: Whether to enable the alarm. The value is ON or OFF. The default\nvalue is OFF.\nR: indicates the radius for moving. Value range: 50–1000; unit: meter;\ndefault value: 50.\nM: indicates the alarm reporting model. Value range: 0–2; default value:\n0. 0: Report by GPRS; 1: Report by SMS and GPRS; 2: Report by GPRS,\nSMS, and call."
		},
		"vt2_overspeed_alarm": {
			"desc": "Set speeding alarmn",
			"param": "<A>[,B][,C,][M]\nA: Whether to enable the alarm. The value is ON or OFF. The default\nvalue is OFF.\nB: indicates the speeding time. Value range: 5–600; unit: second;\ndefault value: 20.\nC: indicates the speeding limit. Value range: 1–255; unit: km/h; default\nvalue: 0.\nM: indicates the alarm reporting model. Value: 0 or 1; default value: 0.\n0: Report by GPRS; 1: Report by SMS and GPRS."
		},
		"set_static_drift": {
			"desc": "Set the static drift data filtering function",
			"param": "<A>[,B]\nA: Whether to enable the static drift data filtering function. The value is\nON or OFF. The default value is ON.\nB: indicates the filtering distance. Value range: 10–1000; unit: meter;\ndefault value: 100."
		},
		"vt2_set_heading_change": {
			"desc": "Set the heading change report resending function",
			"param": "<X>[,A][,B]#\nX: Whether to enable the function. The value is ON or OFF. The default\nvalue is ON.\nA: indicates the driving angle. Value range: 5–180; unit: degree; default\nvalue: 15.\nB: indicates the heading change time. Value range: 2–5; unit: second;\ndefault value: 2."
		},
		"t1_set_heading_change": {
			"desc": "Set the heading change report resending function",
			"param": "Send driving angle change required"
		},
		"get_iccid": {
			"desc": "Query ICCID",
			"param": false
		},
		"set_track_distance": {
			"desc": "Set tracking distance",
			"param": "Send distance change in metres to send location packet"
		},
		"set_parking_scheduled_tracking": {
			"desc": "Set Location Update Interval during parking",
			"param": "Provide location update interval in seconds/10\nExample: 6 for 60 seconds"
		},
		"enable_parking_scheduled_tracking": {
			"desc": "Enable location update interval change during parking",
			"param": false
		},
		"enable_rfid": {
			"desc": "Enable RFID",
			"param": "1 to enable, 0 to disable"
		},
		"shake_wake_up": {
			"desc": "Shake wake up",
			"param": "1 to enable, 0 to disable"
		},
		"set_gprs_param": {
			"desc": "Set gprs params",
			"param": "Connection mode,IP address,Port,APN,APN user name,APN password\nConnection mode = 0: function disabled.\nConnection mode = 1: function enabled; use TCP/IP reporting mode.\nConnection mode = 2: function enabled; use UDP reporting mode.\nIP address: IP address or domain name. A maximum of 32 bytes are supported.\nPort: a maximum of 5 digits.\nAPN/APN user name/APN password: a maximum of 32 bytes respectively.\nIf no user name and password are required, leave them blank."
		},
		"t1_change_dns": {
			"desc": "Set dns server ip address",
			"param": "Send ip address"
		},
		"set_standby_server": {
			"desc": "Set standby gprs server",
			"param": "Send ip address, port separated by comma"
		},
		"set_man_down_alarm": {
			"desc": "Set man down alarm",
			"param": "Send Switch,Time,Grade\r\nSwitch: Whether to enable the man down alarm detection function. The value is 0 or 1 and is in decimal format. When the parameter value is 1, the man down alarm function is enabled. When the parameter value is 0, the man down alarm function is disabled. The default value is 0.\r\nTime: indicates the buzzing and vibration time after the device falls to the ground. During this period, you can press any button of the device to clear the alarm, so as to avoid misinformation. If no button is pressed during this period, a man down alarm (event 79) will be generated or the tracker will call the designated contact. Unit: second; value range: 0\u2013255; decimal; default value: 10.\r\nGrade: indicates the man down alarm level. Value range: 0\u20133; decimal; default value: 1. The smaller the value is, the higher the alarm probability is."
		},
		"read_authorized_phones": {
			"desc": "Get authorized phones",
			"param": false
		},
		"add_listen_in_number": {
			"desc": "Add listen in number",
			"param": "Send phone numbers separated by comma (max 2)"
		},
		"set_smart_sleep": {
			"desc": "Set smart sleep mode",
			"param": "Set the automatic smart sleep mode when the tracker is idle.\nSleep level = 0: function disabled (default).\nSleep level = 1: normal sleep. The GSM module always works, and the GPS module occasionally enters the sleep mode. The tracker works 25% longer in the normal sleep mode than that in the normal working mode. This mode is not recommended for short interval tracking; this will affect the route precision.\nSleep level = 2: deep sleep. If no event is triggered after five minutes, the GPS module will stop and the GSM module will enter sleep mode. Once an event is triggered, the GPS and GSM modules will be woken up. A heartbeat event will be triggered only in the deep sleep mode, which will be uploaded every one hour by default."
		},
		"delete_gprs_cache": {
			"desc": "Delete gprs event from device cache",
			"param": "Send number of events to delete"
		},
		"add_geofence": {
			"desc": "Add geofence",
			"param": "Geo-fence number,Latitude,Longitude,Radius,IN Geo-fence alarm,OUT Geo-fence\nGeo-fence number: 1–8. A maximum of eight geo-fences can be set.\nLatitude: latitude of the geo-fence center; decimal; accurate to 6 digits after the decimal point. If there are only 4 digits after the decimal point, add two digits 0. Otherwise, the command cannot be used successfully.\nLongitude: longitude of the geo-fence center; decimal; accurate to 6 digits after the decimal point. If there are only 4 digits after the decimal point, add two digits 0. Otherwise, the command cannot be used successfully.\nRadius: The value ranges from 1 to 4294967295. The unit is meter.\nIN Geo-fence alarm = 0: function disabled.\nIN Geo-fence alarm = 1: function enabled.\nOUT Geo-fence alarm = 0: function disabled.\nOUT Geo-fence alarm = 1: function enabled."
		},
		"delete_geofence": {
			"desc": "Delete geofence",
			"param": "Enter 1-8"
		},
		"t1_overspeed_alarm": {
			"desc": "Set overspeed alarm",
			"param": "Send speed limit in kmph"
		},
		"tow_alarm": {
			"desc": "Set towing alarm",
			"param": "Send vibration duration in seconds"
		},
		"anti_theft": {
			"desc": "Set anti theft alarm",
			"param": "1 to enable, 0 to disable"
		},
		"turn_off_indicator": {
			"desc": "Turn off indicator",
			"param": "00 to turn on, 10 to turn off"
		},
		"set_log_interval": {
			"desc": "Set log interval",
			"param": "Send log interval in seconds"
		},
		"set_sms_timezone": {
			"desc": "Set sms timezone",
			"param": "Send sms timezone in minutes\nWhen SMS minute is 0, the time zone is GMT 0."
		},
		"set_gprs_timezone": {
			"desc": "Set gprs timezone",
			"param": "Send GPRS timezone in minutes\nWhen GPRS minute is 0, the time zone is GMT 0 (default)."
		},
		"check_engine_first": {
			"desc": "Check the Engine First to Determine Tracker Running Status",
			"param": "Send 0 to disable(default) and 1 to enable"
		},
		"set_sms_event_char": {
			"desc": "Setting SMS Event Characters",
			"param": "Send Event SMS code,SMS header"
		},
		"set_gprs_event_flag": {
			"desc": "Set gprs event flag",
			"param": "Set one or multiple GPRS event flags.\nGPRS event flag: 16 hexadecimal strings (64 bits).\nHigh bit: indicates the 64th event flag (bit 63).\nLow bit: indicates 1st event (SOS) flag (bit 0)."
		},
		"read_gprs_event_flag": {
			"desc": "Read gprs event flags",
			"param": false
		},
		"set_photo_event_flag": {
			"desc": "Set Photographing Event Flag",
			"param": "Eg: 0000000000000001"
		},
		"read_photo_event_flag": {
			"desc": "Read Photographing event flag",
			"param": false
		},
		"set_event_auth": {
			"desc": "Set event authorization",
			"param": "<SMS>/<0>,<Phone number location>/<Authorized phone number>,<Operation\r\ncode>, [Event code 1]......[Event code n]\r\nB99,<CALL>/<1>,<Phone number location>/<Authorized phone number>,<Operation\r\ncode>, [Event code 1]......[Event code n]\r\nB99,<GPRS>/<2>,<Operation code>, [Event code 1]......[Event code n]\r\n0000,B99,<CAMERA>/<3>,<Operation code>, [Event code 1]......[Event code n]\r\nB99,<BUZZER>/<4>,<Operation code>, [Event code 1]......[Event code n].Fields SMS, CALL, CAMERA, GPRS, and BUZZER can be presented by 0–4 in decimal\r\nstring.\r\nOperation codes GET, SET, ADD, and DEL can be presented by 0–3 in decimal string.\r\nThese characters are not case-sensitive.\r\nNote: Ensure that an authorized phone number is set by using the A71 command or the\r\nparameter configuration tool before the B99 command is used to set the SMS/CALL\r\nevent code. The tracker compares the authorized phone number issued by B99 with the\r\nauthorized phone number (excluding +86 characters) of the tracker. If the phone\r\nnumbers are the same, the new event code will be stored. If the phone numbers are\r\ninconsistent, an error SMS will be sent."
		},
		"output_control": {
			"desc": "Output control",
			"param": "Speed,ABCDE\nWhen the speed is 0, no speed limit exists. That is, when the tracker receives a\r\ncommand, the output control takes effect immediately.\r\nWhen the speed is a value ranging from 1 to 255 (unit: km/h), set the speed limit for\r\noutput control. When the driving speed is lower than the speed limit, the output control\r\ntakes effect.\r\nA=0, close output (OUT1) - open drain\r\nA=1, open output (OUT1) - connect to GND\r\nA=2, remain previous status.\r\nB=0, close output (OUT2) - open drain\r\nB=1, open output (OUT2) - connect to GND\r\nB=2, remain previous status.\r\nC=0, close output (OUT3) - open drain\r\nC=1, open output (OUT3) - connect to GND\r\nC=2, remain previous status.\r\nD=0, close output (OUT4) - open drain\r\nD=1, open output (OUT4) - connect to GND\r\nD=2, remain previous status.\r\nE=0, close output (OUT5) - open drain\r\nE=1, open output (OUT5) - connect to GND\r\nE=2, remain previous status."
		},
		"notify_tracker_to_send_sms": {
			"desc": "Notify tracker to send SMS",
			"param": "X,Phone number,Content\nX = 0: in TEXT mode\r\nX = 1: in Unicode mode\r\nPhone number: a maximum of 16 digits\r\nContent: a maximum of 140 characters"
		},
		"set_gprs_event_transmission_mode": {
			"desc": "Set gprs event transmission mode",
			"param": "0: automatic event report (default)\r\n1: Before another event can be transmitted, existing event reports need to be\r\nconfirmed and deleted on the server by the AFF command. Select this mode when GPRS\r\nuses UDP."
		},
		"gprs_information_display": {
			"desc": "GPRS information display",
			"param": "Level,Type,Content\nLevel: Level 0 indicates normal information, while level 1 indicates urgent information.\r\nType: indicates the encoding mode. E = ASCII. U = UNICODE2.\r\nContent: indicates the information text and has a maximum of 150 bytes."
		},
		"add_temp_sensor_number": {
			"desc": "Add temperature sensor",
			"param": "SN1 & number 1,SN2 & number 2,...,SNn & number n"
		},
		"delete_temp_sensor_number": {
			"desc": "Delete temperature sensor",
			"param": "Number 1,Number 2,...Number n"
		},
		"view_temp_sensor_number": {
			"desc": "Get tempetature sensors",
			"param": false
		},
		"set_temp_alarm_value": {
			"desc": "Set temperature alarm value",
			"param": "Number 1/SN1/High temperature value 1/Low temperature value 1/High\r\ntemperature alarm 1/Low temperature alarm 1/Logical name 1/...\nn: The maximum value is 8.\r\nNumber: one byte in hexadecimal format.\r\nSN: indicates the temperature sensor SN, and has eight bytes in hexadecimal format.\r\nHigh/Low temperature value: two bytes in hexadecimal format. The first byte is the\r\ninteger part. When the high bit is 1, the first byte is a negative integer. When the high\r\nbit is 0, the first byte is a positive integer. The second byte is the decimal part.\r\nHigh temperature alarm: one byte in hexadecimal format.\r\nLow temperature alarm: one byte in hexadecimal format.\r\nLogical name (customized name): 16 bytes in hexadecimal format."
		},
		"read_temp_sensor_param": {
			"desc": "Get temperature sensor parameters",
			"param": false
		},
		"check_temp_sensor_param": {
			"desc": "Check temperature sensor parameters",
			"param": false
		},
		"set_fuel_param": {
			"desc": "Set fuel parameters",
			"param": "Sensor type,Alarm percentage upper limit,Alarm percentage lower limit\nSensor type: 0, 1, 2, and 3\r\n 0 indicates that any fuel sensor is not connected.\r\n 1 indicates that a C-type fuel sensor is connected (AD2).\r\n 2 indicates that a R-type fuel sensor is connected (AD2).\r\n 3 indicates that a V-type fuel sensor is connected (AD2).\r\nFor the MVT600 and T1, the AD2 connects to the fuel sensor by default.\r\nAlarm percentage upper limit: When the value is 0, the alarm is cleared. When the value\r\nis not 0, GPRS and SMS event flags take effect automatically. When the fuel percentage is\r\nhigher than or equal to the value, an alarm is generated, and the alarm event code is 52.\r\nAlarm percentage lower limit: When the value is 0, the alarm is cleared. When the value\r\nis not 0, GPRS and SMS event flags take effect automatically. When the fuel percentage is\r\nlower than or equal to the value, an alarm is generate, and the alarm event code is 53.\r\nIf you want to modify a parameter, other parameters must be left blank and separators\r\n(,) must be remained. If you only send the C47 command, all parameters are initialized to\r\n0 and they are decimal characters.\r\nR-type fuel sensor: resistance output fuel sensor\r\nC-type fuel sensor: capacitance output fuel sensor\r\nV-type fuel sensor: voltage output fuel sensor\r\nFuel sensors A53 and A54 are the V type of fuel sensor."
		},
		"read_fuel_param": {
			"desc": "Read fuel parameters",
			"param": false
		},
		"set_fuel_theft_alarm": {
			"desc": "Set fuel theft alarm",
			"param": "Time for fuel check,Percent of fuel decrease\nTime for fuel check = 0: function disabled.\r\nTime for fuel check = [1...255]: function enabled. Decimal; unit: minute; default value: 3.\r\nPercent of fuel decrease = 0: function disabled.\r\nPercent of fuel decrease = [1...100]: function enabled. Decimal; default value: 2.\r\nBy default, the percent of fuel decrease is 2% within 3 minutes, a fuel theft alarm will be\r\ngenerated (for example: C49,3,2).\r\nNote: The percent of fuel decrease must be over two times larger than the percent of\r\nfuel sensor accuracy. For example, if the fuel sensor accuracy is 10 mm and its height is\r\n500 mm, the recommended percent of fuel decrease is 4% (10/500 x 2)."
		},
		"get_pic": {
			"desc": "Obtain picture",
			"param": "File name,Picture data packet start number\nFile name: Got from the tracker memory card. The file name is unique.\r\nPicture data packet start number: indicates the start sequence number of a picture\r\npackage. The minimum value is 0, indicating that you read the picture from the first\r\npicture package. A picture can be divided into multiple packages.\r\nNumber of picture data packages: indicates the number of packets of a picture. The\r\nminimum number is 1.\r\nCurrent picture data packet number: which picture packet is sent.\r\nPicture data: hexadecimal. After all picture data is obtained, a picture will be composed\r\nautomatically."
		},
		"get_pic_list": {
			"desc": "Get picture list",
			"param": "Picture data packet start number"
		},
		"delete_pic": {
			"desc": "Delete picture",
			"param": "Picture name (1)|Picture name (2)|...|Picture name (n)"
		},
		"take_pic": {
			"desc": "Take picture",
			"param": "Camera number,Picture name"
		},
		"add_rfid": {
			"desc": "Authorize RFID card",
			"param": "RFID(1),RFID(2),...,RFID(n)"
		},
		"add_rfid_batch": {
			"desc": "Add RFID in batches",
			"param": "RFID card start number,n\nRFID card start number: The value ranges from 1 to 4294967295. Decimal.\r\nn: indicates the number of batch-authorized RFID cards. Decimal. The maximum value is\r\n128."
		},
		"check_rfid_auth": {
			"desc": "Check RFID authorization",
			"param": "Send RFID"
		},
		"read_authorized_rfid": {
			"desc": "Read authorized RFID",
			"param": "Send RFID packet start number"
		},
		"delete_rfid": {
			"desc": "Delete RFID",
			"param": "RFID(1),RFID(2),...,RFID(n)"
		},
		"delete_rfid_batch": {
			"desc": "Delete RFID in batches",
			"param": "RFID card start number,n"
		},
		"check_rfid_checksum": {
			"desc": "Check the Checksum of the Authorized RFID Database",
			"param": false
		},
		"set_maintenance_mileage": {
			"desc": "Set the Maintenance Mileage",
			"param": "Send eight mileage points.\r\nEight mileage points: (Current mileage + Time interval between maintenance services x\r\n1), (Current mileage + Time interval between maintenance services x 2), (Current\r\nmileage + Time interval between maintenance services x 3), (Current mileage + Time\r\ninterval between maintenance services x 4), (Current mileage + Time interval between\r\nmaintenance services x 5), (Current mileage + Time interval between maintenance\r\nservices x 6), (Current mileage + Time interval between maintenance services x 7),\r\n(Current mileage + Time interval between maintenance services x 8)"
		},
		"set_maintenance_time": {
			"desc": "Set maintenance time",
			"param": "Send the time point of next eight times of maintenance services.\r\nTime point: days from January 1, 1990 to the next maintenance"
		},
		"read_tracker_info": {
			"desc": "Get tracker info",
			"param": false
		},
		"restart_gsm": {
			"desc": "Restart GSM module",
			"param": false
		},
		"restart_gps": {
			"desc": "Restart GPS module",
			"param": false
		},
		"set_mileage_runtime": {
			"desc": "Set mileage and run time",
			"param": "Run time(sec),Mileage(meter)"
		},
		"delete_sms_gprs_cache": {
			"desc": "Delete SMS/GPRS Cache Data",
			"param": "1: SMS cache data to be sent is deleted.\r\n2: GPRS cache data to be sent is deleted.\r\n3: SMS and GPRS cache data to be sent is deleted."
		},
		"set_device_id": {
			"desc": "Set device id",
			"param": "Enter device id"
		},
		"set_ip_addr": {
			"desc": "Server ip address",
			"param": "Enter server ip address"
		},
		"set_port": {
			"desc": "Server port",
			"param": "Enter server port"
		},
		"set_apn": {
			"desc": "Set apn",
			"param": "Enter apn"
		},
		"set_apun": {
			"desc": "Set apn username",
			"param": "Enter apn username"
		},
		"set_appw": {
			"desc": "Set apn password",
			"param": "Enter apn password"
		},
		"set_mode_of_com": {
			"desc": "Set mode of communication",
			"param": "Enter GSM or GPRS"
		},
		"get_mode_of_com": {
			"desc": "Get mode of communication",
			"param": false
		},
		"set_data_recording_freq": {
			"desc": "Set gps data recording frequency",
			"param": "Enter S5 for 5 seconds, M30 for 30 mins. Range is 5 seconds to 30 minutes. Default value is M1"
		},
		"set_location_time_list": {
			"desc": "Set location time list",
			"param": "Enter time1,time2,..timen where timen is in HHMM 24 hours format. Max n = 24"
		},
		"get_location_time_list": {
			"desc": "Get location time list",
			"param": false
		},
		"set_dist_pos_interval": {
			"desc": "Set distance based position interval",
			"param": "Unit: Km. Range: 0.100 to 500"
		},
		"get_dist_pos_interval": {
			"desc": "Get distance based position interval",
			"param": false
		},
		"set_periodic_pos_interval": {
			"desc": "Set periodic position interval",
			"param": "Enter S5 for 5 seconds, M300 for 5 hr. Range is 10 seconds to 12 hr."
		},
		"set_ppd_ignition": {
			"desc": "Set periodic position data with ignition on only",
			"param": "Send 1 to enable and 0 to disable. When enabled, periodic position data is sent with ignition on only"
		},
		"get_ppd_ignition": {
			"desc": "Get periodic position data with ignition on only status",
			"param": false
		},
		"set_upload_size": {
			"desc": "Set upload size",
			"param": "Unit: KB. Valid range is 0 to 255, Default value of UDS is 0."
		},
		"get_upload_size": {
			"desc": "Get upload size",
			"param": false
		},
		"get_summary": {
			"desc": "Get summary of logged position data",
			"param": false
		},
		"get_center_number": {
			"desc": "Set control center number",
			"param": "Enter control center number"
		},
		"set_auth_senders": {
			"desc": "Set authorized senders",
			"param": "List of maximum five authorized mobile numbers to interact with device through SMS"
		},
		"get_auth_senders": {
			"desc": "Get authorized centers",
			"param": false
		},
		"get_imei": {
			"desc": "Get imei",
			"param": false
		},
		"set_sos_number": {
			"desc": "Set sos number",
			"param": "List of maximum five mobile nos. who will receive panic SMS from Device whenever KEY10(SOS) key is pressed on Device"
		},
		"get_sos_number": {
			"desc": "Get sos number",
			"param": false
		},
		"set_sos_status": {
			"desc": "Enable/disable sos",
			"param": "Send 1(default) to enable and 0 to disable"
		},
		"get_sos_status": {
			"desc": "Get sos status",
			"param": false
		},
		"set_dial1": {
			"desc": "Set emergency outgoing dial 1",
			"param": "Set emergency outgoing dial 1"
		},
		"get_dial1": {
			"desc": "Get emergency outgoing dial 1",
			"param": false
		},
		"set_dial2": {
			"desc": "Set emergency outgoing dial 2",
			"param": "Set emergency outgoing dial 2"
		},
		"get_dial2": {
			"desc": "Set emergency outgoing dial 2",
			"param": false
		},
		"set_dial1_status": {
			"desc": "Set emergency outgoing dial 1 status",
			"param": "Set emergency outgoing dial 1 status"
		},
		"get_dial1_status": {
			"desc": "Get emergency outgoing dial 1 status",
			"param": false
		},
		"set_dial2_status": {
			"desc": "Set emergency outgoing dial 2 status",
			"param": "Set emergency outgoing dial 2 status"
		},
		"get_dial2_status": {
			"desc": "Get emergency outgoing dial 2 status",
			"param": false
		},
		"set_incoming_num": {
			"desc": "Set incoming numbers",
			"param": "List of maximum five Incoming phone numbers"
		},
		"get_incoming_num": {
			"desc": "Get incoming numbers",
			"param": false
		},
		"set_incoming_status": {
			"desc": "Set incoming call status",
			"param": "1 to enable, 0 to disable"
		},
		"avl500_set_geofence_alarm": {
			"desc": "Set geofence alarm",
			"param": "Send SetNo,Lat1NS,Lon1EW;...;Lat5NS,Lon5EW. Max set no=20, max latlon in one set=5. User can set Maximum 100 location alerts (Lat, Long) points for geo-fencing feature. Device sends LAD packet to CCN/Server, whenever distance between vehicle and LAP point is less than or equal to Alert Distance."
		},
		"set_geofence_alarm_status": {
			"desc": "Enable/disable geofence alarm",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_alert_distance": {
			"desc": "Set geofence radius",
			"param": "Send geofence radius in km"
		},
		"get_alert_distance": {
			"desc": "Get geofence radius",
			"param": false
		},
		"set_overspeed_alarm": {
			"desc": "Set overspeed alarm",
			"param": "Set speed limit(kmph), interval value(In minutes M0 to M10. Default value M0. In seconds S0 to S59.)"
		},
		"get_overspeed_alarm": {
			"desc": "Get overspeed alarm",
			"param": false
		},
		"set_underspeed_alarm": {
			"desc": "Set underspeed alarm",
			"param": "Set speed limit(kmph), interval value(In minutes M0 to M10. Default value M0. In seconds S0 to S59.)"
		},
		"get_underspeed_alarm": {
			"desc": "Get underspeed alarm",
			"param": false
		},
		"reset_tot_dist": {
			"desc": "Reset total distance travelled",
			"param": false
		},
		"get_tot_dist_status": {
			"desc": "Get total distance travelled status",
			"param": false
		},
		"set_tot_dist_status": {
			"desc": "Set total distance travelled status",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_vehicle_stop_interval": {
			"desc": "Set vehicle stop interval",
			"param": "In minutes M0 and M1. In seconds S0 to S59."
		},
		"get_vehicle_stop_interval": {
			"desc": "Get vehicle stop interval",
			"param": false
		},
		"set_voice_channel": {
			"desc": "Set voice channel",
			"param": "Send HANDSET/SPEAKER"
		},
		"get_voice_channel": {
			"desc": "Get voice channel",
			"param": false
		},
		"set_audio_gain": {
			"desc": "Set audio gain",
			"param": "Send 1 to 15"
		},
		"get_audio_gain": {
			"desc": "Get audio gain",
			"param": false
		},
		"set_key5_message": {
			"desc": "Set key5 message",
			"param": "Send key5 message"
		},
		"get_key5_message": {
			"desc": "Get key5 message",
			"param": false
		},
		"set_key6_message": {
			"desc": "Set key6 message",
			"param": "Send key6 message"
		},
		"get_key6_message": {
			"desc": "Get key6 message",
			"param": false
		},
		"set_key7_message": {
			"desc": "Set key7 message",
			"param": "Send key7 message"
		},
		"get_key7_message": {
			"desc": "Get key7 message",
			"param": false
		},
		"set_key8_message": {
			"desc": "Set key8 message",
			"param": "Send key8 message"
		},
		"get_key8_message": {
			"desc": "Get key8 message",
			"param": false
		},
		"set_key9_message": {
			"desc": "Set key9 message",
			"param": "Send key9 message"
		},
		"get_key9_message": {
			"desc": "Get key9 message",
			"param": false
		},
		"set_key10_message": {
			"desc": "Set key10 message",
			"param": "Send key10 message"
		},
		"get_key10_message": {
			"desc": "Get key10 message",
			"param": false
		},
		"set_internal_battery_alert_threshold": {
			"desc": "Set internal battery alert threshold",
			"param": "Set internal battery alert threshold"
		},
		"get_internal_battery_alert_threshold": {
			"desc": "Get internal battery alert threshold",
			"param": false
		},
		"set_external_battery_alert_threshold": {
			"desc": "Set external battery alert threshold",
			"param": "Set external battery alert threshold"
		},
		"get_external_battery_alert_threshold": {
			"desc": "Get external battery alert threshold",
			"param": false
		},
		"set_aux_port": {
			"desc": "Set aux port",
			"param": "Send RFID,FUELS,TAXIM"
		},
		"set_csq_thereshold": {
			"desc": "Set csq threshold",
			"param": "Set csq threshold"
		},
		"get_csq_thereshold": {
			"desc": "Get csq threshold",
			"param": false
		},
		"set_gps_thereshold": {
			"desc": "Set gps threshold",
			"param": "Set gps threshold"
		},
		"get_gprs_thereshold": {
			"desc": "Get gps threshold",
			"param": false
		},
		"set_harsh_acceleration": {
			"desc": "Set harsh acceleration alert",
			"param": "Send 2 to 30"
		},
		"get_harsh_acceleration": {
			"desc": "Get harsh acceleration",
			"param": false
		},
		"set_sleep_mode_status": {
			"desc": "Set sleed mode status",
			"param": "1 to enable, 0 to disable"
		},
		"get_sleep_mode_status": {
			"desc": "Get sleep mode status",
			"param": false
		},
		"set_digital_output_status": {
			"desc": "Set digital output status",
			"param": "Send x|1 or x|0. x= 1 to 4"
		},
		"get_digital_output_status": {
			"desc": "Get digital output status",
			"param": false
		},
		"get_modem_version": {
			"desc": "Get modem version",
			"param": false
		},
		"reset_modem": {
			"desc": "Reset modem",
			"param": false
		},
		"get_imsi": {
			"desc": "Get imsi",
			"param": false
		},
		"reset_gps": {
			"desc": "Reset gps",
			"param": false
		},
		"reset_hardware": {
			"desc": "Reset hardware",
			"param": false
		},
		"reset_software": {
			"desc": "Reset software",
			"param": false
		},
		"power_off": {
			"desc": "Power off",
			"param": false
		},
		"set_debug_mode": {
			"desc": "Set debug mode",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_dist_with_ignition_status": {
			"desc": "Set distance with ignition status",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_sos_device_status": {
			"desc": "Set sos device status",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_sms_status": {
			"desc": "Set sms status",
			"param": "Send 1 to enable, 0 to disable"
		},
		"set_error_msg_status": {
			"desc": "Set error message status",
			"param": "Send 1 to enable, 0 to disable"
		},
		"modem_at_command": {
			"desc": "Modem AT command",
			"param": "Send modem AT command"
		},
		"set_feedback": {
			"desc": "Set feedback interval",
			"param": "XXXXYYZZ\r\nXXXX:Interval for each message of continues feedback. hex\u3002Unit: Second, 4 characters in all, H_STRING. The max is 0xFFFF seconds\u3002When XXXX=0,the device stops continues feedback. YYZZ:The total time for feedback, 16 advance system. Unit: YY:Hour\u3001ZZ:Minute. 4 characters in all\uFF0CH_STRING\uFF0CThe max is 0xFFFF\uFF0Cie:255 hours 255 minutes. When YYZZ=0, according to the time intervals, continues feedback.\r\nWhen both XXXX and YYZZ are not 0\uFF0Cit figure that feedback according to the time intervals, when it up to the total time, it automaticaly stop to feedback"
		},
		"set_speed_limit": {
			"desc": "Set speed limit",
			"param": "H050L030\r\nSetting the up limit speed is50km\/h,low limit is 30km\/h.When up limit is 000,it figures cancel alarm up limit, and when down limit is 000,it figures cancel alarm down limit. Less 3 digits of the speed, full 0 on left."
		},
		"set_circuit": {
			"desc": "Set circuit control signal",
			"param": "1 to open, 0 to close"
		},
		"set_oil": {
			"desc": "Set oil control signal",
			"param": "1 to open, 0 to close"
		},
		"restart": {
			"desc": "Restart",
			"param": false
		},
		"set_acc_open": {
			"desc": "Set acc open interval",
			"param": "Seconds in hex"
		},
		"set_acc_close": {
			"desc": "Set acc close interval",
			"param": "Seconds in hex"
		},
		"tk103_set_geofence": {
			"desc": "Set geofence",
			"param": "N,D, Minlatitude, Maxlatitude, G, Minlongitude, Maxlongitude\r\nN:\u201D0\u201D or \u201C1\u201D\uFF0C\u201D0\u201D, figures cancel Geo-fence, \u201C1\u201Dfigures sets Geo-fence.\r\nIf for cancelling the Geo-fence, the back data cannot be sent out. D:Standard for latitude, N, north latitude; S: south latitude.\r\nMinlatitude: lower limit for latitude, Format: DDFF.FFF, DD : latitude\u2019s degree (00 ~ 90), FF.FFF:latitude\u2019s cent (00.0000 ~ 59.999) \uFF0C reserve three digit decimal\r\nfraction.\r\nMaxlatitude:upper limit for latitude, Format: DDFF.FFF,DD:\r\nlatitude\u2019s degree (00 ~ 90), FF.FFF:latitude\u2019s cent (00.0000 ~ 59.999) \uFF0C reserve three digit decimal fraction.\r\nG:Standard for longitude, E, east longitude; S: south longitude. W: west longitude\r\nMinlongitude: lower limit for longitude, Format: DDDFF.FFF, DDD: Longitude\u2019s degree (000 ~ 180), FF.FFF: longitude\u2019s cent (00.0000 ~ 59.999), reserve three digit decimal fraction.\r\nMinlongitude:upper limit for longitude, Format: DDDFF.FFF\uFF0C DDD: Longitude\u2019s degree (000 ~ 180), FF.FFF: longitude\u2019s cent (00.0000 ~ 59.999), reserve three\r\ndigit decimal fraction."
		}
	},
	"alerts": {
		"low_battery": {
			"desc": "Low Battery"
		},
		"power_cut": {
			"desc": "Power Cut"
		},
		"geofence": {
			"desc": "Geofence"
		},
		"over_speed": {
			"desc": "Overspeed"
		},
		"sos": {
			"desc": "sos"
		},
		"blind_area_enter": {
			"desc": "Blind Area Enter"
		},
		"blind_area_exit": {
			"desc": "Blind Area Exit"
		},
		"sim_card_change": {
			"desc": "Sim Card Change"
		},
		"halt": {
			"desc": "Halt Alert"
		}
	},
	"devices": [
		{
			"key": "tr02",
			"value": {
				"name": "TR02",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SERVER,666666,1,truckadda.in,3002,0#",
					"location": "WHERE,666666#",
					"url": "URL,666666#"
				}
			}
		},
		{
			"key": "tr06",
			"value": {
				"name": "TR06/GT06",
				"img": "",
				"commands": {
					"location": true,
					"petrol_cut": true,
					"petrol_restore": true,
					"param": true,
					"gprs_param": true,
					"restore_factory": true,
					"reboot": true,
					"activate_vibration_alarm": true,
					"deactivate_vibration_alarm": true,
					"change_apn": true,
					"change_dns": true,
					"gprs_off": true,
					"add_sos_number": true,
					"delete_sos_number": true,
					"set_center_number": true,
					"delete_center_number": true,
					"set_time_interval": true,
					"sensor_alarm_time": true,
					"location_url": true,
					"overspeed_alarm": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": true,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3000,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "DYD,000000#",
					"petrol_restore": "HFYD,000000#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#",
					"deactivate_vibration_alarm": "SENSOR,OFF#",
					"change_apn": "APN,%20#",
					"change_dns": "SERVER,1,%20,0#",
					"gprs_off": "GPRSON,0#",
					"add_sos_number": "SOS,A,%20#",
					"delete_sos_number": "SOS,D,%20#",
					"set_center_number": "CENTER,A,%20#",
					"delete_center_number": "CENTER,D#",
					"set_time_interval": "TIMER,%20#",
					"sensor_alarm_time": "DEFENSE,%20#",
					"location_url": "URL#",
					"overspeed_alarm": "SPEED,%20#"
				}
			}
		},
        {
            "key": "gt300",
            "value": {
                "name": "GT300",
                "img": "",
                "commands": {
                    "location": true,
                    "petrol_cut": true,
                    "petrol_restore": true,
                    "param": true,
                    "gprs_param": true,
                    "restore_factory": true,
                    "reboot": true,
                    "activate_vibration_alarm": true,
                    "deactivate_vibration_alarm": true,
                    "change_apn": true,
                    "change_dns": true,
                    "gprs_off": true,
                    "add_sos_number": true,
                    "delete_sos_number": true,
                    "set_center_number": true,
                    "delete_center_number": true,
                    "set_time_interval": true,
                    "sensor_alarm_time": true,
                    "location_url": true,
                    "overspeed_alarm": true
                },
                "alerts": {
                    "low_battery": true,
                    "power_cut": false,
                    "geofence": true,
                    "over_speed": true,
                    "sos": true,
                    "blind_area_enter": false,
                    "blind_area_exit": false,
                    "sim_card_change": false,
                    "halt": true
                },
                "signal": {
                    "voltage_level": true,
                    "gsm_signal_strength": true,
                    "cell_tower_id": true,
                    "MNC": true,
                    "LAC": true,
                    "ACC": true
                },
                "sms": {
                    "activation": "SERVER,1,truckadda.in,3012,0#",
                    "location": "POSITION#",
                    "petrol_cut": "RELAY,1#",
                    "petrol_restore": "RELAY,0#",
                    "param": "PARAM#",
                    "gprs_param": "GPRSSET#",
                    "restore_factory": "FACTORY#",
                    "reboot": "RESET#",
                    "deactivate_vibration_alarm": "SENSOR,OFF#",
                    "change_apn": "APN,%20#",
                    "change_dns": "SERVER,1,%20,0#",
                    "gprs_off": "GPRSON,0#",
                    "add_sos_number": "SOS,A,%20#",
                    "delete_sos_number": "SOS,D,%20#",
                    "set_center_number": "CENTER,A,%20#",
                    "delete_center_number": "CENTER,D#",
                    "set_time_interval": "TIMER,%20#",
                    "sensor_alarm_time": "DEFENSE,%20#",
                    "location_url": "URL#",
                    "overspeed_alarm": "SPEED,%20#"
                }
            }
        },
		{
			"key": "crx",
			"value": {
				"name": "WeTrack2/CRX",
				"img": "",
				"commands": {
					"location": true,
					"petrol_cut": true,
					"petrol_restore": true,
					"param": true,
					"gprs_param": true,
					"restore_factory": true,
					"reboot": true,
					"activate_vibration_alarm": true,
					"deactivate_vibration_alarm": true,
					"change_apn": true,
					"change_dns": true,
					"gprs_off": true,
					"add_sos_number": true,
					"delete_sos_number": true,
					"set_center_number": true,
					"delete_center_number": true,
					"set_time_interval": true,
					"sensor_alarm_time": true,
					"location_url": true,
					"overspeed_alarm": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false,
					"halt": true
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3001,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "RELAY,1#",
					"petrol_restore": "RELAY,0#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#",
					"deactivate_vibration_alarm": "SENSOR,OFF#",
					"change_apn": "APN,%20#",
					"change_dns": "SERVER,1,%20,0#",
					"gprs_off": "GPRSON,0#",
					"add_sos_number": "SOS,A,%20#",
					"delete_sos_number": "SOS,D,%20#",
					"set_center_number": "CENTER,A,%20#",
					"delete_center_number": "CENTER,D#",
					"set_time_interval": "TIMER,%20#",
					"sensor_alarm_time": "DEFENSE,%20#",
					"location_url": "URL#",
					"overspeed_alarm": "SPEED,%20#"
				}
			}
		},
		{
			"key": "rp01",
			"value": {
				"name": "rp01",
				"img": "",
				"commands": {
					"location": true
				},
				"alerts": {
					"low_battery": false,
					"power_cut": false,
					"geofence": false,
					"over_speed": false,
					"sos": false,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false,
					"halt": true
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "#6666#WZ#truckadda.in#3011#",
					"location": "#6666#GA#,"
				}
			}
		},
		{
			"key": "meitrack",
			"value": {
				"commands": {
					"location": true,
					"t1_set_heartbeat_interval": true,
					"t1_set_time_interval": true,
					"set_heading_change": true,
					"set_track_distance": true,
					"set_parking_scheduled_tracking": true,
					"enable_parking_scheduled_tracking": true,
					"enable_rfid": true,
					"shake_wake_up": true,
					"set_gprs_param": true,
					"t1_change_dns": true,
					"set_standby_server": true,
					"read_authorized_phones": true,
					"add_sos_number": true,
					"add_listen_in_number": true,
					"set_smart_sleep": true,
					"delete_gprs_cache": true,
					"add_geofence": true,
					"delete_geofence": true,
					"t1_overspeed_alarm": true,
					"tow_alarm": true,
					"anti_theft": true,
					"turn_off_indicator": true,
					"set_log_interval": true,
					"set_sms_timezone": true,
					"set_gprs_timezone": true,
					"check_engine_first": true,
					"set_sms_event_char": true,
					"set_gprs_event_flag": true,
					"read_gprs_event_flag": true,
					"set_photo_event_flag": true,
					"read_photo_event_flag": true,
					"set_event_auth": true,
					"output_control": true,
					"notify_tracker_to_send_sms": true,
					"set_gprs_event_transmission_mode": true,
					"gprs_information_display": true,
					"add_temp_sensor_number": true,
					"delete_temp_sensor_number": true,
					"view_temp_sensor_number": true,
					"set_temp_alarm_value": true,
					"read_temp_sensor_param": true,
					"check_temp_sensor_param": true,
					"set_fuel_param": true,
					"read_fuel_param": true,
					"set_fuel_theft_alarm": true,
					"get_pic": true,
					"get_pic_list": true,
					"delete_pic": true,
					"take_pic": true,
					"add_rfid": true,
					"add_rfid_batch": true,
					"check_rfid_auth": true,
					"read_authorized_rfid": true,
					"delete_rfid": true,
					"delete_rfid_batch": true,
					"check_rfid_checksum": true,
					"set_maintenance_mileage": true,
					"set_maintenance_time": true,
					"read_tracker_info": true,
					"restart_gsm": true,
					"restart_gps": true,
					"set_mileage_runtime": true,
					"delete_sms_gprs_cache": true,
					"restore_factory": true
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "0000,A21,1,truckadda.in,3003,,,",
					"timezone":"0000,B35,330",
					"location_url":"0000,A00",
					"location":"0000,A10",
					"disable_sleep":"0000,A73,0",
					"enable_sleep":"0000,A73,1",
					"enable_deep_sleep":"0000,A73,2",
					"status":"0000,B21,status"
				}
			}
		},
		{
			"key": "vt2",
			"value": {
				"name": "Meitrack-vt2",
				"img": "",
				"commands": {
					"location": true,
					"petrol_cut": true,
					"petrol_restore": true,
					"param": true,
					"gprs_param": true,
					"restore_factory": true,
					"reboot": true,
					"change_apn": true,
					"change_dns": true,
					"gprs_off": true,
					"add_sos_number": true,
					"delete_sos_number": true,
					"set_center_number": true,
					"delete_center_number": true,
					"set_time_interval": true,
					"location_url": true,
					"version": true,
					"set_adaptive_timezone": true,
					"get_adaptive_timezone": true,
					"set_timezone": true,
					"get_timezone": true,
					"vt2_set_heartbeat_interval": true,
					"get_heartbeat_interval": true,
					"set_geofence_alarm": true,
					"get_geofence_alarm": true,
					"restore_default_password": true,
					"change_password": true,
					"set_sleep_interval": true,
					"get_sleep_interval": true,
					"set_vibration_alarm": true,
					"get_vibration_alarm": true,
					"set_theft_alarm": true,
					"get_theft_alarm": true,
					"vt2_vibration_alarm": true,
					"get_vibration_params": true,
					"set_arm_disarm": true,
					"set_power_alarm": true,
					"set_battery_alarm": true,
					"set_moving_alarm": true,
					"vt2_overspeed_alarm": true,
					"set_static_drift": true,
					"vt2_set_heading_change": true,
					"get_iccid": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": true,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,0000,1,truckadda.in,3004,0#",
					"location": "WHERE,0000#",
					"petrol_cut": "DYD,0000#",
					"petrol_restore": "HFYD#",
					"param": "PARAM,0000#",
					"gprs_param": "GPRSSET,0000#",
					"restore_factory": "FACTORY,0000#",
					"reboot": "RESET,0000#",
					"deactivate_vibration_alarm": "SENSOR,0000,OFF#",
					"change_apn": "APN,0000,%20#",
					"change_dns": "SERVER,0000,1,%20,0#",
					"gprs_off": "GPRSON,0000,0#",
					"add_sos_number": "SOS,0000,A,%20#",
					"delete_sos_number": "SOS,0000,D,%20#",
					"set_center_number": "CENTER,0000,A,%20#",
					"delete_center_number": "CENTER,0000,D#",
					"set_time_interval": "TIMER,0000,%20#",
					"sensor_alarm_time": "DEFENSE,0000,%20#",
					"location_url": "URL,0000#",
					"overspeed_alarm": "SPEED,0000,%20#"
				}
			}
		},
		{
			"key": "tr06n",
			"value": {
				"name": "TR06N/GT06N",
				"img": "",
				"commands": {
					"location": true,
					"petrol_cut": true,
					"petrol_restore": true,
					"param": true,
					"gprs_param": true,
					"restore_factory": true,
					"reboot": true,
					"activate_vibration_alarm": true,
					"deactivate_vibration_alarm": true,
					"change_apn": true,
					"change_dns": true,
					"gprs_off": true,
					"add_sos_number": true,
					"delete_sos_number": true,
					"set_center_number": true,
					"delete_center_number": true,
					"set_time_interval": true,
					"sensor_alarm_time": true,
					"location_url": true,
					"overspeed_alarm": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": true,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3005,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "DYD,000000#",
					"petrol_restore": "HFYD,000000#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#",
					"deactivate_vibration_alarm": "SENSOR,OFF#",
					"change_apn": "APN,%20#",
					"change_dns": "SERVER,1,%20,0#",
					"gprs_off": "GPRSON,0#",
					"add_sos_number": "SOS,A,%20#",
					"delete_sos_number": "SOS,D,%20#",
					"set_center_number": "CENTER,A,%20#",
					"delete_center_number": "CENTER,D#",
					"set_time_interval": "TIMER,%20#",
					"sensor_alarm_time": "DEFENSE,%20#",
					"location_url": "URL#",
					"overspeed_alarm": "SPEED,%20#"
				}
			}
		},
		{
			"key": "tr06f",
			"value": {
				"name": "TR06F/GT06F",
				"img": "",
				"commands": {
					"location": true,
					"petrol_cut": true,
					"petrol_restore": true,
					"param": true,
					"gprs_param": true,
					"restore_factory": true,
					"reboot": true,
					"activate_vibration_alarm": true,
					"deactivate_vibration_alarm": true,
					"change_apn": true,
					"change_dns": true,
					"gprs_off": true,
					"add_sos_number": true,
					"delete_sos_number": true,
					"set_center_number": true,
					"delete_center_number": true,
					"set_time_interval": true,
					"sensor_alarm_time": true,
					"location_url": true,
					"overspeed_alarm": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": true,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3007,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "DYD,000000#",
					"petrol_restore": "HFYD,000000#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#",
					"deactivate_vibration_alarm": "SENSOR,OFF#",
					"change_apn": "APN,%20#",
					"change_dns": "SERVER,1,%20,0#",
					"gprs_off": "GPRSON,0#",
					"add_sos_number": "SOS,A,%20#",
					"delete_sos_number": "SOS,D,%20#",
					"set_center_number": "CENTER,A,%20#",
					"delete_center_number": "CENTER,D#",
					"set_time_interval": "TIMER,%20#",
					"sensor_alarm_time": "DEFENSE,%20#",
					"location_url": "URL#",
					"overspeed_alarm": "SPEED,%20#"
				}
			}
		},
		{
			"key": "avl500",
			"value": {
				"name": "AVL500/AVL500",
				"img": "",
				"commands": {
					"set_device_id": true,
					"set_ip_addr": true,
					"set_port": true,
					"set_apn": true,
					"set_apun": true,
					"set_appw": true,
					"avl500_set_heartbeat_interval": true,
					"get_heartbeat_interval": true,
					"set_mode_of_com": true,
					"get_mode_of_com": true,
					"set_data_recording_freq": true,
					"set_location_time_list": true,
					"get_location_time_list": true,
					"set_dist_pos_interval": true,
					"get_dist_pos_interval": true,
					"set_periodic_pos_interval": true,
					"set_ppd_ignition": true,
					"get_ppd_ignition": true,
					"set_upload_size": true,
					"get_upload_size": true,
					"get_summary": true,
					"set_center_number": true,
					"get_center_number": true,
					"set_auth_senders": true,
					"get_auth_senders": true,
					"get_imei": true,
					"add_sos_number": true,
					"get_sos_number": true,
					"set_sos_status": true,
					"get_sos_status": true,
					"set_dial1": true,
					"get_dial1": true,
					"set_dial2": true,
					"get_dial2": true,
					"set_dial1_status": true,
					"get_dial1_status": true,
					"set_dial2_status": true,
					"get_dial2_status": true,
					"set_incoming_num": true,
					"get_incoming_num": true,
					"set_incoming_status": true,
					"avl500_set_geofence_alarm": true,
					"get_geofence_alarm": true,
					"set_geofence_alarm_status": true,
					"set_alert_distance": true,
					"get_alert_distance": true,
					"set_overspeed_alarm": true,
					"get_overspeed_alarm": true,
					"set_underspeed_alarm": true,
					"get_underspeed_alarm": true,
					"reset_tot_dist": true,
					"get_tot_dist_status": true,
					"set_tot_dist_status": true,
					"set_vehicle_stop_interval": true,
					"get_vehicle_stop_interval": true,
					"set_voice_channel": true,
					"get_voice_channel": true,
					"set_audio_gain": true,
					"get_audio_gain": true,
					"set_key5_message": true,
					"get_key5_message": true,
					"set_key6_message": true,
					"get_key6_message": true,
					"set_key7_message": true,
					"get_key7_message": true,
					"set_key8_message": true,
					"get_key8_message": true,
					"set_key9_message": true,
					"get_key9_message": true,
					"set_key10_message": true,
					"get_key10_message": true,
					"set_internal_battery_alert_threshold": true,
					"get_internal_battery_alert_threshold": true,
					"set_external_battery_alert_threshold": true,
					"get_external_battery_alert_threshold": true,
					"set_aux_port": true,
					"set_csq_thereshold": true,
					"get_csq_thereshold": true,
					"set_gprs_thereshold": true,
					"get_gprs_thereshold": true,
					"set_harsh_acceleration": true,
					"get_harsh_acceleration": true,
					"set_sleep_mode_status": true,
					"get_sleep_mode_status": true,
					"set_digital_output_status": true,
					"get_digital_output_status": true,
					"version": true,
					"get_modem_version": true,
					"reset_modem": true,
					"get_imsi": true,
					"reset_gps": true,
					"reset_hardware": true,
					"reset_software": true,
					"power_off": true,
					"set_debug_mode": true,
					"set_dist_with_ignition_status": true,
					"set_sos_device_status": true,
					"set_sms_status": true,
					"restore_factory": true,
					"set_error_msg_status": true,
					"modem_at_command": true,
					"location": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": true,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3009,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "DYD,000000#",
					"petrol_restore": "HFYD,000000#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#",
					"deactivate_vibration_alarm": "SENSOR,OFF#",
					"change_apn": "APN,%20#",
					"change_dns": "SERVER,1,%20,0#",
					"gprs_off": "GPRSON,0#",
					"add_sos_number": "SOS,A,%20#",
					"delete_sos_number": "SOS,D,%20#",
					"set_center_number": "CENTER,A,%20#",
					"delete_center_number": "CENTER,D#",
					"set_time_interval": "TIMER,%20#",
					"sensor_alarm_time": "DEFENSE,%20#",
					"location_url": "URL#",
					"overspeed_alarm": "SPEED,%20#"
				}
			}
		},
		{
			"key": "tk103",
			"value": {
				"name": "TK103",
				"img": "",
				"commands": {
					"location": true,
					"set_circuit": true
				},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": false,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "ip 65.1.183.173port3010",
					"location": "position"
				}
			}
		},
		{
			"key": "crxv5",
			"value": {
				"name": "crxv5",
				"img": "",
				"commands": {
					"location": true,
				    "petrol_cut": true,
                    "petrol_restore": true,
				},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": false,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SERVER,1,truckadda.in,3021,0#",
					"location": "DWXX,000000#",
					"petrol_cut": "DYD,000000#",
					"petrol_restore": "HFYD,000000#",
					"param": "PARAM#",
					"gprs_param": "GPRSSET#",
					"restore_factory": "FACTORY#",
					"reboot": "RESET#"
				}
			}
		},
        {
            "key": "ks199",
            "value": {
                "name": "KS199",
                "img": "",
                "commands": {
					"location": true,
					"set_circuit": true
                   },
                "alerts": {
                    "sim_card_change": false
                },
                "signal": {
                    "voltage_level": true,
                    "gsm_signal_strength": true,
                    "cell_tower_id": false,
                    "MNC": true,
                    "LAC": true,
                    "ACC": false
                },
                "sms": {
                    "activation": "ip 65.1.183.173port3013",
                    "location": "position"
                }
            }
        },
		{
			"key": "mt90",
			"value": {
				"commands": {
					"location": true,
					"t1_set_heartbeat_interval": true,
					"t1_set_time_interval": true,
					"set_heading_change": true,
					"set_track_distance": true,
					"set_parking_scheduled_tracking": true,
					"enable_parking_scheduled_tracking": true,
					"enable_rfid": true,
					"shake_wake_up": true,
					"set_gprs_param": true,
					"t1_change_dns": true,
					"set_standby_server": true,
					"read_authorized_phones": true,
					"add_sos_number": true,
					"add_listen_in_number": true,
					"set_smart_sleep": true,
					"delete_gprs_cache": true,
					"add_geofence": true,
					"delete_geofence": true,
					"t1_overspeed_alarm": true,
					"tow_alarm": true,
					"anti_theft": true,
					"turn_off_indicator": true,
					"set_log_interval": true,
					"set_sms_timezone": true,
					"set_gprs_timezone": true,
					"check_engine_first": true,
					"set_sms_event_char": true,
					"set_gprs_event_flag": true,
					"read_gprs_event_flag": true,
					"set_photo_event_flag": true,
					"read_photo_event_flag": true,
					"set_event_auth": true,
					"output_control": true,
					"notify_tracker_to_send_sms": true,
					"set_gprs_event_transmission_mode": true,
					"gprs_information_display": true,
					"add_temp_sensor_number": true,
					"delete_temp_sensor_number": true,
					"view_temp_sensor_number": true,
					"set_temp_alarm_value": true,
					"read_temp_sensor_param": true,
					"check_temp_sensor_param": true,
					"set_fuel_param": true,
					"read_fuel_param": true,
					"set_fuel_theft_alarm": true,
					"get_pic": true,
					"get_pic_list": true,
					"delete_pic": true,
					"take_pic": true,
					"add_rfid": true,
					"add_rfid_batch": true,
					"check_rfid_auth": true,
					"read_authorized_rfid": true,
					"delete_rfid": true,
					"delete_rfid_batch": true,
					"check_rfid_checksum": true,
					"set_maintenance_mileage": true,
					"set_maintenance_time": true,
					"read_tracker_info": true,
					"restart_gsm": true,
					"restart_gps": true,
					"set_mileage_runtime": true,
					"delete_sms_gprs_cache": true,
					"restore_factory": true
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": true
				},
				"sms": {
					"activation": "0000,A21,1,truckadda.in,3003,,,",
					"timezone":"0000,B35,330",
					"location_url":"0000,A00",
					"location":"0000,A10",
					"disable_sleep":"0000,A73,0",
					"enable_sleep":"0000,A73,1",
					"enable_deep_sleep":"0000,A73,2",
					"status":"0000,B21,status"
				}
			}
		},
		{
			"key": "ais140",
			"value": {
				"name": "AIS 140",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SET SIP:65.2.22.132,PPT:3015",
					"location": "NA",
					"url": "NA"
				}
			}
		},
		{
			"key": "atlanta_e101",
			"value": {
				"name": "atlanta_e101",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SET SIP:65.2.22.132,PPT:3027",
					"location": "NA",
					"url": "NA"
				}
			}
		},
		{
			"key": "atlanta_c100",
			"value": {
				"name": "atlanta_c100",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SET SIP:65.2.22.132,PPT:3028",
					"location": "NA",
					"url": "NA"
				}
			}
		},
		{
			"key": "fmb910",
			"value": {
				"name": "fmb910",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SET SIP:65.2.22.132,PPT:3016",
					"location": "NA",
					"url": "NA"
				}
			}
		},
		{
			"key": "atlanta_ais140",
			"value": {
				"name": "atlanta_ais140",
				"img": "",
				"commands": {},
				"alerts": {
					"low_battery": true,
					"power_cut": false,
					"geofence": true,
					"over_speed": true,
					"sos": true,
					"blind_area_enter": false,
					"blind_area_exit": false,
					"sim_card_change": false
				},
				"signal": {
					"voltage_level": true,
					"gsm_signal_strength": true,
					"cell_tower_id": true,
					"MNC": true,
					"LAC": true,
					"ACC": false
				},
				"sms": {
					"activation": "SET SIP:65.2.22.132,PPT:3026",
					"location": "NA",
					"url": "NA"
				}
			}
		},
	],
	"features": {
		"tracksheet": {
			"name": "Track Sheet",
			"type": "table",
			"permissions": ["tracksheet"],
			"available_fields": ["branch", "reg_no", "vehicle_type", "driver_name", "status", "addr", "positioning_time", "location_time", "stoppage_time", "speed", "dist_today", "dist_yesterday", "dist_d_2", "dist_d_3", "dist_d_4", "dist_d_5", "dist_last_week", "remark", "nearest_landmark"],
			"allowed_fields": ["branch", "reg_no", "vehicle_type", "driver_name", "status", "addr", "positioning_time", "location_time", "stoppage_time", "speed", "dist_today", "dist_yesterday", "remark", "nearest_landmark"],
			"shown_fields": ["branch", "reg_no", "vehicle_type", "driver_name", "status", "addr", "positioning_time", "location_time", "stoppage_time", "speed", "dist_today", "dist_yesterday", "remark", "nearest_landmark"],
			"premium_fields": [],
			"pro_fields": []
		},
		"trips": {
			"name": "Trips",
			"type": "table",
			"permissions": ["trips"],
			"allowed_fields": ["user_id", "created_at", "alarms", "consignee", "consignor", "created_by", "destination", "driver", "driver_no", "enabled", "end_time", "est_dist", "etoa", "forworder", "gps_status", "imei", "journey", "last_tracking", "loading", "manager", "remark1", "remark2", "remark3", "source", "start_time", "status", "trip_date", "trip_id", "trip_no", "unloading", "vehicle_no", "cur_location"],
			"shown_fields": ["user_id", "created_at", "alarms", "consignee", "consignor", "created_by", "destination", "driver", "driver_no", "enabled", "end_time", "est_dist", "etoa", "forworder", "gps_status", "imei", "journey", "last_tracking", "loading", "manager", "remark1", "remark2", "remark3", "source", "start_time", "status", "trip_date", "trip_id", "trip_no", "unloading", "vehicle_no", "cur_location"],
			"premium_fields": [],
			"pro_fields": []
		},
		"reports": {
			"name": "Reports",
			"type": "table",
			"permissions": ["report_parking", "report_mileage", "report_overspeed", "report_activity"],
			"allowed_fields": [],
			"shown_fields": [],
			"premium_fields": [],
			"pro_fields": []
		}
	},
	feedtype: {
		live_feed: 'lf',
		live_feedV2:'lf2',
		stop_feed: 'sf',
		alerts: 'a',
		commands: 'c',
		stop_all: 'sa',
		sendToDriver: 'sd',
		heartbeat: 'h',
		server_ip: 'ip',
		update_alarm: 'ua',
		update_trip: 'ut'
	},
	requests: {
		authentication: 'authentication',
		get_device_data: 'get_device_data',
		heartbeat: 'heartbeat',
		usrReg: 'usrReg',
		live_feed: 'live_feed',
		live_feedV2:'live_feedV2',
		stop_feed: 'stop_feed',
		sub_users: 'sub_users',
		register_device: 'register_device',
		device_by_imei: 'device_by_imei',
		update_device: 'update_device',
		associate_device: 'associate_device',
		device_by_uid: 'device_by_uid',
		report_parking: 'report_parking',
		download_report_parking: 'download_report_parking',
		report_mileage: 'report_mileage',
		report_mileage2: 'report_mileage2',
		download_report_mileage: 'download_report_mileage',
		download_report_mileage2: 'download_report_mileage2',
		report_overspeed: 'report_overspeed',
		download_report_overspeed: 'download_report_overspeed',
		download_report_acc: 'download_report_acc',
		commands: 'commands',
		add_geozone: 'add_geozone',
		get_geozone: 'get_geozone',
		remove_geozone: 'remove_geozone',
		update_geozone: 'update_geozone',
		create_alarm: 'create_alarm',
		update_alarm: 'update_alarm',
		remove_alarm: 'remove_alarm',
		get_alarm: 'get_alarm',
		get_notification: 'get_notification',
		user_id_availability: 'user_id_availability',
		playback: 'playback',
		playback_zoom: 'playback_zoom',
		gpsgaadi_by_uid: 'gpsgaadi_by_uid',
		get_devide_types: 'get_devide_types',
		gpsgaadi_by_reg_no: 'gpsgaadi_by_reg_no',
		get_trips: 'get_trips',
		download_report_trip: 'download_report_trip',
		add_vehicle: 'add_vehicle',
		add_imei: 'add_imei',
		share_location: 'share_location',
		get_shared_locaion: 'get_shared_locaion',
		remove_gpsgaadi: 'remove_gpsgaadi',
		get_activation_sms: 'get_activation_sms',
		forgot_password: 'forgot_password',
		change_password: 'change_password',
		update_user: 'update_user',
		remove_sub_user: 'remove_sub_user',
		report_activity: 'report_activity',
		download_report_activity: 'download_report_activity',
		download_report_activity_trip: 'download_report_activity_trip',
		create_trip: 'create_trip',
		update_trip: 'update_trip',
		remove_trip: 'remove_trip',
		register_fcm: 'register_fcm',
		get_device_config: 'get_device_config',
		get_device_info: 'get_device_info',
		gpsgaadi_by_uid_list: 'gpsgaadi_by_uid_list',
		gpsgaadi_by_uid_mongo:'gpsgaadi_by_uid_mongo',
		gpsgaadi_by_uid_map_mongo:'gpsgaadi_by_uid_map_mongo',
		get_notif_prefs: 'get_notif_prefs',
		update_notif_prefs: 'update_notif_prefs',
		update_user_notif: 'update_user_notif',
		get_user_notif: 'get_user_notif',
		download_tracking_sheet: 'download_tracking_sheet',
		download_tracking_sheet_mongo: 'download_tracking_sheet_mongo',
		get_user_mis_pref: 'get_user_mis_pref',
		update_user_mis_pref: 'update_user_mis_pref',
		get_malfunction: 'get_malfunction',
		create_malfunction: 'create_malfunction',
		update_malfunction: 'update_malfunction',
		remove_malfunction: 'remove_malfunction',
		download_report_malfunction: 'download_report_malfunction',
		report_activity_interval: 'report_activity_interval',
		download_report_activity_interval: 'download_report_activity_interval',
		add_landmark: 'add_landmark',
		get_landmark: 'get_landmark',
		update_landmark: 'update_landmark',
		remove_landmark: 'remove_landmark',
		download_notification: 'download_notification',
        download_report_geofence_schedule: 'download_report_geofence_schedule',
        report_geofence_schedule: 'report_geofence_schedule',
		upsert_feature: 'upsert_feature',
		update_feature: 'update_feature',
		get_feature: 'get_feature',
		remove_feature: 'remove_feature',
		daily_uptime: 'daily_uptime',
		last_online: 'last_online',
		get_vehicle_trips: 'get_vehicle_trips',
		report_ac: 'report_ac',
		report_acc: 'report_acc',
		tracksheetData:'tracksheetData',
		gpsgaadi_by_uid_web:'gpsgaadi_by_uid_web',

		remove_alarm_schedule:'remove_alarm_schedule',
		update_alarm_schedule:'update_alarm_schedule',
		create_alarm_schedule:'create_alarm_schedule',
		get_alarm_schedule:'get_alarm_schedule',
        get_device_alerts:'get_device_alerts',
        get_nearest_landmark_for_point:'get_nearest_landmark_for_point',
        get_nearest_geofence_for_point:'get_nearest_geofence_for_point',
        get_nearest_vehicle_for_point:'get_nearest_vehicle_for_point',
        report_activity_slot : 'report_activity_slot',
		report_driver_activity:'report_driver_activity',
		download_report_driver_activity:'download_report_driver_activity',
        driver_day_activity:'driver_day_activity',
		download_driver_day_activity:'download_driver_day_activity',
        vehicle_exceptions:'vehicle_exceptions',
        download_vehicle_exceptions:'download_vehicle_exceptions',
		commands:"commands"

	},
	mapmyindia:{
		r_b_url : 'http://apis.mapmyindia.com/advancedmaps/v1/',
		atlas_url: 'https://atlas.mapmyindia.com',
		r_lic_key: 'fd971ff1ffd1c78b0df1579410f8b31f',
		m_lic_key : 'tinx82hphv85feke26i9itmjckkjdwy6'
	},
	limit:{
		speed:67
	}
};
