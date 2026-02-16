const Razorpay = require("razorpay");
const env = require("./env");

const razorpayClient = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

module.exports = razorpayClient;
