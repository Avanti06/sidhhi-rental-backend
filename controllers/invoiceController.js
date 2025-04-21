const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Booking = require("../models/Booking");

exports.generateInvoice = async (req, res) => {
    const { bookingId } = req.params; // Get bookingId from params

    try {
        const booking = await Booking.findById(bookingId).populate('vehicleId userId'); // Assuming you have vehicleId and userId populated
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Ensure 'invoices' folder exists
        const invoiceDir = path.join(__dirname, 'invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir); // Create folder if it doesn't exist
        }

        // Set PDF file path (can be downloaded after creation)
        const filePath = path.join(invoiceDir,  `invoice_${bookingId}.pdf`);

        // Create PDF document
        const doc = new PDFDocument();
        // Pipe PDF to file system
        doc.pipe(fs.createWriteStream(filePath));

        // Title
        doc.fontSize(18).text('Invoice for Booking', { align: 'center' }).moveDown(2);

        // Booking Details
        doc.fontSize(14).text(`Booking ID: ${booking._id}`);
        doc.text(`Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}`);
        doc.text(`Trip Type: ${booking.tripType}`);
        doc.text(`Vehicle: ${booking.vehicleId.name}`);
        doc.text(`Pickup Location: ${booking.pickupLocation}`);
        doc.text(`Drop Location: ${booking.dropLocation}`);
        doc.text(`Trip Dates: ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`);

        // Payment Details
        doc.moveDown();
        doc.text(`Total Amount: ₹${booking.totalAmount}`);
        doc.text(`Amount Paid: ₹${booking.bookingAmount}`);
        doc.text(`Remaining Amount: ₹${booking.remainingAmount}`);

        // User Details
        doc.moveDown();
        doc.text(`Customer Name: ${booking.userId.name}`);
        doc.text(`Email: ${booking.userId.email}`);
        doc.text(`Phone: ${booking.userId.phone}`);

        // Add some styling and a footer
        doc.moveDown();
        doc.text('Thank you for booking with us!', { align: 'center' });

        // Finalize the PDF and end the document
        doc.end();
        
        console.log("invoice genrated, filepath: ", filePath);
         // Send the relative path for the file
         const relativeFilePath = `/invoices/invoice_${bookingId}.pdf`; 
        // Respond with the file path for downloading
        res.status(200).json({ message: "Invoice generated successfully", filePath: relativeFilePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating invoice", error });
    }
};
