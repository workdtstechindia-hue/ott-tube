const express = require("express");
const { createOrder, verifyPayment, getOrderStatus } = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(authenticate, authorize("user"));

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/order/:orderId", getOrderStatus);

module.exports = router;
