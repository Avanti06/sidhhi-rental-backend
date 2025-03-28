const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

// Dynamic folder selection based on API path
const getFolderName = (req) => {
    if (req.baseUrl.includes("rental")) return "uploads/rentals";
    if (req.baseUrl.includes("driver")) return "uploads/drivers";
    if (req.baseUrl.includes("user")) return "uploads/users";
    return "uploads/others"; // Default folder
};

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: getFolderName(req), // Dynamic folder selection
            format: "png", // Convert all images to PNG
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };
    },
});

// File filter: Allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.mimetype);

    if (extname) {
        return cb(null, true);
    }
    cb(new Error("Only images (JPG, PNG, GIF, WEBP) are allowed"));
};

// Middleware for single image upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter,
}).single("image");

module.exports = upload;
