/**
 * Created by bharath on 15/06/17.
 */
const config = require('./config');

config.shouldWriteToDb = true;

const database = config.database;

let cassandraDbInstance;

if (!config.shouldWriteToDb) {
	cassandraDbInstance = {execute: require('sinon').spy()};
} else {
	const cassandraDriver = require('cassandra-driver');
	console.log('connected to cassandra nodes '+database.nodes.toString());
	cassandraDbInstance = new cassandraDriver.Client({
		contactPoints: database.nodes,
		keyspace: database.keyspace
		//localDataCenter: 'ap-southeast_1_cassandra',
	});
}

module.exports = cassandraDbInstance;
