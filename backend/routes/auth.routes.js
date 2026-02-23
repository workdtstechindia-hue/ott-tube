const express = require("express");
const { register, login, adminLogin, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { validateRegisterBody, validateLoginBody } = require("../validators/auth.validators");

const router = express.Router();

router.post("/register", validateRegisterBody, register);
router.post("/login", validateLoginBody, login);
router.post("/admin/login", validateLoginBody, adminLogin);
router.get("/me", authenticate, getMe);

module.exports = router;
