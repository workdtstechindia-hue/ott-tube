const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

let reconnectTimer = null;
let listenersBound = false;

const scheduleReconnectLog = () => {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (mongoose.connection.readyState !== 1) {
      console.error("[MongoDB] connection is not healthy. Waiting for driver auto-reconnect...");
    }
  }, 5000);
};

const bindConnectionEvents = () => {
  if (listenersBound) {
    return;
  }
  listenersBound = true;

  mongoose.connection.on("connected", () => {
    console.log("[MongoDB] connected");
  });

  mongoose.connection.on("disconnected", () => {
    console.error("[MongoDB] disconnected");
    scheduleReconnectLog();
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] reconnected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("[MongoDB] error:", error.message);
  });
};

const connectDB = async () => {
  bindConnectionEvents();

  const connection = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    autoIndex: env.nodeEnv !== "production",
    dbName: "movieappDB",
  });

  return connection;
};

module.exports = { connectDB };

