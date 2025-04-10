const Booking = require('../models/Booking');
const moment = require('moment');
const ExcelJS = require('exceljs');
// earnings.controller.js
const PDFDocument = require('pdfkit');

exports.getEarningsReport = async (req, res) => {
    try {
        const { filter = 'monthly' } = req.query;
        let startDate, endDate;

        const now = moment();

        switch (filter) {
            case 'weekly':
                startDate = moment().startOf('week');
                endDate = moment().endOf('week');
                break;
            case 'monthly':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                break;
            case 'yearly':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                break;
            default:
                startDate = moment().startOf('day');
                endDate = moment().endOf('day');
        }

        const bookings = await Booking.find({
            paymentStatus: 'confirmed',
            updatedAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        }).populate('userId vehicleId');

        const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalAmount = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const totalRemaining = bookings.reduce((sum, b) => sum + ((b.totalAmount || 0) - (b.bookingAmount || 0)), 0);

        res.json({
            filter,
            totalEarnings,
            totalAmount,
            totalRemaining,
            totalBookings: bookings.length,
            bookings,
        });

    } catch (err) {
        console.error('Error fetching earnings report:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.downloadEarningsReport = async (req, res) => {
    try {
        const { filter = 'monthly' } = req.query;
        let startDate, endDate;

        switch (filter) {
            case 'weekly':
                startDate = moment().startOf('week');
                endDate = moment().endOf('week');
                break;
            case 'monthly':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                break;
            case 'yearly':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                break;
            default:
                startDate = moment().startOf('day');
                endDate = moment().endOf('day');
        }

        const bookings = await Booking.find({
            paymentStatus: 'confirmed',
            updatedAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        }).populate('userId vehicleId');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Earnings Report');

        worksheet.columns = [
            { header: 'Booking ID', key: 'id', width: 25 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Vehicle', key: 'vehicle', width: 20 },
            { header: 'Start Date', key: 'startDate', width: 15 },
            { header: 'End Date', key: 'endDate', width: 15 },
            { header: 'Booking Amount (Paid)', key: 'bookingAmount', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Remaining Amount', key: 'remainingAmount', width: 20 },
        ];

        bookings.forEach((b) => {
            worksheet.addRow({
                id: b._id,
                customer: b.userId?.name || 'N/A',
                vehicle: b.vehicleId?.name || 'N/A',
                startDate: moment(b.startDate).format('YYYY-MM-DD'),
                endDate: moment(b.endDate).format('YYYY-MM-DD'),
                bookingAmount: b.bookingAmount || 0,
                totalAmount: b.totalAmount || 0,
                remainingAmount: (b.totalAmount || 0) - (b.bookingAmount || 0),
            });
        });

        // Response setup
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=earnings-report-${filter}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Excel export error:", error);
        res.status(500).json({ message: "Failed to generate Excel report" });
    }
};


const generateEarningsData = async (filter) => {
    let startDate, endDate;

    switch (filter) {
        case 'weekly':
            startDate = moment().startOf('week');
            endDate = moment().endOf('week');
            break;
        case 'monthly':
            startDate = moment().startOf('month');
            endDate = moment().endOf('month');
            break;
        case 'yearly':
            startDate = moment().startOf('year');
            endDate = moment().endOf('year');
            break;
        default:
            startDate = moment().startOf('day');
            endDate = moment().endOf('day');
    }

    const bookings = await Booking.find({
        paymentStatus: 'confirmed',
        updatedAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    }).populate('userId vehicleId');

    const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalBookingAmount = bookings.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);
    const totalRemainingAmount = bookings.reduce((sum, b) => sum + ((b.totalAmount || 0) - (b.bookingAmount || 0)), 0);

    return {
        filter,
        totalBookings: bookings.length,
        totalEarnings,
        totalBookingAmount,
        totalRemainingAmount,
        bookings
    };
};

// exports.downloadPdfReport = async (req, res) => {
//     try {
//         const { filter } = req.query;
//         const report = await generateEarningsData(filter);

//         const doc = new PDFDocument({ margin: 50 });
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=Earnings-${filter}.pdf`);
//         doc.pipe(res);

//         // 🏷️ Header Branding
//         doc
//             .fontSize(22)
//             .fillColor('#008cba')
//             .text('SIDHHI TOURS & TRAVELS', { align: 'center' })
//             .moveDown(0.3);

//         doc
//             .fontSize(14)
//             .fillColor('black')
//             .text('Earnings Report', { align: 'center' });

//         doc
//             .moveDown()
//             .fontSize(12)
//             .text(`Filter Type: ${filter.toUpperCase()}`, { align: 'left' })
//             .text(`Generated On: ${moment().format('YYYY-MM-DD HH:mm')}`)
//             .moveDown();

//         // 📊 Summary Box
//         doc
//             .fontSize(12)
//             .fillColor('black')
//             .text(`Total Bookings: ${report.totalBookings}`)
//             .text(`Total Earnings: ₹${report.totalEarnings}`)
//             .text(`Total Booking Amount (Paid): ₹${report.totalBookingAmount}`)
//             .text(`Remaining Amount: ₹${report.totalRemainingAmount}`)
//             .moveDown();

//         // 🧾 Bookings Table Header
//         doc
//             .fontSize(14)
//             .fillColor('#333333')
//             .text('Bookings List:', { underline: true })
//             .moveDown(0.5);

//         // 🧾 Table Columns
//         doc.fontSize(12).fillColor('#000');
//         const tableTop = doc.y;
//         const rowHeight = 20;

//         doc.text('No.', 50, tableTop);
//         doc.text('Customer', 100, tableTop);
//         doc.text('Vehicle', 220, tableTop);
//         doc.text('Amount', 340, tableTop);
//         doc.text('Dates', 420, tableTop);
//         doc.moveDown(0.5);

//         report.bookings.forEach((b, i) => {
//             const y = tableTop + (i + 1) * rowHeight;
//             doc.fillColor('#555').fontSize(11);
//             doc.text(`${i + 1}`, 50, y);
//             doc.text(b.userId?.name || 'N/A', 100, y, { width: 100 });
//             doc.text(b.vehicleId?.name || 'N/A', 220, y, { width: 100 });
//             doc.text(`₹${b.totalAmount || 0}`, 340, y);
//             doc.text(`${moment(b.startDate).format('MM/DD')} - ${moment(b.endDate).format('MM/DD')}`, 420, y);
//         });

//         // ✍ Signature Area
//         doc.addPage().moveDown(10);
//         doc.fontSize(14).text('Authorized Signature:', { align: 'right' });
//         doc.moveDown(2);
//         doc.fontSize(12).text('_______________________', { align: 'right' });
//         doc.text('SIDHHI ADMIN', { align: 'right' });

//         doc.end();

//     } catch (error) {
//         console.error('PDF Generation Error:', error);
//         res.status(500).json({ message: 'Failed to generate PDF report' });
//     }
// };

exports.downloadPdfReport = async (req, res) => {
    try {
        const { filter } = req.query;
        const report = await generateEarningsData(filter);

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Earnings-${filter}.pdf`);
        doc.pipe(res);

        // ✅ Branding Header
        doc
            .fontSize(24)
            .fillColor('#0066cc')
            .font('Helvetica-Bold')
            .text('SIDHHI TOURS & TRAVELS', { align: 'center' });

        doc
            .fontSize(16)
            .fillColor('#333')
            .font('Helvetica')
            .text('Earnings Report', { align: 'center' });

        doc
            .moveDown()
            .fontSize(12)
            .fillColor('black')
            .text(`Filter Type: ${filter.toUpperCase()}`)
            .text(`Generated On: ${moment().format('YYYY-MM-DD HH:mm')}`)
            .moveDown(1.5);

        // 📊 Summary Section
        doc
            .fontSize(12)
            .fillColor('#111')
            .font('Helvetica-Bold')
            .text(`Total Bookings: `, { continued: true })
            .font('Helvetica').text(report.totalBookings);

        doc
            .font('Helvetica-Bold').text(`Total Earnings: `, { continued: true })
            .font('Helvetica').text(`₹${report.totalEarnings}`);

        doc
            .font('Helvetica-Bold').text(`Total Booking Amount (Paid): `, { continued: true })
            .font('Helvetica').text(`₹${report.totalBookingAmount}`);

        doc
            .font('Helvetica-Bold').text(`Remaining Amount: `, { continued: true })
            .font('Helvetica').text(`₹${report.totalRemainingAmount}`)
            .moveDown();

        // 🧾 Bookings Table
        doc
            .moveDown()
            .fontSize(14)
            .fillColor('#444')
            .font('Helvetica-Bold')
            .text('Bookings List:', { underline: true })
            .moveDown(0.5);

        // Table Header
        const tableTop = doc.y;
        const rowHeight = 20;

        const headers = ['No.', 'Customer', 'Vehicle', 'Booking Amt' ,'remaining Amt' , 'total Amt', 'Dates'];
        const positions = [50, 100, 200, 310, 370, 440, 510];

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
        doc.rect(45, tableTop - 5, 520, rowHeight).fill('#333');

        headers.forEach((h, i) => {
            doc
            .fillColor('#ffffff')
            .text(h, positions[i], tableTop, { 
                width: (positions[i + 1] || 570) - positions[i] - 5,
                continued: false,
             });
        });

        // Table Rows
        report.bookings.forEach((b, i) => {
            const y = tableTop + (i + 1) * rowHeight;
            const isEven = i % 2 === 0;

            // Row background
            doc.rect(45, y - 5, 520, rowHeight).fill(isEven ? '#f9f9f9' : '#eaeaea');
            doc.fillColor('#000').fontSize(11).font('Helvetica');

            const bookingAmount = b.bookingAmount || 0;
            const totalAmount = b.totalAmount || 0;
            const remainingAmount = totalAmount - bookingAmount;

            doc.text(`${i + 1}`, positions[0], y);
            doc.text(b.userId?.name || 'N/A', positions[1], y, { width: 100 });
            doc.text(b.vehicleId?.name || 'N/A', positions[2], y, { width: 100 });
            doc.text(`₹${bookingAmount}`, positions[3], y);
            doc.text(`₹${remainingAmount}`, positions[4], y);
            doc.text(`₹${totalAmount}`, positions[5], y);
            doc.text(`${moment(b.startDate).format('MM/DD')} - ${moment(b.endDate).format('MM/DD')}`, 
            positions[6], 
            y,
            {width: 100});
        });

        // ✍ Enhanced Signature Area
        doc.addPage();
        doc.moveDown(8);
        doc.fontSize(14).font('Helvetica-Bold').text('Report Verified By:', { align: 'right' });
        doc.moveDown(2);

        // Signature Line with Title
        doc
            .fontSize(12)
            .font('Helvetica')
            .text('_____________________________', { align: 'right' })
            .text('Siddhi Admin - Authorized Signatory', { align: 'right', fontSize: 11, italic: true });

        // 🔻 Optional Footer
        doc.moveDown(8);
        doc
            .fontSize(10)
            .fillColor('#777')
            .text('This report is generated digitally by Siddhi Tours & Travels', 50, 770, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate PDF report' });
    }
};






 
