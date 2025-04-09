const razorpay = require("../config/razorpay");
const Booking = require("../models/Booking");
const crypto = require("crypto");


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
              paymentStatus: "confirmed", 
              paymentId: razorpay_payment_id,
              status: "confirmed",
              updatedAt: new Date() 
            },
            { new: true } // Return the updated document
          );

          if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found for this order ID" });
          }

          res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            booking: updatedBooking
          });
        
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Error verifying payment" });
    }
};
