const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
    // --- Các trường cũ ---
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: [1, 'Số lượng phải lớn hơn 0'] },
    notes: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true },
    total_amount: { type: Number, required: true, default: 0 },

    // --- CÁC TRƯỜNG MỚI ĐỂ XỬ LÝ SẢN PHẨM ---
    // Phân biệt giữa nhập hàng đã có và nhập hàng mới
    isNewProduct: {
        type: Boolean,
        default: false,
    },

    // --- Thông tin cho sản phẩm ĐÃ CÓ (khi isNewProduct = false) ---
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variant: { type: mongoose.Schema.Types.ObjectId },

    // --- Thông tin cho sản phẩm MỚI (khi isNewProduct = true) ---
    // Sẽ được dùng để tạo sản phẩm/danh mục mới khi Admin duyệt
    newProductData: {
        name: { type: String },
        brand: { type: String },
        categoryName: { type: String }, // Lưu tên danh mục mới/hiện có
        // Lưu thông tin phiên bản mới ngay trong phiếu
        variantData: {
            name: { type: String },
            sku: { type: String },
            price: { type: Number },
        }
    }
}, { timestamps: true });

// Thêm validation để đảm bảo dữ liệu hợp lệ
InventoryTransactionSchema.pre('save', function(next) {
    if (this.isNewProduct) {
        if (!this.newProductData || !this.newProductData.name || !this.newProductData.categoryName || !this.newProductData.variantData || !this.newProductData.variantData.sku) {
            return next(new Error('Thiếu thông tin cho sản phẩm mới (Tên, Danh mục, SKU)'));
        }
    } else {
        if (!this.product || !this.variant) {
            return next(new Error('Thiếu thông tin sản phẩm/phiên bản đã có'));
        }
    }
    next();
});

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);