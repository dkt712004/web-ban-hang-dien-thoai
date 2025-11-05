const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const bcrypt =require('bcryptjs');

// Tải biến môi trường
dotenv.config();

// Tải các Models
const Role = require('./models/RoleModel');
const User = require('./models/UserModel');
const Category = require('./models/CategoryModel');
const Product = require('./models/ProductModel');
const InventoryTransaction = require('./models/InventoryTransactionModel');

// Kết nối CSDL
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected for Seeder...`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1);
    }
};

// --- DỮ LIỆU MẪU ĐÃ ĐƯỢC LÀM PHONG PHÚ ---

// 1. Roles
const rolesData = [
    { _id: new mongoose.Types.ObjectId(), name: 'Admin' },
    { _id: new mongoose.Types.ObjectId(), name: 'Nhân viên Kho' },
];

// 2. Users
const usersData = (adminRoleId, warehouseRoleId) => [
    { _id: new mongoose.Types.ObjectId(), full_name: 'Admin Quang Minh', email: 'admin@example.com', password: '123456', role: adminRoleId },
    { _id: new mongoose.Types.ObjectId(), full_name: 'Kho Trọng Nhân', email: 'kho@example.com', password: '123456', role: warehouseRoleId },
];

// 3. Categories
const categoriesData = [
    { _id: new mongoose.Types.ObjectId(), name: 'Điện thoại' },
    { _id: new mongoose.Types.ObjectId(), name: 'Máy tính bảng' },
    { _id: new mongoose.Types.ObjectId(), name: 'Phụ kiện' },
];

// 4. Products
const createProductsData = (catPhoneId, catTabletId, catAccessoryId, adminUserId) => [
    {
        _id: new mongoose.Types.ObjectId(), name: 'iPhone 15 Pro Max', brand: 'Apple', category: catPhoneId, user: adminUserId,
        variants: [{ name: '256GB - Titan Tự nhiên', sku: 'IP15PM-256-NAT', price: 34990000, stock_quantity: 26 }]
    },
    {
        _id: new mongoose.Types.ObjectId(), name: 'Samsung Galaxy Z Fold 4', brand: 'Samsung', category: catPhoneId, user: adminUserId,
        variants: [{ name: '512GB - Đen', sku: 'ZF4-512-BLK', price: 40990000, stock_quantity: 8 }]
    },
    {
        _id: new mongoose.Types.ObjectId(), name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: catPhoneId, user: adminUserId,
        variants: [{ name: '512GB - Xám Titan', sku: 'S24U-512-GRY', price: 33990000, stock_quantity: 10 }]
    },
    {
        _id: new mongoose.Types.ObjectId(), name: 'iPad Pro M2', brand: 'Apple', category: catTabletId, user: adminUserId,
        variants: [{ name: '11 inch - 128GB Wifi', sku: 'IPPM2-11-128-W', price: 23990000, stock_quantity: 10 }]
    },
    {
        _id: new mongoose.Types.ObjectId(), name: 'Ốp lưng Spigen cho iPhone 15', brand: 'Spigen', category: catAccessoryId, user: adminUserId,
        variants: [{ name: 'Trong suốt', sku: 'SPG-IP15-CLR', price: 550000, stock_quantity: 50 }]
    }
];

// 5. Inventory Transactions (Quan trọng nhất cho báo cáo)
// Hàm helper để tạo ngày trong quá khứ
const getDateInPast = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

const createInventoryTransactionsData = (adminUserId, products) => {
    const iphone15 = products.find(p => p.name.includes('iPhone 15'));
    const zfold4 = products.find(p => p.name.includes('Z Fold 4'));
    const s24ultra = products.find(p => p.name.includes('S24 Ultra'));

    return [
        // Các giao dịch bán hàng đã được duyệt, trải dài trong 5 ngày gần nhất
        { product: zfold4._id, variant: zfold4.variants[0]._id, type: 'OUT', quantity: 2, notes: 'Bán lẻ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(0) }, // Hôm nay
        { product: iphone15._id, variant: iphone15.variants[0]._id, type: 'OUT', quantity: 1, notes: 'Bán lẻ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(0) }, // Hôm nay

        { product: s24ultra._id, variant: s24ultra.variants[0]._id, type: 'OUT', quantity: 5, notes: 'Bán sỉ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(1) }, // Hôm qua
        { product: iphone15._id, variant: iphone15.variants[0]._id, type: 'OUT', quantity: 3, notes: 'Bán lẻ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(1) }, // Hôm qua

        { product: zfold4._id, variant: zfold4.variants[0]._id, type: 'OUT', quantity: 1, notes: 'Bán lẻ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(2) }, // 2 ngày trước

        { product: s24ultra._id, variant: s24ultra.variants[0]._id, type: 'OUT', quantity: 2, notes: 'Bán lẻ', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(4) }, // 4 ngày trước

        // Giao dịch nhập kho (không ảnh hưởng đến báo cáo bán hàng)
        { product: iphone15._id, variant: iphone15.variants[0]._id, type: 'IN', quantity: 30, notes: 'Nhập hàng mới', user: adminUserId, status: 'Approved', approvedBy: adminUserId, createdAt: getDateInPast(7) }
    ];
};

// --- HÀM IMPORT/DESTROY DỮ LIỆU ---

const importData = async () => {
    try {
        await connectDB();

        console.log('Đang xóa dữ liệu cũ...'.yellow);
        await Role.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await InventoryTransaction.deleteMany();
        console.log('Đã xóa dữ liệu cũ!'.red.inverse);

        // 1. Chèn Roles
        const createdRoles = await Role.insertMany(rolesData);
        console.log(`${createdRoles.length} Roles đã được nhập!`.green.inverse);
        const adminRole = createdRoles.find(r => r.name === 'Admin');
        const warehouseRole = createdRoles.find(r => r.name === 'Nhân viên Kho');

        // 2. Chèn Users
        const usersWithHashedPasswords = await Promise.all(
            usersData(adminRole._id, warehouseRole._id).map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
                return user;
            })
        );
        const createdUsers = await User.insertMany(usersWithHashedPasswords);
        console.log(`${createdUsers.length} Users đã được nhập!`.green.inverse);
        const adminUser = createdUsers.find(u => u.email === 'admin@example.com');

        // 3. Chèn Categories
        const createdCategories = await Category.insertMany(categoriesData);
        console.log(`${createdCategories.length} Categories đã được nhập!`.green.inverse);
        const phoneCat = createdCategories.find(c => c.name === 'Điện thoại');
        const tabletCat = createdCategories.find(c => c.name === 'Máy tính bảng');
        const accessoryCat = createdCategories.find(c => c.name === 'Phụ kiện');

        // 4. Chèn Products
        const productsToCreate = createProductsData(phoneCat._id, tabletCat._id, accessoryCat._id, adminUser._id);
        const createdProducts = await Product.insertMany(productsToCreate);
        console.log(`${createdProducts.length} Products đã được nhập!`.green.inverse);

        // 5. Chèn Inventory Transactions
        const transactionsToCreate = createInventoryTransactionsData(adminUser._id, createdProducts);
        await InventoryTransaction.insertMany(transactionsToCreate);
        console.log(`${transactionsToCreate.length} Transactions đã được nhập!`.green.inverse);

        console.log('NHẬP DỮ LIỆU THÀNH CÔNG!'.cyan.bold);
        process.exit();
    } catch (error) {
        console.error(`Lỗi: ${error.message}`.red.bold);
        process.exit(1);
    }
};

// Hàm xóa dữ liệu
const destroyData = async () => {
    try {
        await connectDB();

        console.log('Đang xóa toàn bộ dữ liệu...'.yellow);
        await Role.deleteMany();
        await User.deleteMany();
        await Category.deleteMany();
        await Product.deleteMany();
        await InventoryTransaction.deleteMany();
        console.log('Đã xóa dữ liệu!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`Lỗi khi xóa dữ liệu: ${error.message}`.red.bold);
        process.exit(1);
    }
};

// --- XỬ LÝ THAM SỐ DÒNG LỆNH ---
if (process.argv[2] === '-d') {
    destroyData();
} else if (process.argv[2] === '-i') {
    importData();
} else {
    console.log(`
Vui lòng chỉ định một hành động:
  -i : Nhập dữ liệu mẫu (sẽ xóa dữ liệu cũ trước)
  -d : Xóa toàn bộ dữ liệu trong các collection

Ví dụ: node seeder.js -i
    `.blue);
    process.exit(0);
}