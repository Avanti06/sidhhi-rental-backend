const Rental = require("../models/Rental");
const path = require("path");
//add rental vehicals
exports.addRental = async (req, res) => {
    try {
        const { name, category, price, location ,description} = req.body;
        ;
        
        if (!name || !category || !price || !location || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

            // Store image path if file is uploaded
        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        const rental = new Rental({
            admin: req.user._id,
            name,
            category,
            price,
            location,
            description,
            images: imageUrl,
        });

        await rental.save();
        res.status(201).json({ message: "Rental added successfully", rental });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//update rental vehicals
exports.updateRental = async (req, res) => {
    try {
        const { rentalId } = req.params; // Ensure it's correctly mapped
        const updates = req.body;

        // Set driver photo path if file is uploaded
        let imageUrl = null;
        if (req.file) {
             imageUrl = req.file.path;
        }

        const rental = await Rental.findOneAndUpdate(
            { _id: rentalId, admin: req.user._id }, // Verify admin ownership
            { ...updates, images: imageUrl || updates.images },
            { new: true } // Return updated rental
        );

        if (!rental) {
            return res.status(404).json({ message: "Rental not found or unauthorized" });
        }

        res.status(200).json({ message: "Rental updated successfully", rental });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Rental
exports.deleteRental = async (req, res) => {
    try {
        const {rentalId} = req.params;

        const rental = await Rental.findOneAndDelete({
            _id: rentalId,
            admin: req.user._id, // Ensure only the admin can delete
        });

        if (!rental) {
            return res.status(404).json({ message: "Rental not found or unauthorized" });
        }

        res.status(200).json({ message: "Rental deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRentalById = async (req, res) => {
    try {
        const { rentalId } = req.params;

        const rental = await Rental.findById(rentalId);
        if (!rental) {
            return res.status(404).json({ message: "Rental not found" });
        }

        res.status(200).json(rental);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//get all rental for admin
exports.getRentals = async (req, res) => {
    try {
        const rentals = await Rental.find({ admin: req.user._id });
        res.status(200).json(rentals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllRentalsForCustomers = async (req, res) => {
    try {
        // Fetch all rentals (visible to customers)
        const rentals = await Rental.find();

        if (!rentals.length) {
            return res.status(404).json({ message: "No rentals available." });
        }

        res.status(200).json(rentals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//get earning api
const Booking = require("../models/Booking");

exports.getEarnings = async (req, res) => {
    try {
        const earnings = await Booking.aggregate([
            { $match: { admin: req.user._id, status: "completed" } },
            { $group: { _id: null, totalEarnings: { $sum: "$amount" } } },
        ]);

        res.status(200).json({ totalEarnings: earnings[0]?.totalEarnings || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




