const mongoose = require("mongoose");
require('dotenv').config();

const dbURI = process.env.MONGO_URI || "mongodb+srv://sabdulrehman762_db_user:L3jEMKuI4LBLmL7U@cluster0.clrcj5o.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => { console.log("Db is connected") });
db.on('disconnected', () => { console.log("DB is disconnected") });
db.on('error', (error) => { console.log("Error occurred" + error) });

module.exports = db;