import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Select,
    InputNumber,
    Input,
    Button,
    message,
    Spin,
    Radio,
    Space,
    Divider,
    Typography
} from 'antd';
import api from '../services/api';
import { debounce } from 'lodash';

const { Option } = Select;
const { Text } = Typography;

/**
 * Modal để tạo phiếu Nhập/Xuất kho.
 * @param {object} props
 * @param {boolean} props.open - Prop để điều khiển việc đóng/mở Modal.
 * @param {'IN' | 'OUT'} props.type - Loại giao dịch.
 * @param {function} props.onClose - Hàm được gọi khi nhấn nút Hủy hoặc đóng Modal.
 * @param {function} props.onSuccess - Hàm được gọi khi tạo phiếu thành công.
 */
const InventoryTransactionModal = ({ open, type, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // State để điều khiển giao diện form động
    const [isNewProduct, setIsNewProduct] = useState(false);

    // State cho việc tìm kiếm và chọn sản phẩm
    const [products, setProducts] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // State để tính toán tổng tiền
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(0);

    // Reset toàn bộ state khi modal được mở lại
    useEffect(() => {
        if (open) {
            form.resetFields();
            form.setFieldsValue({ isNewProduct: false });
            setIsNewProduct(false);
            setProducts([]);
            setSearching(false);
            setSelectedProduct(null);
            setPrice(0);
            setQuantity(0);
        }
    }, [open, form]);

    // Hàm tìm kiếm sản phẩm với debounce để tránh gọi API liên tục
    const searchProducts = debounce(async (keyword) => {
        if (!keyword) {
            setProducts([]);
            return;
        };
        setSearching(true);
        try {
            const { data } = await api.get('/products', { params: { keyword, pageSize: 20 } });
            setProducts(data.products);
        } catch (error) {
            console.error("Lỗi tìm kiếm sản phẩm:", error);
        } finally {
            setSearching(false);
        }
    }, 500);

    // Xử lý khi người dùng chọn một sản phẩm từ danh sách tìm kiếm
    const handleProductChange = (productId) => {
        form.setFieldsValue({ variant: undefined }); // Reset ô chọn phiên bản
        const selected = products.find(p => p._id === productId);
        setSelectedProduct(selected);
        // Reset giá và số lượng khi đổi sản phẩm
        setPrice(0);
    };

    // Xử lý khi người dùng chọn một phiên bản của sản phẩm
    const handleVariantChange = (variantId) => {
        if (!selectedProduct) return;
        const variant = selectedProduct.variants.find(v => v._id === variantId);
        // Cập nhật giá khi chọn phiên bản
        setPrice(variant ? variant.price : 0);
    };

    // Cập nhật giá khi người dùng nhập giá cho sản phẩm mới
    const handleNewProductPriceChange = (value) => {
        setPrice(value || 0);
    };

    // Hàm được gọi khi form được submit
    const handleFinish = async (values) => {
        setLoading(true);
        const payload = {
            type, // 'IN' hoặc 'OUT'
            quantity: values.quantity,
            notes: values.notes,
            isNewProduct: values.isNewProduct,
            total_amount: price * (values.quantity || 0), // Tính tổng tiền
        };

        if (values.isNewProduct) {
            payload.newProductData = values.newProductData;
        } else {
            payload.product = values.product;
            payload.variant = values.variant;
        }

        try {
            await api.post('/inventory', payload);
            message.success('Yêu cầu đã được gửi đi thành công!');
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Giao dịch thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={type === 'IN' ? 'Tạo Phiếu Nhập Kho' : 'Tạo Phiếu Xuất Kho'}
            onCancel={onClose}
            width={600}
            destroyOnClose
            footer={[
                <Button key="back" onClick={onClose}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                    Gửi yêu cầu
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ isNewProduct: false }}>

                {/* Chỉ cho phép tạo sản phẩm mới khi NHẬP KHO */}
                {type === 'IN' && (
                    <Form.Item name="isNewProduct">
                        <Radio.Group onChange={(e) => setIsNewProduct(e.target.value)}>
                            <Radio value={false}>Sản phẩm đã có</Radio>
                            <Radio value={true}>Sản phẩm mới</Radio>
                        </Radio.Group>
                    </Form.Item>
                )}

                <Divider />

                {/* --- KHỐI FORM CHO SẢN PHẨM ĐÃ CÓ --- */}
                {!isNewProduct && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            name="product"
                            label="Tìm kiếm và chọn sản phẩm"
                            rules={[{ required: !isNewProduct, message: 'Vui lòng chọn sản phẩm!' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Gõ để tìm kiếm sản phẩm..."
                                onSearch={searchProducts}
                                onChange={handleProductChange}
                                filterOption={false}
                                notFoundContent={searching ? <Spin size="small" /> : null}
                            >
                                {products.map(p => <Option key={p._id} value={p._id}>{p.name} (Tồn: {p.total_stock})</Option>)}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="variant"
                            label="Chọn phiên bản"
                            rules={[{ required: !isNewProduct, message: 'Vui lòng chọn phiên bản!' }]}
                        >
                            <Select placeholder="Chọn phiên bản" disabled={!selectedProduct} onChange={handleVariantChange}>
                                {selectedProduct?.variants.map(v => <Option key={v._id} value={v._id}>{v.name} (Giá: {v.price.toLocaleString()} VNĐ)</Option>)}
                            </Select>
                        </Form.Item>
                    </Space>
                )}

                {/* --- KHỐI FORM CHO SẢN PHẨM MỚI --- */}
                {isNewProduct && type === 'IN' && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item name={['newProductData', 'name']} label="Tên sản phẩm mới" rules={[{ required: isNewProduct }]}>
                            <Input placeholder="Ví dụ: Samsung Galaxy S25" />
                        </Form.Item>
                        <Space style={{width: '100%'}} align="baseline">
                            <Form.Item name={['newProductData', 'categoryName']} label="Tên danh mục" rules={[{ required: isNewProduct }]} style={{width: '50%'}}>
                                <Input placeholder="Ví dụ: Điện thoại" />
                            </Form.Item>
                            <Form.Item name={['newProductData', 'brand']} label="Nhãn hiệu" style={{width: '50%'}}>
                                <Input placeholder="Ví dụ: Samsung" />
                            </Form.Item>
                        </Space>
                        <Divider>Thông tin phiên bản mới</Divider>
                        <Form.Item name={['newProductData', 'variantData', 'name']} label="Tên phiên bản" rules={[{ required: isNewProduct }]}>
                            <Input placeholder="Ví dụ: 512GB - Xanh Titan" />
                        </Form.Item>
                        <Space style={{width: '100%'}} align="baseline">
                            <Form.Item name={['newProductData', 'variantData', 'sku']} label="Mã SKU" rules={[{ required: isNewProduct }]} style={{width: '50%'}}>
                                <Input placeholder="Ví dụ: SS25-512-BLU" />
                            </Form.Item>
                            <Form.Item name={['newProductData', 'variantData', 'price']} label="Giá bán/nhập" rules={[{ required: isNewProduct }]} style={{width: '50%'}}>
                                <InputNumber style={{ width: '100%' }} placeholder="Giá" onChange={handleNewProductPriceChange} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Space>
                    </Space>
                )}

                <Divider />

                <Form.Item
                    name="quantity"
                    label={type === 'IN' ? "Số lượng nhập" : "Số lượng xuất"}
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }, { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }]}
                >
                    <InputNumber style={{ width: '100%' }} placeholder="Nhập số lượng..." onChange={(value) => setQuantity(value || 0)} />
                </Form.Item>

                {/* --- HIỂN THỊ TỔNG TIỀN ĐỘNG --- */}
                <Form.Item label="Tổng tiền">
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                        {(price * quantity).toLocaleString('vi-VN')} VNĐ
                    </Text>
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                    <Input.TextArea rows={3} placeholder={type === 'IN' ? 'Ví dụ: Nhập từ nhà cung cấp XYZ' : 'Ví dụ: Bán lẻ cho khách hàng A'} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default InventoryTransactionModal;