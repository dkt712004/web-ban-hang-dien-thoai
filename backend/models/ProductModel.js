// server/models/ProductModel.js
const mongoose = require('mongoose');

// Schema cho từng phiên bản của sản phẩm (ví dụ: màu sắc, dung lượng)
const ProductVariantSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Ví dụ: 'Đỏ, 128GB'
    sku: { type: String, required: true, unique: true }, // Mã SKU cho từng phiên bản
    price: { type: Number, required: true, default: 0 },
    stock_quantity: { type: Number, required: true, default: 0 }, // Số lượng tồn kho
});

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true,
    },
    brand: { // Nhãn hiệu
        type: String,
    },
    category: { // Loại sản phẩm
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    tags: [{
        type: String,
    }],
    variants: [ProductVariantSchema], // Một sản phẩm có thể có nhiều phiên bản
    total_stock: { // Tổng số lượng tồn kho của tất cả phiên bản
        type: Number,
        default: 0,
    },
    user: { // Người tạo sản phẩm
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// Middleware để tự động tính tổng tồn kho trước khi lưu
ProductSchema.pre('save', function(next) {
    this.total_stock = this.variants.reduce((acc, variant) => acc + variant.stock_quantity, 0);
    next();
});

module.exports = mongoose.model('Product', ProductSchema);