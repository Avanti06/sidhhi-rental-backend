const razorpay = require("../config/razorpay");
const Booking = require("../models/Booking");
const crypto = require("crypto");
const sendEmail = require('../utils/mailer');
const User = require('../models/userModel');
// ✅ 1. Create a Payment Order
exports.createOrder = async (req, res) => {
    const { amount, currency, bookingId } = req.body;

    try {
        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `booking_${bookingId}`
        };

        const order = await razorpay.orders.create(options);
        // ✅ Save orderId to the Booking entry
       await Booking.findByIdAndUpdate(bookingId, {
    orderId: order.id
});
        res.status(200).json(order);

    } catch (error) {
        res.status(500).json({ message: "Error creating payment order", error });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Check if all required parameters are present
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const secret = process.env.KEY_SECRET; // Ensure this is defined in your .env file

        // Generate HMAC SHA256 signature
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");
        
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid signature, verification failed" });
        } 
          
        //updated booking status in database
        const updatedBooking = await Booking.findOneAndUpdate(
            { orderId: razorpay_order_id }, // Find booking by orderId
            { 
              paymentId: razorpay_payment_id,
              paymentStatus: "confirmed", 
              updatedAt: new Date() 
            },
            { new: true } // Return the updated document
          );

          if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found for this order ID" });
          }


          // ✅ Send confirmation email
    const user = await User.findById(updatedBooking.userId);
    if (user?.email) {
      await sendEmail(
        user.email,
        "Payment Successful - Sidhi Rental",
        `<h3>Dear ${user.name || "Customer"},</h3>
        <p>Your payment was <strong>successful</strong> and your booking is now <strong>confirmed</strong>.</p>
        <p><strong>Booking ID:</strong> ${updatedBooking._id}</p>
        <p>Trip Dates: ${updatedBooking.startDate} to ${updatedBooking.endDate}</p>
        <p>We will notify you once the admin approves your booking.</p>
        <br>
        <p>Thanks for choosing Sidhi Tour & Travels!</p>`
      );
    }
          res.status(200).json({
            success: true,
            message: "Payment verified  and email sent successfully",
            booking: updatedBooking
          });
        
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Error verifying payment" });
    }
};

exports.confirmRemainingPayment = async (req, res) => {
  const { bookingId, paymentId } = req.body;

  try {
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      booking.remainingAmount = 0;
      booking.paymentStatus = "completed";
      booking.paymentId = paymentId;

      await booking.save();

      res.status(200).json({ message: "Payment confirmed", booking });
  } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment", error });
  }
};
