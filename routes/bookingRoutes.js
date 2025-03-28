const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { createBooking, getUserBookings, assignDriver, updateBookingStatus, getBookingById,  } = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", protect, createBooking);


module.exports = router;
