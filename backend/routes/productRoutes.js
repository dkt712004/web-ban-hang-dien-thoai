const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    exportProducts,
    importProducts
} = require('../controllers/productController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { protectCsrf } = require('../middlewares/csrfMiddleware'); // 1. Import
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 2. Áp dụng protectCsrf cho route POST
router.route('/')
    .get(getProducts)
    .post(protect, isAdmin, protectCsrf, createProduct);

// Route GET không cần bảo vệ
router.get('/export', protect, isAdmin, exportProducts);

// 3. Áp dụng protectCsrf cho route POST (import)
router.post('/import', protect, isAdmin, upload.single('file'), protectCsrf, importProducts);

// 4. Áp dụng protectCsrf cho route PUT và DELETE
router.route('/:id')
    .get(getProductById)
    .put(protect, isAdmin, protectCsrf, updateProduct)
    .delete(protect, isAdmin, protectCsrf, deleteProduct);

module.exports = router;