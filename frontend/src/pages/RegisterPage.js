// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Row, Col, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../services/api';

const RegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm(); // Sử dụng Form hook của AntD

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Gọi API đăng ký
            await api.post('/auth/register', {
                full_name: values.fullName,
                email: values.email,
                password: values.password,
                phone_number: values.phoneNumber,
            });
            message.success('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
            // Chuyển hướng đến trang đăng nhập sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            message.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row
            justify="center"
            align="middle"
            style={{ minHeight: '100vh', background: '#f0f2f5' }}
        >
            <Col xs={22} sm={16} md={12} lg={10} xl={8}>
                <Card title={<h2 style={{ textAlign: 'center', margin: 0 }}>Tạo tài khoản mới</h2>} bordered={false}>
                    <Form
                        form={form} // Gắn form hook vào Form
                        name="register"
                        onFinish={onFinish}
                        scrollToFirstError
                        size="large"
                    >
                        <Form.Item
                            name="fullName"
                            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!', whitespace: true }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { type: 'email', message: 'Email không hợp lệ!' },
                                { required: true, message: 'Vui lòng nhập Email!' },
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="phoneNumber"
                            rules={[{ required: false }]} // Không bắt buộc
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại (tùy chọn)" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                            hasFeedback // Hiển thị icon feedback (dấu tick hoặc x)
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']} // Phụ thuộc vào trường 'password'
                            hasFeedback
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Hai mật khẩu bạn đã nhập không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                                Đăng ký
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center' }}>
                            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                        </div>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default RegisterPage;