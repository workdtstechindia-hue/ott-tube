require("dotenv").config();

const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const { seedAdminUser } = require("./services/admin.service");
const { startExpiryCleanupJob } = require("./utils/cleanupExpiredAccess");

const startServer = async () => {
  try {
    const connection = await connectDB();
    console.log(`MongoDB connected to database: ${connection.connection.name}`);

    await seedAdminUser();

    const server = http.createServer(app);

    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    startExpiryCleanupJob();

    process.on("SIGTERM", async () => {
      await connection.disconnect();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
