// src/components/ProductForm.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Space, InputNumber, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const ProductForm = ({ onFinish, initialValues }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Tải danh sách category để điền vào Select
        api.get('/categories').then(res => setCategories(res.data));
    }, []);

    useEffect(() => {
        // Điền dữ liệu vào form khi ở chế độ sửa
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="image" label="URL Hình ảnh" rules={[{ required: true, type: 'url' }]}>
                <Input />
            </Form.Item>
            <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
                <Select placeholder="Chọn danh mục">
                    {categories.map(cat => <Option key={cat._id} value={cat._id}>{cat.name}</Option>)}
                </Select>
            </Form.Item>
            <Form.Item name="brand" label="Nhãn hiệu">
                <Input />
            </Form.Item>

            <h3>Các phiên bản sản phẩm</h3>
            <Form.List name="variants" rules={[{ required: true, message: 'Cần ít nhất một phiên bản' }]}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true }]}>
                                    <Input placeholder="Tên phiên bản (vd: Đỏ)" />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, 'sku']} rules={[{ required: true }]}>
                                    <Input placeholder="Mã SKU" />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true }]}>
                                    <InputNumber placeholder="Giá" style={{ width: '100%' }} />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, 'stock_quantity']} rules={[{ required: true }]}>
                                    <InputNumber placeholder="Tồn kho" style={{ width: '100%' }} />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                Thêm phiên bản
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>

            <Form.Item>
                <Button type="primary" htmlType="submit">
                    {initialValues ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ProductForm;