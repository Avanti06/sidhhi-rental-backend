const User = require("../models/userModel");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");

// ✅ Get All Drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: "driver" }).select("-password");
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if driver exists
        const driver = await  User.findById(id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Delete the driver
        await User.findByIdAndDelete(id);

        res.json({ message: "Driver deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Get Driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await User.findOne({ _id: req.params.id, role: "driver" }).select("-password");
        if (!driver) return res.status(404).json({ message: "Driver not found" });
        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/driver/profile
exports.getDriverProfile = async (req, res) => {
    try {
      const driver = await User.findOne({ _id: req.user.id, role: "driver" }).select("-password");
      if (!driver) return res.status(404).json({ message: "Driver not found" });
      res.status(200).json(driver);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.updateDriverStatus = async (req, res) => {
    try {
      const driverId = req.user.id; // coming from verifyToken middleware
  
      const { availabilityStatus } = req.body;
  
      const validStatuses = ["active", "busy", "offline"];
    if (!validStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }
  
      // Find the driver
      const driver = await User.findOne({ _id: driverId, role: "driver" });
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
  
      // Update fields if provided
      if (availabilityStatus) driver.availabilityStatus = availabilityStatus;
  
      driver.availabilityStatus = availabilityStatus;
      await driver.save();
  
      res.status(200).json({
        message: "Availability status updated successfully",
        status: driver.availabilityStatus,
      });
    } catch (error) {
        res.status(500).json({ message: error.message});
    }
};

// ✅ Get All Drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: "driver" }).select("-password");
        res.status(200).json({ message: "Drivers fetched successfully", data: drivers });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch drivers", error: error.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if driver exists
        const driver = await User.findById(id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Delete the driver
        await User.findByIdAndDelete(id);

        res.json({ message: "Driver deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ✅ Get Driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await User.findOne({ _id: req.params.id, role: "driver" }).select("-password");
        if (!driver) return res.status(404).json({ message: "Driver not found" });
        res.status(200).json({ message: "Driver fetched successfully", data: driver });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch driver", error: error.message });
    }
};



// ✅ Get bookings assigned to the logged-in driver
exports.getAssignedBookingForDriver = async (req, res) => {
    try {
        const driverId = req.user.id;

        const bookings = await Booking.find({ assignedDriver: new mongoose.Types.ObjectId(driverId) })
            .populate('userId', 'name email')
            .populate('vehicleId', 'name type')
            .sort({ date: -1 });

        // console.log("Assigned booking: ", bookings);

        res.status(200).json({ message: "Bookings fetched successfully", data: bookings });
    } catch (error) {
        console.error('Error fetching driver bookings:', error.message);
        res.status(500).json({ message: 'Failed to fetch assigned bookings', error: error.message });
    }
};


exports.updateTripStatusByDriver = async ( req, res) => {
    const { tripStatus } = req.body;

    const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.tripStatus = tripStatus;

  // Auto set driver availability
  if (tripStatus === 'ongoing') {
    await User.updateOne({ _id: booking.assignedDriver }, { availabilityStatus: 'busy' });
  }
  if (tripStatus === 'completed') {
    booking.status = 'completed';
    await User.updateOne({ _id: booking.assignedDriver }, { availabilityStatus: 'active' });
  }

  await booking.save();
  res.json({ message: 'Trip status updated' });
}

  
  