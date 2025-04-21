const express = require("express");
const { verifyPayment, createOrder, confirmRemainingPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.post("/confirm-remaining-amount", confirmRemainingPayment)
module.exports = router;
