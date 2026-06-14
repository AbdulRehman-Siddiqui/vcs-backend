const mongoose = require("mongoose");
require('dotenv').config();

const mongoURL = process.env.MONGO_URI || 'mongodb://localhost:27017/vcs_db';

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => { console.log("Db is connected") });
db.on('disconnected', () => { console.log("DB is disconnected") });
db.on('error', (error) => { console.log("Error occurred" + error) });

module.exports = db;