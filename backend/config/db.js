const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    autoIndex: true,
    dbName: "movieappDB",
  });

  return connection;
};

module.exports = { connectDB };

