const multer = require("multer");
const path = require("path")
const fs = require("fs");

// Function to create folder if it doesn't exist
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = "uploads/others"; // Default folder

        // Check API path and set directory
        if (req.baseUrl.includes("rental")) {
            uploadDir = "uploads/rentals";
        } else if (req.baseUrl.includes("driver")) {
            uploadDir = "uploads/drivers";
        } else if (req.baseUrl.includes("user")) {
            uploadDir = "uploads/users";
        }

        // Ensure directory exists
        ensureDirExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter: Allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extname && mimeType) {
        return cb(null, true);
    }
    cb(new Error("Only images (JPG, PNG, GIF, WEBP) are allowed"));
};

// Middleware for single image upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter,
}).single("image"); // Expect only one image field named "image"

module.exports =   upload  ;
