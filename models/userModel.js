const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        require: [true,"name is required"],
        minlength: [3, "name must be at least 3 charachter long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        require: [true, "Email is reqiured"],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
        type: String,
        require: [true , "password is reqiured"],
        minlength: [6, "password must be at least 6 charachter"]
    },
    phoneNo: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
    },
    role : {
        type: String,
        enum: ['admin', 'user', 'provider', 'driver'],
        default: 'user',
    },
    //provider 
    company_name: {
        type: String,
        default: null,
        required: function () { return this.role === 'provider'; }
    },
    company_logo: {
         type: String, 
         default: null 
    },
    gst_number: {
        type: String,
        default: null,
        required: function () { return this.role === 'provider'; }
    },
    // Driver-Specific Fields
    licenseNumber: {
        type: String,
        default: null,
        required: function () {
          return this.role === "driver";
        },
      },
      vehicleType: {
        type: String,
        default: null,
        required: function () {
          return this.role === "driver";
        },
      },
      availabilityStatus: {
        type: String,
        enum: ["active", "busy", "offline"],
        default: "active",
      },
      assignedTrips: [
        {
          bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
          status: {
            type: String,
            enum: ["pending", "accepted", "in-progress", "completed", "cancelled"],
            default: "pending",
          },
        },
      ],
      earnings: { type: Number, default: 0 },
     
      driverPhoto: { 
        type: String, 
        default: null 
      },
      
    isApproved: { 
       type: Boolean,
       default: function () {
        // user are approvide by default but provider is not
        return this.role === 'user' || this.role === 'driver';
       },
    },
}, {timestamps: true});


module.exports = mongoose.model('User', UserSchema);