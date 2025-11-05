const Product = require('../models/ProductModel');
const Category = require('../models/CategoryModel');
const asyncHandler = require('express-async-handler');
const ExcelJS = require('exceljs');
// ---------------------------------------------------------------- //
// @desc    Lấy danh sách sản phẩm với bộ lọc và phân trang
// @route   GET /api/products
// @access  Public
// ---------------------------------------------------------------- //
exports.getProducts = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.pageSize) || 10; // Số sản phẩm mỗi trang
    const page = parseInt(req.query.page) || 1; // Trang hiện tại

    // --- Xây dựng bộ lọc (Filter) ---
    const filter = {};
    if (req.query.keyword) {
        // Tìm kiếm không phân biệt hoa thường theo tên sản phẩm hoặc SKU của variants
        filter.$or = [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { 'variants.sku': { $regex: req.query.keyword, $options: 'i' } }
        ];
    }
    if (req.query.category) {
        filter.category = req.query.category;
    }
    if (req.query.brand) {
        filter.brand = { $regex: req.query.brand, $options: 'i' };
    }
    if (req.query.tag) {
        filter.tags = req.query.tag;
    }

    // Đếm tổng số sản phẩm khớp với bộ lọc
    const count = await Product.countDocuments(filter);

    // Tìm sản phẩm với bộ lọc, phân trang và sắp xếp
    const products = await Product.find(filter)
        .populate('category', 'name') // Lấy tên từ bảng Category
        .populate('user', 'full_name') // Lấy tên người tạo từ bảng User
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize), // Tổng số trang
        total: count, // Tổng số sản phẩm
    });
});

// ---------------------------------------------------------------- //
// @desc    Lấy thông tin chi tiết một sản phẩm
// @route   GET /api/products/:id
// @access  Public
// ---------------------------------------------------------------- //
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('user', 'full_name');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy sản phẩm');
    }
});

// ---------------------------------------------------------------- //
// @desc    Tạo một sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.createProduct = asyncHandler(async (req, res) => {
    // 1. Lấy dữ liệu từ body, không còn 'image'
    const { name, brand, category, tags, variants } = req.body;

    // 2. Sửa lại logic validation cho phù hợp
    if (!name || !category || !variants || variants.length === 0) {
        res.status(400);
        throw new Error('Vui lòng điền đầy đủ Tên sản phẩm, Danh mục và ít nhất một phiên bản.');
    }

    // Kiểm tra SKU của các phiên bản có trùng lặp không
    const skus = variants.map(v => v.sku);
    if (skus.some(sku => !sku)) { // Kiểm tra xem có sku nào rỗng không
        res.status(400);
        throw new Error('Mã SKU của tất cả các phiên bản là bắt buộc.');
    }
    const existingProductWithSku = await Product.findOne({ 'variants.sku': { $in: skus } });
    if (existingProductWithSku) {
        res.status(400);
        throw new Error('Một trong các mã SKU đã tồn tại trong hệ thống.');
    }

    // 3. Tạo sản phẩm mới, không có trường 'image'
    const product = new Product({
        name,
        brand,
        category,
        tags,
        variants,
        user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// ---------------------------------------------------------------- //
// @desc    Cập nhật một sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.updateProduct = asyncHandler(async (req, res) => {
    const { name, image, brand, category, tags, variants } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.image = image || product.image;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.tags = tags || product.tags;
        product.variants = variants || product.variants;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy sản phẩm');
    }
});

