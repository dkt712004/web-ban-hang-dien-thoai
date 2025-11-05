const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');

// --- Middleware bảo vệ Route, xác thực Token ---
// Middleware này sẽ được dùng cho TẤT CẢ các route cần đăng nhập.
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Kiểm tra xem header 'Authorization' có tồn tại và bắt đầu bằng 'Bearer' không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Lấy token từ header (loại bỏ chữ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // 2. Giải mã token để lấy ID người dùng
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Dùng ID từ token để tìm người dùng trong CSDL
            // QUAN TRỌNG:
            // - .populate('role'): Lấy thông tin chi tiết của vai trò (tên, mô tả...)
            // - .select('-password'): Loại bỏ trường mật khẩu khỏi kết quả trả về để bảo mật
            req.user = await User.findById(decoded.id).populate('role').select('-password');

            // Nếu không tìm thấy user (ví dụ: user đã bị xóa), báo lỗi
            if (!req.user) {
                res.status(401);
                throw new Error('Không được phép, người dùng không tồn tại');
            }

            // Nếu mọi thứ ổn, cho phép đi tiếp tới handler tiếp theo
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Không được phép, token không hợp lệ');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Không được phép, không tìm thấy token');
    }
});


// --- Middleware phân quyền: Chỉ cho phép ADMIN ---
// Middleware này phải được dùng SAU middleware 'protect'.
exports.isAdmin = (req, res, next) => {
    // Kiểm tra đối tượng req.user đã được 'protect' thêm vào
    if (req.user && req.user.role && req.user.role.name === 'Admin') {
        next(); // Là Admin, cho đi tiếp
    } else {
        res.status(403); // Lỗi 403: Forbidden (Bị cấm)
        throw new Error('Không có quyền truy cập. Yêu cầu quyền Admin.');
    }
};


// --- Middleware phân quyền: Cho phép ADMIN hoặc NHÂN VIÊN KHO ---
// Middleware này phải được dùng SAU middleware 'protect'.
exports.isWarehouseManager = (req, res, next) => {
    // Kiểm tra đối tượng req.user đã được 'protect' thêm vào
    if (req.user && req.user.role && (req.user.role.name === 'Admin' || req.user.role.name === 'Nhân viên Kho')) {
        next(); // Là Admin hoặc NV Kho, cho đi tiếp
    } else {
        res.status(403); // Lỗi 403: Forbidden (Bị cấm)
        throw new Error('Không có quyền truy cập chức năng này.');
    }
};