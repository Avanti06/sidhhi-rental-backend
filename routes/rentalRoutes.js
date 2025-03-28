const express = require("express");
const { protect , adminOnly} = require("../middlewares/authMiddleware");
const   upload  = require("../middlewares/uploadMiddleware");
const {
    addRental,
    updateRental,
    deleteRental,
    getRentals,
    getEarnings,
    getAllRentalsForCustomers,
    getRentalById,
} = require("../controllers/rentalController");

const router = express.Router();

router.post("/rentalAdd", protect, adminOnly, upload, addRental);
router.put("/rental/:rentalId", protect, adminOnly, upload , updateRental);
router.delete("/rental/:rentalId", protect,adminOnly, deleteRental);
router.get("/rentals", protect, getRentals);
router.get("/rental/:rentalId", protect, adminOnly, getRentalById);
router.get("/getAllRentals",getAllRentalsForCustomers );
router.get("/earnings", protect, getEarnings);

module.exports = router;