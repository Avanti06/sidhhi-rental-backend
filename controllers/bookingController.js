const Booking = require("../models/Booking");
const { calculateDistance } = require("../utils/distanceCalculator");
const razorpay = require("../config/razorpay");


// ✅  Create Booking
exports.createBooking = async (req, res) => {

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
            return res.status(500).json({ message: "Error creating Razorpay order", error: paymentError });
        }


        const newBooking = new Booking({
            userId, vehicleId, tripType, 
            pickupLocation: JSON.stringify(pickupLocation), 
            dropLocation: JSON.stringify(dropLocation),
            startDate, endDate, totalAmount, bookingAmount, remainingAmount,
            paymentTransactionId: order.id,paymentStatus: "pending",
        });

        await newBooking.save();
        res.status(201).json({ message: "Booking created successfully", booking: newBooking });

    } catch (error) {
        res.status(500).json({ message: "Error creating booking", error });
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



exports.payRemainingAmount = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Check if booking is completed
        if (booking.status !== "completed") {
            return res.status(400).json({ message: "Trip not completed yet" });
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



