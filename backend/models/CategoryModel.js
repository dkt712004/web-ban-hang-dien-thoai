// server/models/CategoryModel.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên danh mục'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);