/*
const winston = require('winston');
winston.emitErrs = true;
const logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			handleExceptions: true,
			colorize: true,
			json: false
		}),
		// new (winston.transports.File)({
		//   name: 'info-file',
		//   filename: './logs/info.log',
		//   level: 'info',
		//   json: true
		// }),
		// new (winston.transports.File)({
		//   name: 'error-file',
		//   filename: './logs/error.log',
		//   level: 'error',
		//   json: true
		// })
	],
	exceptionHandlers: [
		// new winston.transports.File({ filename: './logs/exceptions.log' })
	],
	exitOnError: false
});
module.exports = logger;
*/

const winston = require('winston');
 
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
 // defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
	new winston.transports.Console(),
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
module.exports = logger;

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
/*
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
*/
