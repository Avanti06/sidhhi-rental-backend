const mongoose = require("mongoose");

const RentalSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Vehicle name is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: ["Car", "Van", "Travel"],
            required: [true, "Category is required"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [1, "Price must be greater than 0"],
        },
        location: {
            type: String,
            required: [true, "Location is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            minlength: [10, "Description must be at least 10 characters long"],
            trim: true,
        },
        availability: {
            type: Boolean,
            default: true,
        },
        images: {
            type: String, // Supports multiple image uploads
            default: null
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Rental", RentalSchema);
