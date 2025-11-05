const Category = require('../models/CategoryModel');
const Product = require('../models/ProductModel');
const ExcelJS = require('exceljs');
const asyncHandler = require('express-async-handler'); // Thư viện giúp bắt lỗi async mà không cần try-catch

// ---------------------------------------------------------------- //
// @desc    Tạo một danh mục mới
// @route   POST /api/categories
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;

    // Kiểm tra xem tên danh mục đã tồn tại chưa
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
        res.status(400); // Bad Request
        throw new Error('Tên danh mục đã tồn tại');
    }

    const category = new Category({
        name,
        description,
        image,
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
});

// ---------------------------------------------------------------- //
// @desc    Lấy tất cả danh mục
// @route   GET /api/categories
// @access  Public
// ---------------------------------------------------------------- //
exports.getCategories = asyncHandler(async (req, res) => {
    // Lấy từ khóa tìm kiếm từ query string
    const keyword = req.query.keyword ? {
        name: {
            $regex: req.query.keyword,
            $options: 'i', // 'i' for case-insensitive
        },
    } : {};

    // Tìm tất cả danh mục khớp với từ khóa
    const categories = await Category.find({ ...keyword }).sort({ createdAt: -1 });

    // Đếm số lượng sản phẩm trong mỗi danh mục
    // Promise.all giúp thực hiện các câu truy vấn song song để tăng hiệu suất
    const categoriesWithProductCount = await Promise.all(
        categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            // Trả về một object mới bao gồm thông tin category và số lượng sản phẩm
            return {
                ...category.toObject(), // Chuyển Mongoose document thành plain object
                productCount,
            };
        })
    );

    res.json(categoriesWithProductCount);
});

// ---------------------------------------------------------------- //
// @desc    Lấy một danh mục theo ID
// @route   GET /api/categories/:id
// @access  Public
// ---------------------------------------------------------------- //
exports.getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy danh mục');
    }
});

// ---------------------------------------------------------------- //
// @desc    Cập nhật một danh mục
// @route   PUT /api/categories/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.updateCategory = asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        // Kiểm tra nếu tên mới đã tồn tại ở một danh mục khác
        const categoryExists = await Category.findOne({ name, _id: { $ne: req.params.id } });
        if (categoryExists) {
            res.status(400);
            throw new Error('Tên danh mục đã tồn tại');
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.image = image || category.image;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy danh mục');
    }
});

// ---------------------------------------------------------------- //
// @desc    Xóa một danh mục
// @route   DELETE /api/categories/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        // Kiểm tra ràng buộc: Không cho xóa nếu danh mục vẫn còn sản phẩm
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            res.status(400); // Bad Request
            throw new Error(`Không thể xóa. Danh mục vẫn còn ${productCount} sản phẩm.`);
        }

        // --- SỬA LỖI CORE: Thay thế .remove() bằng .deleteOne() ---
        await category.deleteOne();

        res.json({ message: 'Danh mục đã được xóa thành công.' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy danh mục');
    }
});

// ---------------------------------------------------------------- //
// @desc    Xuất danh sách danh mục ra file Excel
// @route   GET /api/categories/export
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.exportCategories = asyncHandler(async (req, res) => {
    // 2. Lấy dữ liệu từ CSDL
    const categories = await Category.find({}).sort({ name: 1 });

    // 3. Tạo workbook và worksheet mới
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh mục');

    // 4. Định nghĩa các cột và style cho header
    worksheet.columns = [
        { header: 'ID Danh mục', key: 'id', width: 30 },
        { header: 'Tên Danh mục', key: 'name', width: 35 },
        { header: 'Mô tả', key: 'description', width: 50 },
        { header: 'Số lượng sản phẩm', key: 'productCount', width: 20 },
        { header: 'Ngày tạo', key: 'createdAt', width: 15 },
    ];

    // Style cho hàng header
    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1890FF' }, // Màu xanh của Ant Design
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // 5. Thêm dữ liệu vào worksheet
    const categoriesData = await Promise.all(
        categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            return {
                id: category._id.toString(),
                name: category.name,
                description: category.description || '—', // Xử lý nếu không có mô tả
                productCount: productCount,
                createdAt: category.createdAt.toLocaleDateString('vi-VN'),
            };
        })
    );

    worksheet.addRows(categoriesData);

    // Style cho các ô dữ liệu (căn giữa, thêm border...)
    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
            if (rowNumber > 1) { // Bỏ qua hàng header
                cell.border = {
                    top: { style: 'thin' }, left: { style: 'thin' },
                    bottom: { style: 'thin' }, right: { style: 'thin' }
                };
            }
            // Căn giữa cột số lượng
            if (worksheet.columns[colNumber - 1].key === 'productCount') {
                cell.alignment = { horizontal: 'right' };
            }
        });
    });

    // 6. Gửi file về cho client
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Danh_muc_san_pham.xlsx'
    );

    // Ghi workbook vào stream của response
    await workbook.xlsx.write(res);
    res.end(); // Kết thúc response
});