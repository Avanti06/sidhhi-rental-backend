const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes (Only logged-in users)
exports.protect = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password"); // Exclude password
        if (!req.user) return res.status(404).json({ message: "User not found" });

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Middleware for Admin Access
exports.adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

exports.providerOnly = (req, res, next) => {
    if (req.user.role !== "provider") return res.status(403).json({ message: "Provider access only" });
    next();
};

// ✅ Middleware to Verify Driver Role
exports.verifyDriver = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== "driver") {
            return res.status(403).json({ message: "Driver access required" });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};