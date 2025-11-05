// server/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesByDate,
    getTopSellingProducts,
} = require('../controllers/reportController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Chỉ Admin mới được xem báo cáo
router.use(protect, isAdmin);

// API cho các thẻ thống kê nhanh trên Dashboard
router.get('/stats', getDashboardStats);

// API cho biểu đồ doanh số theo ngày
router.get('/sales-by-date', getSalesByDate);

// API cho danh sách sản phẩm bán chạy
router.get('/top-selling', getTopSellingProducts);

module.exports = router;