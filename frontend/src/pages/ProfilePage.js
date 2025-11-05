import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Descriptions, Divider, Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [formInfo] = Form.useForm();
    const [formPassword] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            formInfo.setFieldsValue({
                fullName: user.full_name,
                phoneNumber: user.phone_number,
            });
        }
    }, [user, formInfo]);

    const handleUpdateInfo = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/profile', {
                full_name: values.fullName,
                phone_number: values.phoneNumber
            });
            message.success('Cập nhật thông tin thành công! Vui lòng đăng nhập lại để thấy thay đổi.');
            setTimeout(logout, 2000);
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại.');
        } finally {
            setLoading(false);
        }
    };

    // --- HÀM ĐỔI MẬT KHẨU ĐÃ ĐƯỢC CẬP NHẬT ---
    const handleChangePassword = async (values) => {
        setLoading(true);
        try {
            await api.put('/users/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            formPassword.resetFields();
            setTimeout(logout, 2000);
        } catch (error) {
            // Logic xử lý lỗi chi tiết
            const errorData = error.response?.data;

            if (errorData && errorData.errors) {
                // Nếu backend trả về lỗi có cấu trúc
                const formErrors = errorData.errors.map(err => ({
                    name: err.field, // Tên trường (vd: 'currentPassword')
                    errors: [err.message], // Mảng thông báo lỗi
                }));
                // Gán lỗi vào các trường tương ứng trên form
                formPassword.setFields(formErrors);
            } else {
                // Nếu là lỗi khác, hiển thị thông báo chung
                message.error(errorData?.message || 'Đổi mật khẩu thất bại.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <Spin tip="Đang tải..." />;
    }

    return (
        <div className="page-container">
            <h1>Trang cá nhân</h1>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card title="Thông tin Tài khoản" bordered={false}>
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Họ và tên">{user.full_name}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                            <Descriptions.Item label="Vai trò">{user.role}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card bordered={false}>
                        <Spin spinning={loading}>
                            <h2>Cập nhật thông tin</h2>
                            <Form
                                form={formInfo}
                                layout="vertical"
                                onFinish={handleUpdateInfo}
                            >
                                <Form.Item
                                    name="fullName"
                                    label="Họ và tên"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
                                </Form.Item>
                            </Form>

                            <Divider />

                            <h2>Thay đổi mật khẩu</h2>
                            <Form form={formPassword} layout="vertical" onFinish={handleChangePassword}>
                                <Form.Item
                                    name="currentPassword"
                                    label="Mật khẩu hiện tại"
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                                >
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item
                                    name="newPassword"
                                    label="Mật khẩu mới"
                                    dependencies={['currentPassword']}
                                    hasFeedback
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('currentPassword') !== value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu mới không được trùng với mật khẩu cũ!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item
                                    name="confirmPassword"
                                    label="Xác nhận mật khẩu mới"
                                    dependencies={['newPassword']}
                                    hasFeedback
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item>
                                    <Button htmlType="submit">Đổi mật khẩu</Button>
                                </Form.Item>
                            </Form>
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProfilePage;