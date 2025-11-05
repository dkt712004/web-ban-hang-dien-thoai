const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { protectCsrf } = require('../middlewares/csrfMiddleware'); // 1. Import
const {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    exportCategories
} = require('../controllers/categoryController');

// 2. Áp dụng protectCsrf cho route POST
router.route('/')
    .post(protect, isAdmin, protectCsrf, createCategory)
    .get(getCategories);

// Route GET không cần bảo vệ CSRF
router.get('/export', protect, isAdmin, exportCategories);

// 3. Áp dụng protectCsrf cho route PUT và DELETE
router.route('/:id')
    .get(getCategoryById)
    .put(protect, isAdmin, protectCsrf, updateCategory)
    .delete(protect, isAdmin, protectCsrf, deleteCategory);

module.exports = router;