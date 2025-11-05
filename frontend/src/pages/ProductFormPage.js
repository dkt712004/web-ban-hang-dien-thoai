// src/pages/ProductFormPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, Space, InputNumber, message, Spin } from 'antd';
import { MinusCircleOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const ProductFormPage = () => {
    const [form] = Form.useForm();
    const { id } = useParams(); // Lấy 'id' từ URL, ví dụ: /products/edit/:id
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const isEditing = !!id; // Biến boolean để kiểm tra chế độ Sửa hay Thêm

    // Lấy danh sách danh mục và dữ liệu sản phẩm (nếu đang sửa)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Lấy danh sách danh mục
                const categoriesRes = await api.get('/categories');
                setCategories(categoriesRes.data);

                // Nếu là chế độ sửa, lấy thông tin sản phẩm
                if (isEditing) {
                    const productRes = await api.get(`/products/${id}`);
                    form.setFieldsValue(productRes.data); // Điền dữ liệu vào form
                }
            } catch (error) {
                message.error("Lỗi khi tải dữ liệu!");
                navigate('/admin/products');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isEditing, form, navigate]);

    // Hàm được gọi khi submit form
    const onFinish = async (values) => {
        setLoading(true);
        try {
            if (isEditing) {
                // Gọi API cập nhật
                await api.put(`/products/${id}`, values);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                // Gọi API tạo mới
                await api.post('/products', values);
                message.success('Tạo sản phẩm thành công!');
            }
            navigate('/admin/products'); // Quay về trang danh sách sau khi thành công
        } catch (error) {
            message.error("Thao tác thất bại: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff', padding: 24 }}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '24px'}}>
                <Button
                    icon={<ArrowLeftOutlined/>}
                    onClick={() => navigate('/admin/products')}
                    style={{marginRight: '16px'}}
                />
                <h1>{!!id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h1>
            </div>
            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={onFinish} style={{maxWidth: 800, margin: '0 auto'}}>
                    <Form.Item name="name" label="Tên sản phẩm"
                               rules={[{required: true, message: 'Vui lòng nhập tên!'}]}>
                        <Input/>
                    </Form.Item>
                    <Space style={{ display: 'flex' }} align="baseline">
                        <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]} style={{width: 385}}>
                            <Select placeholder="Chọn danh mục">
                                {categories.map(cat => <Option key={cat._id} value={cat._id}>{cat.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="brand" label="Nhãn hiệu" style={{width: 385}}>
                            <Input />
                        </Form.Item>
                    </Space>

                    <h3 style={{ marginTop: 20 }}>Các phiên bản sản phẩm</h3>
                    <Form.List name="variants" rules={[{ required: true, message: 'Cần ít nhất một phiên bản' }]}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true }]} noStyle><Input placeholder="Tên phiên bản" /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'sku']} rules={[{ required: true }]} noStyle><Input placeholder="Mã SKU" /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]} noStyle><InputNumber placeholder="Giá" style={{ width: '100%' }} /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'stock_quantity']} rules={[{ required: true }]} noStyle><InputNumber placeholder="Tồn kho" style={{ width: '100%' }} /></Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm phiên bản</Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit">
                            {isEditing ? 'Cập nhật' : 'Tạo sản phẩm'}
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </div>
    );
};

export default ProductFormPage;