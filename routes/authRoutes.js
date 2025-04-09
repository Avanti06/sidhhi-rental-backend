const express = require('express');
const { register, login, registerDriver } = require('../controllers/authcontroller');

const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();


router.post('/register', register);
router.post('/login', login);
//driver registration routes
router.post('/register-driver', upload, registerDriver);

module.exports = router;
