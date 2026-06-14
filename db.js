const mongoose = require('mongoose');

// Define the variable using Render's environment variable, with your Atlas string as a backup
const mongoURL = process.env.MONGO_URI || "mongodb+srv://sabdulrehman762_db_user:L3jEMKuI4LBLmL7U@cluster0.clrcj5o.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURL);

// ... keep the rest of your connection logic (db.on('connected', etc.)) below this

db.on('connected', () => { console.log("Db is connected") });
db.on('disconnected', () => { console.log("DB is disconnected") });
db.on('error', (error) => { console.log("Error occurred" + error) });

module.exports = db;