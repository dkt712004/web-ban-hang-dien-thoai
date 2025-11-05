const crypto = require('crypto');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Hàm tạo token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
exports.registerUser = asyncHandler(async (req, res) => {
    // ... logic của hàm registerUser ...
});

// @desc    Đăng nhập và tạo tokens
// @route   POST /api/auth/login
exports.loginUser = asyncHandler(async (req, res) => {
    // 1. Lấy email và mật khẩu từ body của request
    const { email, password } = req.body;

    // 2. Kiểm tra đầu vào cơ bản
    if (!email || !password) {
        res.status(400); // Bad Request
        throw new Error('Vui lòng cung cấp đầy đủ email và mật khẩu.');
    }

    // 3. Tìm người dùng trong CSDL bằng email
    //    .populate('role', 'name') sẽ thay thế ObjectId của 'role' bằng object { name: '...' }
    const user = await User.findOne({ email }).populate('role', 'name');

    // 4. Xử lý trường hợp không tìm thấy người dùng
    if (!user) {
        // Trả về lỗi 401 (Unauthorized) nhưng với cấu trúc lỗi chi tiết
        // để frontend có thể xác định lỗi thuộc về trường 'email'.
        return res.status(401).json({
            message: 'Thông tin đăng nhập không chính xác.',
            errors: [
                {
                    field: 'email',
                    message: 'Email này không tồn tại trong hệ thống.',
                },
            ],
        });
    }

    // 5. Nếu tìm thấy người dùng, so sánh mật khẩu đã nhập với mật khẩu đã hash trong CSDL
    const isPasswordMatch = await user.matchPassword(password);

    // 6. Xử lý trường hợp sai mật khẩu
    if (!isPasswordMatch) {
        // Trả về lỗi 401 với cấu trúc lỗi chi tiết cho trường 'password'.
        return res.status(401).json({
            message: 'Thông tin đăng nhập không chính xác.',
            errors: [
                {
                    field: 'password',
                    message: 'Mật khẩu không đúng.',
                },
            ],
        });
    }


    // a. Tạo một chuỗi ngẫu nhiên, an toàn cho CSRF token
    const csrfToken = crypto.randomBytes(100).toString('hex');

    // b. Gửi CSRF token vào một cookie cho trình duyệt lưu trữ
    res.cookie('csrf-token', csrfToken, {
        // Cài đặt an toàn cho cookie

    });

    // c. Gửi phản hồi thành công về cho client
    res.status(200).json({
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role.name, // Trả về tên của vai trò (vd: 'Admin')
        jwtToken: generateToken(user._id), // Gửi JWT token trong body
    });
});


// @desc    Đăng xuất và xóa cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logoutUser = (req, res) => {
    // Xóa cookie 'csrf-token' bằng cách gửi lại cookie có cùng tên
    // với nội dung rỗng và ngày hết hạn trong quá khứ.
    res.cookie('csrf-token', '', {
        // httpOnly: false, // Phải khớp với cài đặt khi tạo
        expires: new Date(0), // Đặt ngày hết hạn về 1/1/1970
    });

    res.status(200).json({ message: 'Đăng xuất thành công' });
};