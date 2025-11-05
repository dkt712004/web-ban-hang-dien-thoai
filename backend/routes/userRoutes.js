const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUsers,
    getUserById,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUser,
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { protectCsrf } = require('../middlewares/csrfMiddleware'); // 1. Import

// 2. Áp dụng protectCsrf cho các route thay đổi thông tin cá nhân
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, protectCsrf, updateUserProfile);
router.put('/change-password', protect, protectCsrf, changePassword);

// 3. Áp dụng protectCsrf cho các route quản lý của Admin
router.route('/')
    .get(protect, isAdmin, getUsers)
    .post(protect, isAdmin, protectCsrf, createUserByAdmin);

router.route('/:id')
    .get(protect, isAdmin, getUserById)
    .put(protect, isAdmin, protectCsrf, updateUserByAdmin)
    .delete(protect, isAdmin, protectCsrf, deleteUser);

module.exports = router;