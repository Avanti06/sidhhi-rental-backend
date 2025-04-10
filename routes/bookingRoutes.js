const express = require("express");
const { protect , adminOnly} = require("../middlewares/authMiddleware");
const { createBooking, getUpcomingBookings, getMyBookings  } = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", protect, createBooking);
router.get("/admin/upcoming", protect, adminOnly, getUpcomingBookings);
router.get("/my-booking", protect, getMyBookings);
module.exports = router;
