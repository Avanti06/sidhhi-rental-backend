const express = require('express');
const  { upload } = require("../middlewares/uploadMiddleware");
const { protect, adminOnly , verifyDriver} = require('../middlewares/authMiddleware');
const { getAllDrivers, getDriverById, updateDriverByDriver, deleteDriver } = require('../controllers/driverController');

const router = express.Router();

//get All Drivers
router.get('/drivers', protect, adminOnly, getAllDrivers);

//get Drvier by Id
router.get("/driver/:id", protect,verifyDriver, getDriverById);

// delete driver 
router.delete("/:id", protect, adminOnly, deleteDriver);
// ✅ Update Driver (Only by Driver)
// router.put("/driver/:id", protect, verifyDriver, upload, updateDriverByDriver);

module.exports = router;