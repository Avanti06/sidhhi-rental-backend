const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();


exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phoneNo } = req.body;

        // Validate required fields
    if (!name || !email || !password || !phoneNo) {
        return res.status(400).json({ message: "All fields are required." });
      }

       // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create User
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phoneNo,
            role:"user",
            isApproved: true,
        });

        await user.save();
        res.status(201).json({ message: "User registered.", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid email or password" });

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

      // Check provider approval
      if (user.role === "provider" && !user.isApproved) {
          return res.status(403).json({ message: "Your account is pending approval by admin" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

      res.status(200).json({
          message: "Login successful",
          token,
          user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              isApproved: user.isApproved
          }
      });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

//Register  a new Driver by Admin only
exports.registerDriver = async (req, res) => {
    try {
        const { name, email, password, phoneNo, licenseNumber, vehicleType} = req.body;

        //Check if driver alredy exists
        const existingDriver = await User.findOne({ email });
        if (existingDriver) {
          return res.status(400).json({ message: "Driver already exists" });
        }

         // Validate required fields
         if (!licenseNumber || !vehicleType) {
            return res.status(400).json({ message: "License number and vehicle type are required for drivers" });
        }

         // Hash password
         const hashedPassword = await bcrypt.hash(password, 10);
       // Debug Multer File Upload
         console.log("Uploaded File:", req.file);

          // Set driver photo path if file is uploaded
        let image = req.file ? req.file.path || req.file.secure_url: null;
        if (!image) {
        
            return res.status(400).json({ message: "Cloudinary upload failed" });
        }

         // Create new driver
    const driver = await User.create({
        name,
        email,
        password: hashedPassword,
        phoneNo,
        role: "driver",
        licenseNumber,
        vehicleType,
        availabilityStatus: 'active',
        driverPhoto: image,
        isApproved: true, // Admin must approve
        assignedTrips: [],
        earings: 0
      });
      
      await driver.save();
      res.status(201).json({ message: "Driver registered successfully.", driver });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }


};