const express = require('express');
const dotenv = require('dotenv');
const connectDB = require("./config/db");
const cors = require("cors");
const path = require('path');

dotenv.config();
connectDB();

//middleware
const app = express();
app.use(express.json());

const allowedOrigins = [
    "http://localhost:4200",
    "https://sidhhi-rental.vercel.app",  // Or specify your frontend URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
}));

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/rental', require('./routes/rentalRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/driver', require("./routes/driverRoutes"));
//create server
app.get('/', (req, res) => {
    res.send('Backend is running on Vercel')
})


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000 ;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;