const express = require("express");
const { register, login, adminLogin, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", authenticate, getMe);

module.exports = router;
