// server/middlewares/csrfMiddleware.js
const asyncHandler = require('express-async-handler');

exports.protectCsrf = asyncHandler(async (req, res, next) => {
    const csrfTokenFromCookie = req.cookies['csrf-token'];
    const csrfTokenFromHeader = req.headers['x-csrf-token'];

    if (!csrfTokenFromCookie || !csrfTokenFromHeader || csrfTokenFromCookie !== csrfTokenFromHeader) {
        res.status(403);
        throw new Error('CSRF token không hợp lệ hoặc bị thiếu.');
    }

    next();
});