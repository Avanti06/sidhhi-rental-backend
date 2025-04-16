const User = require('../models/userModel');
const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');



// Fetch all pending providers (not approved yet)
exports.getPendingProviders = async (req, res) => {
    try {
        const pendingProviders = await User.find({ role: "provider", isApproved: false });

        if (!pendingProviders.length) {
            return res.status(200).json({ message: "No pending providers", data: [] });
        }

        res.status(200).json(pendingProviders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.approveProvider = async (req, res) => {
    try {
        const { providerId } = req.params;

        // Find provider and update approval status
        const provider = await User.findById(providerId);
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        if (provider.role !== "provider") {
            return res.status(400).json({ message: "Only providers can be approved" });
        }

        provider.isApproved = true;
        await provider.save();

        res.status(200).json({ message: "Provider approved successfully", provider });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rejectProvider = async (req, res) => {
    try {
        const { providerId } = req.body;

        const provider = await User.findById(providerId);
        if (!provider || provider.role !== "provider") {
            return res.status(404).json({ message: "Provider not found" });
        }

        await User.findByIdAndDelete(providerId);

        res.status(200).json({ message: "Provider rejected and removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error while rejecting provider" });
    }
};

exports.assignDriverToBooking = async (req, res) => {
    const { bookingId } = req.params;
    const { driverId } = req.body;
  
    try {
      const driver = await User.findOne({ _id: driverId, role: 'driver' });
      if (!driver)  {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // 2. Check driver availability
    if (driver.availabilityStatus !== 'active') {
        return res.status(400).json({ message: 'Driver is currently not available' });
      }

      // 3. Assign driver to booking
      const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.assignedDriver) {
            return res.status(400).json({ message: 'Booking already has an assigned driver' });
          }

        // Update booking
        booking.assignedDriver = driverId;
        booking.status = 'assignedDriver';
       

        driver.assignedTrips.push({
        bookingId: booking._id,
        status: 'accepted',
        assignedAt: new Date()
    });


    await booking.save();
    await driver.save();

    
  
    const populatedBooking = await Booking.findById(bookingId).populate('assignedDriver').populate('userId');
    try {
        await sendAssignmentEmails(populatedBooking.userId, driver, populatedBooking);
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr.message);
  
        // You can optionally revert the driver & booking status here
        // OR mark it in DB that emails failed, for retry later
  
        return res.status(200).json({
          message: 'Driver assigned successfully, but email sending failed',
          booking,
          emailError: emailErr.message
        });
      }

      res.status(200).json({ message: 'Driver assigned successfully', booking });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  // ✅ Reusable Email Sender
async function sendAssignmentEmails(customer, driver, booking) {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("EMAIL_USER or EMAIL_PASS is not set in environment variables");
      }

    // 1. Configure transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or use SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use app password, not real one
      },
    });


    // 2. Email to Customer
  const customerMailOptions = {
    from: `"Sidhi Rental" <${process.env.EMAIL_USER}> `,
    to: customer.email,
    subject: 'Driver Assigned for Your Booking',
    html: `
      <h3>Dear ${customer.name},</h3>
      <p>Your booking from <strong>${booking.pickupLocation}</strong> to <strong>${booking.dropLocation}</strong> has been assigned a driver.</p>
      <p><strong>Driver Name:</strong> ${driver.name}</p>
      <p><strong>Contact:</strong> ${driver.email} | ${driver.phoneNo}</p>
      <p><strong>Trip Date:</strong> ${new Date(booking.startDate).toDateString()}</p>
      <br>
      <p>Thank you for choosing Sidhi Tour and Travel!</p>
    `
  };

   // 3. Email to Driver
  const driverMailOptions = {
    from: `"Sidhi Tour and Travel" <${process.env.EMAIL_USER}>`,
    to: driver.email,
    subject: 'New Trip Assigned to You',
    html: `
      <h3>Hello ${driver.name},</h3>
      <p>You have been assigned a new booking.</p>
      <p><strong>Customer:</strong> ${customer.name}</p>
      <p>>strong>Customer Phone no:</strong> ${customer.phoneNo}</p>
      <p><strong>Pickup:</strong> ${booking.pickupLocation}</p>
      <p><strong>Drop:</strong> ${booking.dropLocation}</p>
      <p><strong>Trip Type:</strong> ${booking.tripType}</p>
      <p><strong>Start Date:</strong> ${new Date(booking.startDate).toDateString()}</p>
      <br>
      <p>Please be prepared and contact the customer if needed.</p>
    `
  };

  // 4. Send both emails
  await transporter.sendMail(customerMailOptions);
  await transporter.sendMail(driverMailOptions);
}
