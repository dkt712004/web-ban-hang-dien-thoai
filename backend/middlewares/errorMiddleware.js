const notFound = (req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Đôi khi lỗi có status code 200, cần đặt lại thành 500 nếu không có status code nào khác
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // (Tùy chọn) Xử lý các lỗi cụ thể của Mongoose
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Không tìm thấy tài nguyên';
    }

    res.status(statusCode);

    res.json({
        message: message, // Luôn trả về key 'message'
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };