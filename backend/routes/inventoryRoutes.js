const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getTransactions,
    reviewTransaction,
} = require('../controllers/inventoryController');
const { protect, isAdmin, isWarehouseManager } = require('../middlewares/authMiddleware');
const { protectCsrf } = require('../middlewares/csrfMiddleware'); // 1. Import

// 2. Áp dụng protectCsrf cho route tạo giao dịch mới
router.route('/')
    .post(protect, isWarehouseManager, protectCsrf, createTransaction)
    .get(protect, isWarehouseManager, getTransactions);

// 3. Áp dụng protectCsrf cho route duyệt giao dịch của Admin
router.route('/:id/review')
    .put(protect, isAdmin, protectCsrf, reviewTransaction);

module.exports = router;