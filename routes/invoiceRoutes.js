const express = require('express');
const router = express.Router();
const { generateInvoice } = require('../controllers/invoiceController');

// Route: GET /api/invoices/:bookingId
router.get('/:bookingId', generateInvoice);

module.exports = router;