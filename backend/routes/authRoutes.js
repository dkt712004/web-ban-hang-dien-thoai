// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Thêm route logout, yêu cầu phải đăng nhập mới logout được
router.post('/logout', protect, logoutUser);

module.exports = router;