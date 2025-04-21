const express = require("express");
const { protect , adminOnly, verifyDriver} = require("../middlewares/authMiddleware");
const { createBooking, getUpcomingBookings, getMyBookings, approveBookingByAdmin, rejectBookingByAdmin, getPaidBookings, getAllAssignedBookings, updateTripStatusByDriver, payRemainingAmount  } = require("../controllers/bookingController");
const { getEarningsReport, downloadEarningsReport, downloadPdfReport} = require("../controllers/report.controller");

const router = express.Router();

router.post("/create", protect, createBooking);
router.get("/admin/upcoming", protect, adminOnly, getUpcomingBookings);
router.get("/my-booking", protect, getMyBookings);
router.put("/approve/:id", protect, adminOnly,  approveBookingByAdmin);
router.put("/reject/:id", protect,adminOnly, rejectBookingByAdmin);
router.get("/getAllPaidBooking", protect, adminOnly, getPaidBookings);
router.post("/pay-remaining-amount", payRemainingAmount);
//earing report route
router.get('/earnings-report', protect, adminOnly,getEarningsReport);
router.get('/earnings-report/download', protect, adminOnly, downloadEarningsReport);
router.get('/earnings-report/pdf-download', protect, adminOnly, downloadPdfReport);

router.get('/assigned/all', protect, adminOnly, getAllAssignedBookings);
module.exports = router;
