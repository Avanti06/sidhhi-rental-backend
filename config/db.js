const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_DB_URL)
    .then(() => {
        console.log(`DB connection Succesfully`)
    }).catch((err) => {
        console.log(err);
    });
}

module.exports = connectDB;