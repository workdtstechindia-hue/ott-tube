const env = require("../config/env");

const calculateExpiryDate = (startDate = new Date()) => {
  const expiry = new Date(startDate);
  expiry.setDate(expiry.getDate() + env.rentalDurationDays);
  return expiry;
};

module.exports = { calculateExpiryDate };
