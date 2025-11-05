// backend/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const Role = require('../models/RoleModel');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Lấy danh sách tất cả các vai trò
// @route   GET /api/roles
// @access  Private (Chỉ user đã đăng nhập mới được lấy)
router.get('/', protect, async (req, res) => {
    try {
        const roles = await Role.find({});
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;