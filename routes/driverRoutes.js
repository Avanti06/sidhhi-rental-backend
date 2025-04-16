const express = require('express');
const  { upload } = require("../middlewares/uploadMiddleware");
const { protect, adminOnly , verifyDriver} = require('../middlewares/authMiddleware');
const { getAllDrivers, getDriverById,  deleteDriver, getAssignedBookingForDriver, getDriverProfile, updateDriverProfile, updateDriverStatus, updateTripStatusByDriver } = require('../controllers/driverController');

const router = express.Router();

//get All Drivers
router.get('/drivers', protect, adminOnly, getAllDrivers);

//get Drvier by Id
router.get("/driver/:id", protect,verifyDriver, getDriverById);

router.get("/profile", protect, verifyDriver, getDriverProfile);
// delete driver 
router.delete("/:id", protect, adminOnly, deleteDriver);

router.get("/assignedBooking", protect, verifyDriver , getAssignedBookingForDriver);

router.put("/update-status", protect, verifyDriver, updateDriverStatus);
router.put('/update-trip-status/:id', protect, verifyDriver, updateTripStatusByDriver);
module.exports = router;
