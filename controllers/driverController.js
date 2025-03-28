const User = require("../models/userModel");

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

// ✅ Update Driver (Only by Driver)
exports.updateDriverByDriver = async (req, res) => {
    try {
        const { name, phoneNo, licenseNumber, vehicleType } = req.body;
        const driverId = req.params.id;

        // Ensure only the driver can update their own profile
        if (req.user.id !== driverId) {
            return res.status(403).json({ message: "Unauthorized to update this profile" });
        }

        let updatedFields = { name, phoneNo, licenseNumber, vehicleType };

        // Update photo if uploaded
        if (req.file) {
            updatedFields.driverPhoto = `uploads/drivers/${req.file.filename}`;
        }

        const updatedDriver = await User.findByIdAndUpdate(driverId, updatedFields, { new: true }).select("-password");
        res.status(200).json({ message: "Driver updated successfully", updatedDriver });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};