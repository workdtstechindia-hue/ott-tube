const express = require("express");
const {
  createOrder,
  verifyPayment,
  getOrderStatus,
  handleWebhook,
} = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const router = express.Router();

// webhook endpoint does not require authentication
router.post("/webhook", handleWebhook);

// all other payment APIs are user-protected
router.use(authenticate, authorize("user"));

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/order/:orderId", getOrderStatus);

module.exports = router;
