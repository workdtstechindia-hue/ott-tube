const Purchase = require("../models/purchase.model");

const revokeExpiredAccess = async () => {
  const now = new Date();
  const result = await Purchase.updateMany(
    {
      status: "paid",
      accessExpiresAt: { $lte: now },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );

  return result.modifiedCount || 0;
};

const startExpiryCleanupJob = () => {
  const run = async () => {
    try {
      await revokeExpiredAccess();
    } catch (error) {
      console.error("Failed to revoke expired access:", error.message);
    }
  };

  run();
  setInterval(run, 60 * 60 * 1000);
};

module.exports = { revokeExpiredAccess, startExpiryCleanupJob };
