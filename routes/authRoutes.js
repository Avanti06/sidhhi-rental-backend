const express = require('express');
const {  login, registerDriver, registerUser } = require('../controllers/authcontroller');

const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();


router.post('/register-user', registerUser);
router.post('/login', login);
//driver registration routes
router.post('/register-driver', upload, registerDriver);

module.exports = router;
