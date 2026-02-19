const Razorpay = require("razorpay");
const env = require("./env");

let razorpayClient;
try {
  razorpayClient = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
  const masked = env.razorpayKeyId
    ? env.razorpayKeyId.replace(/.(?=.{4})/g, "*")
    : "<none>";
  console.log(`[Razorpay] initialized with key id ${masked}`);
} catch (err) {
  console.error("[Razorpay] initialization failed:", err.message || err);
  throw err;
}

module.exports = razorpayClient;
