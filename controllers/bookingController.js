const Booking = require("../models/Booking");
const { calculateDistance } = require("../utils/distanceCalculator");
const razorpay = require("../config/razorpay");
const sendEmail = require("../utils/mailer");
const User = require("../models/userModel");

// ✅  Create Booking
exports.createBooking = async (req, res) => {
    console.log("incomming booking data:", req.body );
    // console.log("User Info:", req.user);
    const { vehicleId, tripType, pickupLocation, dropLocation, startDate, endDate, totalAmount, bookingAmount, remainingAmount } = req.body;

//    if (!totalAmount || totalAmount <= 0) {
//         return res.status(400).json({ message: "Invalid total amount" });
//     } 

    try {

        const userId = req.user.id;
        
        //Create Razorpay Order
        // ✅ Create Razorpay Order
        const options = {
            amount: bookingAmount * 100 , // Convert to paise
            currency: "INR",
            payment_capture: 1,
        };

        let order;
        try {
            order = await razorpay.orders.create(options);
        } catch (paymentError) {
            return res.status(500).json({
                 message: "Error creating Razorpay order",
                 error: paymentError 
            });
        }


        const newBooking = new Booking({
            userId,
            vehicleId, 
            tripType, 
            pickupLocation: JSON.stringify(pickupLocation), 
            dropLocation: JSON.stringify(dropLocation),
            startDate, 
            endDate, 
            totalAmount, 
            bookingAmount, 
            remainingAmount,
            orderId: order.id,
            paymentStatus: "pending",
        });

        await newBooking.save();
        res.status(201).json({ 
            message: "Booking created successfully", 
            booking: newBooking,
            razorpayOrder: order 
        });

    } catch (error) {
        res.status(500).json({ 
            message: "Error creating booking", 
            error 
        });
    }
};

// ✅ Admin - Get All Upcoming Bookings
exports.getUpcomingBookings = async (req, res) => {
    try {
        // const currentDate = new Date();

        // Optional: Only fetch upcoming bookings with confirmed/pending status
        const bookings = await Booking.find({
            status: { $in: ["confirmed", "pending"] }
        })
        .populate("userId", "name email")         // Optional: Populate user info
        .populate("vehicleId", "title type")      // Optional: Populate vehicle info                 // Sort by upcoming date

        res.status(200).json({
            message: "Upcoming bookings fetched successfully",
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching upcoming bookings", error });
    }
};

// controllers/bookingController.js

exports.approveBookingByAdmin = async (req, res) => {
    try {
        const bookingId = req.params.id;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "confirmed") {
            return res.status(400).json({ message: "Booking is already confirmed" });
        }

        if (booking.paymentStatus !== "confirmed") {
            return res.status(400).json({ message: "Payment not completed yet" });
        }

        booking.status = "confirmed";
        booking.updatedAt = new Date();

        await booking.save();

        // ✅ Send email to user
        const user = await User.findById(booking.userId);
        if (user?.email) {
            await sendEmail(
                user.email,
                "Booking Approved - Sidhi Rental",
                `<h3>Dear ${user.name || "Customer"},</h3>
                <p>Your booking has been <strong>approved</strong> by the admin.</p>
                <p><strong>Booking ID:</strong> ${booking._id}</p>
                <p>Trip Dates: ${booking.startDate} to ${booking.endDate}</p>
                <p>Our team will connect with you shortly for further details.</p>
                <br>
                <p>Thanks for booking with Sidhi Tour & Travels!</p>`
            );
        }

        res.status(200).json({ 
            message: "Booking approved  successfully and email send", 
            booking 
        });

    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({ message: "Error approving booking", error });
    }
};

exports.rejectBookingByAdmin = async (req, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId).populate("userId");
  
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.status !== "pending") return res.status(400).json({ message: "Booking already processed" });
  
      booking.status = "rejected";
      booking.updatedAt = new Date();
      await booking.save();
  
      // Send rejection email
      const subject = "Booking Rejected ❌";
      const html = `
        <p>Dear ${booking.userId.name},</p>
        <p>We regret to inform you that your booking for <strong>${booking.vehicleId.name}</strong> on <strong>${booking.startDate.toDateString()}</strong> has been <strong style="color:red;">rejected</strong>.</p>
        <p>If you have questions, please contact us.</p>
        <p>Regards,<br/>Sidhi Tour & Travels</p>
      `;
      await sendEmail(booking.userId.email, subject, html);
  
      res.status(200).json({ message: "Booking rejected and email sent", booking });
  
    } catch (error) {
      console.error("Error rejecting booking:", error);
      res.status(500).json({ message: "Error rejecting booking", error });
    }
  };
  
// GET /api/bookings/paid

exports.getPaidBookings = async (req, res) => {
    try {
      const bookings = await Booking.find({ paymentStatus: 'confirmed' })
        .populate('userId', 'name email');
  
      res.status(200).json({
        message: 'Paid bookings fetched successfully',
        bookings
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch paid bookings', error });
    }
  };
  
exports.payRemainingAmount = async (req, res) => {

    const { bookingId } = req.body;
    try {

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Check if booking is completed
        if (booking.status !== "completed") {
            return res.status(400).json({ message: "Trip not completed yet" });
        }

        // Check if there's actually a remaining amount
        if (booking.remainingAmount <= 0) {
            return res.status(400).json({ message: "No remaining amount to pay" });
        }

        // Create Razorpay Order for the remaining amount
        const options = {
            amount: booking.remainingAmount * 100, // Convert to paise
            currency: "INR",
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({ message: "Remaining payment order created", order });
    } catch (error) {
        res.status(500).json({ message: "Error processing remaining payment", error });
    }
};

// ✅ Get Bookings for Logged-In User
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming you have middleware that attaches user to req.user

        const bookings = await Booking.find({ userId })
            .populate("vehicleId", "name category")
            .sort({ startDate: -1 }); // optional: recent first

        res.status(200).json({
            message: "Your bookings fetched successfully",
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching your bookings", error });
    }
};

exports.getAllAssignedBookings = async (req, res) => {
    try {
      const bookings = await Booking.find({ 
        assignedDriver : { $ne: null }
        }) // only assigned bookings
        .populate('vehicleId', 'name')
        .populate('userId', 'name phone email')
        .populate('assignedDriver', 'name phone');
  
      res.status(200).json(bookings);
    } catch (error) {
      console.error('Error fetching assigned bookings:', error);
      res.status(500).json({ message: 'Failed to fetch assigned bookings' });
    }
  };
