const InventoryTransaction = require('../models/InventoryTransactionModel');
const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Tạo một giao dịch nhập/xuất kho
// @route   POST /api/inventory
// @access  Private/WarehouseManager or Admin
exports.createTransaction = asyncHandler(async (req, res) => {
    // Nhận thêm total_amount từ req.body
    const { type, quantity, notes, isNewProduct, product, variant, newProductData, total_amount } = req.body;

    // Validate đầu vào
    if (!type || !quantity) {
        res.status(400);
        throw new Error('Loại giao dịch và số lượng là bắt buộc.');
    }

    // Nếu là sản phẩm mới, kiểm tra các trường cần thiết và SKU không được trùng
    if (isNewProduct) {
        if (!newProductData?.name || !newProductData?.categoryName || !newProductData?.variantData?.sku) {
            res.status(400);
            throw new Error('Thiếu thông tin cho sản phẩm mới (Tên, Danh mục, SKU).');
        }
        const existingProductWithSku = await Product.findOne({ 'variants.sku': newProductData.variantData.sku });
        if (existingProductWithSku) {
            res.status(400);
            throw new Error(`Mã SKU '${newProductData.variantData.sku}' đã tồn tại trong hệ thống.`);
        }
    }

    // Tạo phiếu giao dịch với trạng thái 'Pending'
    const transaction = await InventoryTransaction.create({
        type,
        quantity,
        notes,
        isNewProduct,
        product: isNewProduct ? null : product,
        variant: isNewProduct ? null : variant,
        newProductData: isNewProduct ? newProductData : undefined,
        total_amount: total_amount || 0, // Nhận tổng tiền từ client
        user: req.user._id,
        status: 'Pending',
    });

    res.status(201).json({ message: 'Yêu cầu đã được gửi đi và đang chờ phê duyệt.', transaction });
});

// @desc    Admin phê duyệt hoặc từ chối một giao dịch
// @route   PUT /api/inventory/:id/review
// @access  Private/Admin
exports.reviewTransaction = asyncHandler(async (req, res) => {
    const { status, rejectionReason } = req.body;
    const transaction = await InventoryTransaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Không tìm thấy phiếu giao dịch.');
    }

    if (transaction.status !== 'Pending') {
        res.status(400);
        throw new Error(`Không thể duyệt phiếu đã ở trạng thái ${transaction.status}.`);
    }

    // Xử lý khi từ chối
    if (status === 'Rejected') {
        transaction.status = 'Rejected';
        transaction.rejectionReason = rejectionReason || 'Không có lý do cụ thể.';
        transaction.approvedBy = req.user._id;
        await transaction.save();
        return res.json({ message: 'Giao dịch đã bị từ chối.' });
    }

    // Xử lý khi phê duyệt
    if (status === 'Approved') {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let targetProduct;
            let targetVariant;

            // --- Xử lý cho SẢN PHẨM MỚI ---
            if (transaction.isNewProduct) {
                const { name, brand, categoryName, variantData } = transaction.newProductData;

                // Tìm hoặc tạo mới danh mục
                let category = await Category.findOne({ name: categoryName }).session(session);
                if (!category) {
                    category = new Category({ name: categoryName });
                    await category.save({ session });
                }

                // Tạo sản phẩm mới
                targetProduct = new Product({
                    name,
                    brand,
                    category: category._id,
                    user: transaction.user,
                    variants: [],
                });

                // Nếu là phiếu NHẬP, tồn kho là số dương.
                // Nếu là phiếu XUẤT (trường hợp hiếm), tồn kho là số âm.
                const initialStock = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;

                // Thêm phiên bản mới vào sản phẩm
                targetVariant = {
                    _id: new mongoose.Types.ObjectId(),
                    name: variantData.name,
                    sku: variantData.sku,
                    price: variantData.price,
                    stock_quantity: initialStock,
                };
                targetProduct.variants.push(targetVariant);
                await targetProduct.save({ session });

                // Cập nhật lại tổng tiền dựa trên giá vừa tạo
                transaction.total_amount = variantData.price * transaction.quantity;
            }
            // --- Xử lý cho SẢN PHẨM ĐÃ CÓ ---
            else {
                targetProduct = await Product.findById(transaction.product).session(session);
                if (!targetProduct) throw new Error('Sản phẩm không còn tồn tại trong hệ thống.');

                targetVariant = targetProduct.variants.id(transaction.variant);
                if (!targetVariant) throw new Error('Phiên bản sản phẩm không còn tồn tại.');

                // Tự động tính toán lại tổng tiền để đảm bảo chính xác
                transaction.total_amount = targetVariant.price * transaction.quantity;

                const quantityChange = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;

                // Chỉ kiểm tra tồn kho khi xuất hàng
                if (transaction.type === 'OUT' && targetVariant.stock_quantity < transaction.quantity) {
                    throw new Error(`Tồn kho không đủ. Tồn kho hiện tại của phiên bản này: ${targetVariant.stock_quantity}`);
                }

                targetVariant.stock_quantity += quantityChange;
                await targetProduct.save({ session });
            }

            // Cập nhật lại thông tin phiếu giao dịch
            transaction.status = 'Approved';
            transaction.approvedBy = req.user._id;
            // Gán lại ID sản phẩm và phiên bản (quan trọng cho trường hợp sản phẩm mới)
            transaction.product = targetProduct._id;
            transaction.variant = targetVariant._id;
            await transaction.save({ session });

            await session.commitTransaction();
            res.json({ message: 'Phiếu đã được phê duyệt và hệ thống đã được cập nhật.' });

        } catch (error) {
            await session.abortTransaction();
            res.status(400); // Bad Request cho các lỗi nghiệp vụ
            throw new Error(error.message);
        } finally {
            session.endSession();
        }
    } else {
        res.status(400);
        throw new Error('Trạng thái duyệt không hợp lệ.');
    }
});

// @desc    Lấy lịch sử giao dịch kho
// @route   GET /api/inventory
// @access  Private/WarehouseManager or Admin
exports.getTransactions = asyncHandler(async (req, res) => {
    const transactions = await InventoryTransaction.find({})
        .populate('user', 'full_name') // Lấy tên người tạo
        .populate('approvedBy', 'full_name') // Lấy tên người duyệt
        .populate({
            path: 'product',
            select: 'name variants', // Populate cả sản phẩm và các phiên bản của nó
        })
        .sort({ createdAt: -1 });

    // Xử lý dữ liệu trả về để frontend dễ dàng hiển thị
    const results = transactions.map(t => {
        let productName = '[Sản phẩm không xác định]';
        let variantName = '[Phiên bản không xác định]';

        if (t.isNewProduct) {
            productName = t.newProductData.name || '[Sản phẩm mới]';
            variantName = t.newProductData.variantData.name || '[Phiên bản mới]';
        } else if (t.product) {
            productName = t.product.name;
            const variant = t.product.variants.id(t.variant);
            if (variant) {
                variantName = variant.name;
            } else {
                variantName = '[Phiên bản đã bị xóa]';
            }
        } else if (t.status === 'Pending') {
            // Trường hợp phiếu đang chờ nhưng sản phẩm gốc đã bị xóa
            productName = '[Sản phẩm đã bị xóa]';
        }

        return {
            ...t.toObject(),
            productName,
            variantName,
        };
    });

    res.json(results);
});