require("dotenv").config();

const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const { startExpiryCleanupJob } = require("./utils/cleanupExpiredAccess");
const { startUploadSessionCleanupJob } = require("./services/uploadSessionCleanup.service");

let server;
let dbConnection;
let isShuttingDown = false;

const shutdown = async (signal, error) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  if (error) {
    console.error(`[${signal}]`, error);
  }

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (dbConnection) {
      await dbConnection.disconnect();
    }
  } finally {
    process.exit(error ? 1 : 0);
  }
};

process.on("unhandledRejection", (reason) => {
  shutdown("unhandledRejection", reason);
});

process.on("uncaughtException", (error) => {
  shutdown("uncaughtException", error);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

const startServer = async () => {
  try {
    dbConnection = await connectDB();
    console.log(`MongoDB connected to database: ${dbConnection.connection.name}`);

    server = http.createServer(app);
    server.requestTimeout = env.requestTimeoutMs;
    server.keepAliveTimeout = env.keepAliveTimeoutMs;
    server.headersTimeout = env.headersTimeoutMs;

    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    server.on("error", (error) => {
      shutdown("serverError", error);
    });

    startExpiryCleanupJob();
    startUploadSessionCleanupJob();
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
