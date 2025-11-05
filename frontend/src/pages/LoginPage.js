import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Row, Col, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [form] = Form.useForm(); // Lấy instance của form để có thể thao tác với nó

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            message.success('Đăng nhập thành công!');
        } catch (error) {
            // --- LOGIC XỬ LÝ LỖI MỚI ---
            const errorData = error.response?.data;

            if (errorData && errorData.errors) {
                // Nếu có mảng 'errors' từ backend
                const formErrors = errorData.errors.map(err => ({
                    name: err.field, // Tên trường (vd: 'email', 'password')
                    errors: [err.message], // Mảng thông báo lỗi
                }));

                // Dùng form.setFields() để gán lỗi vào các trường tương ứng
                form.setFields(formErrors);

            } else {
                // Nếu không có cấu trúc lỗi chi tiết, hiển thị thông báo chung
                message.error(errorData?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
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
            <Col xs={22} sm={16} md={12} lg={8} xl={6}>
                <Card title={<h2 style={{ textAlign: 'center', margin: 0 }}>Đăng nhập hệ thống</h2>} variant="borderless">
                    <Form
                        form={form} // 1. Gắn instance 'form' vào component Form
                        name="normal_login"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập Email!' },
                                { type: 'email', message: 'Email không hợp lệ!' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="Email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                type="password"
                                placeholder="Mật khẩu"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                            </Form.Item>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                                Đăng nhập
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center' }}>
                            Hoặc <Link to="/register">đăng ký ngay!</Link>
                        </div>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default LoginPage;