// ---------------------------------------------------------------- //
// @desc    Xóa một sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        // --- THÊM BƯỚC KIỂM TRA NGHIỆP VỤ ---
        // Kiểm tra xem tổng tồn kho của sản phẩm có lớn hơn 0 không.
        // `total_stock` được tính tự động bởi pre-save hook trong ProductModel.
        if (product.total_stock > 0) {
            res.status(400); // Bad Request
            throw new Error(`Không thể xóa. Sản phẩm vẫn còn ${product.total_stock} đơn vị trong kho.`);
        }

        // TODO (Nâng cao): Kiểm tra xem sản phẩm có trong bất kỳ phiếu nhập/xuất kho nào không.
        // Nếu có, có thể không cho xóa để bảo toàn lịch sử.
        // const transactionExists = await InventoryTransaction.findOne({ product: product._id });
        // if (transactionExists) {
        //     res.status(400);
        //     throw new Error('Không thể xóa. Sản phẩm đã tồn tại trong lịch sử giao dịch kho.');
        // }

        // --- SỬA LỖI CORE: Thay thế .remove() bằng .deleteOne() ---
        await product.deleteOne();

        res.json({ message: 'Sản phẩm đã được xóa thành công.' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy sản phẩm');
    }
});

// ---------------------------------------------------------------- //
// @desc    Xuất danh sách sản phẩm ra file Excel
// @route   GET /api/products/export
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.exportProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .populate('category', 'name')
        .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách sản phẩm');

    // --- Định nghĩa các cột và style cho header ---
    worksheet.columns = [
        { header: 'ID Sản phẩm', key: 'productId', width: 30 },
        { header: 'Tên sản phẩm', key: 'productName', width: 40 },
        { header: 'Tên phiên bản', key: 'variantName', width: 30 },
        { header: 'Mã SKU', key: 'sku', width: 20 },
        { header: 'Danh mục', key: 'category', width: 20 },
        { header: 'Nhãn hiệu', key: 'brand', width: 20 },
        { header: 'Giá bán', key: 'price', width: 15 },
        { header: 'Tồn kho', key: 'stock', width: 10 },
        { header: 'Ngày tạo', key: 'createdAt', width: 15 },
    ];

    // Style cho hàng header
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF007BFF' }, // Màu xanh dương
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // --- Thêm dữ liệu vào worksheet ---
    products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
                worksheet.addRow({
                    productId: product._id.toString(),
                    productName: product.name,
                    variantName: variant.name,
                    sku: variant.sku,
                    category: product.category ? product.category.name : 'N/A',
                    brand: product.brand || 'N/A',
                    price: variant.price,
                    stock: variant.stock_quantity,
                    createdAt: product.createdAt.toLocaleDateString('vi-VN'),
                });
            });
        }
    });

    // Style cho các ô dữ liệu
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if (rowNumber > 1) { // Bỏ qua hàng header
            row.eachCell({ includeEmpty: true }, function (cell) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }
    });

    // Định dạng cột Giá bán và Tồn kho
    worksheet.getColumn('price').numFmt = '#,##0 "VNĐ"';
    worksheet.getColumn('stock').alignment = { horizontal: 'right' };


    // --- Gửi file về cho client ---
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Danh_sach_san_pham.xlsx'
    );

    // Ghi workbook vào stream và gửi về response
    await workbook.xlsx.write(res);
    res.end();
});

// hàm import từ file excel

exports.importProducts = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Vui lòng tải lên một file Excel');
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
        res.status(400);
        throw new Error('File Excel rỗng hoặc không đúng định dạng.');
    }

    // Chuyển đổi dữ liệu và tạo sản phẩm
    // Đây là logic phức tạp, cần validate kỹ
    // Ví dụ đơn giản:
    const newProducts = data.map(row => ({
        name: row['Tên sản phẩm'],
        image: row['URL Hình ảnh'],
        brand: row['Nhãn hiệu'],
        category: row['ID Danh mục'], // Cần đảm bảo ID này tồn tại
        user: req.user._id,
        variants: [{
            name: row['Tên phiên bản'] || 'Mặc định',
            sku: row['Mã SKU'],
            price: row['Giá bán'],
            stock_quantity: row['Tồn kho'],
        }],
    }));

    const createdProducts = await Product.insertMany(newProducts);
    res.status(201).json({
        message: `Nhập thành công ${createdProducts.length} sản phẩm.`,
        data: createdProducts,
    });
});