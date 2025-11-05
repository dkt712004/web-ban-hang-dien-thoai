// server/controllers/reportController.js
const Product = require('../models/ProductModel');
const InventoryTransaction = require('../models/InventoryTransactionModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Lấy các số liệu thống kê tổng quan cho Dashboard
// @route   GET /api/reports/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Tổng số sản phẩm (chỉ tính sản phẩm gốc, không tính variant)
    const totalProducts = await Product.countDocuments();

    // 2. Tổng số lượng tồn kho của tất cả sản phẩm
    const totalStock = await Product.aggregate([
        { $unwind: '$variants' },
        { $group: { _id: null, total: { $sum: '$variants.stock_quantity' } } }
    ]);

    // 3. Tổng số giao dịch xuất kho đã được duyệt
    const totalSalesTransactions = await InventoryTransaction.countDocuments({
        type: 'OUT',
        status: 'Approved'
    });

    // 4. Tổng số lượng sản phẩm đã bán (xuất kho)
    const totalSoldItems = await InventoryTransaction.aggregate([
        { $match: { type: 'OUT', status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    res.json({
        totalProducts,
        totalStock: totalStock.length > 0 ? totalStock[0].total : 0,
        totalSalesTransactions,
        totalSoldItems: totalSoldItems.length > 0 ? totalSoldItems[0].total : 0,
    });
});

// @desc    Lấy dữ liệu doanh số (số lượng xuất) theo ngày
// @route   GET /api/reports/sales-by-date
exports.getSalesByDate = asyncHandler(async (req, res) => {
    // Lấy khoảng thời gian từ query, mặc định là 7 ngày gần nhất
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const salesData = await InventoryTransaction.aggregate([
        // Lọc các giao dịch xuất kho đã được duyệt trong khoảng thời gian
        {
            $match: {
                type: 'OUT',
                status: 'Approved',
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        // Gom nhóm theo ngày
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalQuantity: { $sum: "$quantity" }
            }
        },
        // Sắp xếp theo ngày
        { $sort: { _id: 1 } }
    ]);

    // Chuyển đổi dữ liệu để phù hợp với Chart.js
    const labels = salesData.map(item => item._id);
    const data = salesData.map(item => item.totalQuantity);

    res.json({ labels, data });
});

// @desc    Lấy danh sách sản phẩm bán chạy nhất
// @route   GET /api/reports/top-selling
exports.getTopSellingProducts = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;

    const topProducts = await InventoryTransaction.aggregate([
        { $match: { type: 'OUT', status: 'Approved' } },
        {
            $group: {
                _id: '$product', // Gom nhóm theo ID sản phẩm
                totalSold: { $sum: '$quantity' }
            }
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        // Lấy thông tin chi tiết của sản phẩm
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        // "Dàn phẳng" mảng productDetails
        { $unwind: '$productDetails' }
    ]);

    res.json(topProducts);
});