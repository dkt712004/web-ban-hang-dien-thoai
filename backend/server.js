// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

// Tải biến môi trường
dotenv.config();

// Kết nối CSDL MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const app = express();

// Middlewares - Chống CSRF
app.use(cors({
    origin: 'http://localhost:3000', // Chỉ cho phép domain của frontend
    credentials: true // Cho phép gửi cookie
}));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Định nghĩa các routes cho auth và user
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));


// --- MIDDLEWARE XỬ LÝ LỖI (PHẢI ĐẶT Ở CUỐI CÙNG) ---
app.use(notFound);       // Bắt lỗi 404 cho các route không tồn tại
app.use(errorHandler);   // Bắt tất cả các lỗi khác



const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));