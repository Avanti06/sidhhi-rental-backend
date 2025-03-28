const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User", 
         required: true
        },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Vehicle", 
        required: true 
    },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },

    tripType: { 
        type: String, 
        enum: ["one-way", "round-trip", "drop-only"], 
        required: true 
    },
    pickupLocation: { 
        type: String, 
        required: true 
    },
    dropLocation: { 
        type: String, 
        required: true 
    },
    distance: { 
        type: Number, 
         
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date
    },
    
    totalAmount: { 
        type: Number, 
        required: true 
    },
    bookingAmount: { 
        type: Number, 
        required: true 
    }, // 20% Advance Payment
    remainingAmount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "completed"], 
        default: "pending" 
    },
    paymentStatus: { 
        type: String, 
        enum: ["pending", "confirmed", "completed"], 
        default: "pending" 
    },
    paymentTransactionId: { 
        type: String, 
        default: null 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", BookingSchema);
