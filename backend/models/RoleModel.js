// models/RoleModel.js
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // "Admin", "NhanVienKho"
    },
});

module.exports = mongoose.model('Role', RoleSchema);