// controllers/userController.js
const User = require('../models/UserModel');
const Role = require('../models/RoleModel'); // Cần Role model để phân quyền
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

// @desc    Lấy thông tin profile người dùng
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
    // req.user được gán từ middleware xác thực
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.full_name = req.body.full_name || user.full_name;
        user.phone_number = req.body.phone_number || user.phone_number;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            phone_number: updatedUser.phone_number,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Thay đổi mật khẩu
// @route   PUT /api/users/change-password
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.');
    }

    const user = await User.findById(req.user.id);

    if (user) {
        const isMatch = await user.matchPassword(currentPassword);

        // --- SỬA LẠI LOGIC TRẢ VỀ LỖI ---
        if (!isMatch) {
            // Trả về lỗi 401 với cấu trúc chi tiết
            return res.status(401).json({
                message: 'Thông tin không hợp lệ.', // Thông điệp chung
                errors: [
                    {
                        field: 'currentPassword', // Tên trường bị lỗi
                        message: 'Mật khẩu hiện tại không đúng.', // Thông điệp lỗi của trường đó
                    },
                ],
            });
        }

        const isSameAsOld = await user.matchPassword(newPassword);
        if (isSameAsOld) {
            // Trả về lỗi 400 với cấu trúc chi tiết
            return res.status(400).json({
                message: 'Thông tin không hợp lệ.',
                errors: [
                    {
                        field: 'newPassword',
                        message: 'Mật khẩu mới không được trùng với mật khẩu cũ.',
                    },
                ],
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công.' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
});



// ---------------------------------------------------------------- //
// @desc    Admin lấy danh sách tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.getUsers = asyncHandler(async (req, res) => {
    // Populate để lấy thông tin chi tiết của vai trò (role)
    const users = await User.find({}).populate('role', 'name').select('-password');
    res.json(users);
});

// ---------------------------------------------------------------- //
// @desc    Admin lấy thông tin chi tiết một người dùng
// @route   GET /api/users/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate('role').select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

// ---------------------------------------------------------------- //
// @desc    Admin tạo người dùng mới
// @route   POST /api/users
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.createUserByAdmin = asyncHandler(async (req, res) => {
    const { full_name, email, password, role_id } = req.body;

    if (!full_name || !email || !password || !role_id) {
        res.status(400);
        throw new Error('Vui lòng cung cấp đầy đủ thông tin');
    }

    const userExists = await User.findOne({ email });

    // --- SỬA LẠI LOGIC TRẢ VỀ LỖI KHI EMAIL TRÙNG LẶP ---
    if (userExists) {
        // Trả về lỗi 400 (Bad Request) với cấu trúc lỗi chi tiết
        return res.status(400).json({
            message: 'Không thể tạo người dùng.', // Thông điệp chung
            errors: [
                {
                    field: 'email', // Tên trường bị lỗi
                    message: 'Email này đã được sử dụng.', // Thông điệp lỗi của trường đó
                },
            ],
        });
    }

    const user = await User.create({
        full_name,
        email,
        password,
        role: role_id,
    });

    if (user) {
        const createdUser = await User.findById(user._id).populate('role', 'name').select('-password');
        res.status(201).json(createdUser);
    } else {
        res.status(400);
        throw new Error('Dữ liệu người dùng không hợp lệ');
    }
});

// ---------------------------------------------------------------- //
// ---------------------------------------------------------------- //
// @desc    Admin cập nhật thông tin và vai trò của người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.updateUserByAdmin = asyncHandler(async (req, res) => {
    const userToUpdate = await User.findById(req.params.id);

    if (userToUpdate) {
        const isAdminUpdatingSelf = userToUpdate._id.equals(req.user._id);

        // Cập nhật các thông tin cơ bản
        userToUpdate.full_name = req.body.full_name || userToUpdate.full_name;
        userToUpdate.email = req.body.email || userToUpdate.email;

        // --- LOGIC CẬP NHẬT VAI TRÒ ĐÃ SỬA ---
        if (req.body.role_id) {
            // Kiểm tra xem có phải Admin đang tự sửa vai trò của mình không
            if (isAdminUpdatingSelf) {
                // Nếu vai trò mới khác vai trò cũ
                if (userToUpdate.role.toString() !== req.body.role_id) {
                    res.status(400);
                    throw new Error('Bạn không thể thay đổi vai trò của chính mình.');
                }
                // Nếu vai trò không đổi thì không làm gì cả, bỏ qua
            } else {
                // Nếu là sửa vai trò cho người khác, cho phép cập nhật
                userToUpdate.role = req.body.role_id;
            }
        }

        // Admin có thể reset mật khẩu cho người dùng nếu cần
        if (req.body.password) {
            userToUpdate.password = req.body.password;
        }

        const updatedUser = await userToUpdate.save();
        const result = await User.findById(updatedUser._id).populate('role', 'name').select('-password');
        res.json(result);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});

// ---------------------------------------------------------------- //
// @desc    Admin xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ---------------------------------------------------------------- //
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        // Thêm một lớp bảo vệ: không cho admin tự xóa chính mình
        if (user._id.equals(req.user._id)) {
            res.status(400);
            throw new Error('Bạn không thể xóa chính tài khoản của mình');
        }

        // --- SỬA LẠI DÒNG NÀY ---
        // Thay thế user.remove() bằng user.deleteOne()
        await user.deleteOne();

        res.json({ message: 'Người dùng đã được xóa thành công.' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng');
    }
});