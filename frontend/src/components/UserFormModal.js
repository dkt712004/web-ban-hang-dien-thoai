import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import api from '../services/api';

const { Option } = Select;

/**
 * Modal Form để Thêm hoặc Sửa thông tin người dùng.
 * @param {object} props
 * @param {boolean} props.open - Prop để điều khiển việc đóng/mở Modal.
 * @param {function} props.onCancel - Hàm được gọi khi nhấn nút Hủy hoặc đóng Modal.
 * @param {function} props.onSuccess - Hàm được gọi khi Thêm/Sửa thành công, để component cha có thể tải lại dữ liệu.
 * @param {object|null} props.initialValues - Dữ liệu ban đầu của người dùng. Nếu là `null`, form sẽ ở chế độ Thêm mới.
 * @param {Array} props.roles - Mảng chứa danh sách các vai trò để hiển thị trong Select.
 */
const UserFormModal = ({ open, onCancel, onSuccess, initialValues, roles }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Sử dụng useEffect để điền dữ liệu vào form một cách chính xác
    // Nó sẽ chạy mỗi khi modal được mở (prop 'open' thay đổi)
    useEffect(() => {
        if (open) {
            if (initialValues) {
                // Chế độ Sửa: điền dữ liệu vào các trường.
                // Lưu ý: role được lấy từ `initialValues.role._id`
                form.setFieldsValue({
                    ...initialValues,
                    role_id: initialValues.role?._id,
                });
            } else {
                // Chế độ Thêm mới: xóa sạch dữ liệu của các lần mở trước.
                form.resetFields();
            }
        }
    }, [open, initialValues, form]);

    // Hàm được gọi khi người dùng submit form (sau khi validate thành công)
    const onFinish = async (values) => {
        setLoading(true); // Bật trạng thái loading cho nút submit
        try {
            if (initialValues) {
                // Chế độ Sửa: Gọi API PUT
                await api.put(`/users/${initialValues._id}`, values);
                message.success('Cập nhật người dùng thành công!');
            } else {
                // Chế độ Thêm mới: Gọi API POST
                await api.post('/users', values);
                message.success('Thêm người dùng thành công!');
            }
            // Gọi hàm onSuccess để thông báo cho component cha
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            // Xử lý lỗi trả về từ API
            const errorData = error.response?.data;
            if (errorData && errorData.errors) {
                // Nếu backend trả về lỗi có cấu trúc (cho từng trường)
                const formErrors = errorData.errors.map(err => ({
                    name: err.field,      // Tên trường bị lỗi, ví dụ: 'email'
                    errors: [err.message], // Mảng thông báo lỗi
                }));
                // Gán lỗi trực tiếp vào các trường của form
                form.setFields(formErrors);
            } else {
                // Nếu là lỗi chung, hiển thị thông báo
                message.error(errorData?.message || 'Thao tác thất bại!');
            }
        } finally {
            setLoading(false); // Tắt loading dù thành công hay thất bại
        }
    };

    return (
        <Modal
            open={open}
            title={initialValues ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            onCancel={onCancel}
            // Sử dụng footer tùy chỉnh để có thể điều khiển nút submit
            footer={[
                <Button key="back" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    // Khi nhấn nút này, nó sẽ trigger sự kiện onFinish của Form
                    onClick={() => form.submit()}
                >
                    {initialValues ? 'Cập nhật' : 'Tạo'}
                </Button>,
            ]}
        >
            {/* Component Form của AntD, kết nối với hook và hàm onFinish */}
            <Form form={form} layout="vertical" name="user_form" onFinish={onFinish}>
                <Form.Item
                    name="full_name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                >
                    <Input placeholder="Nhập họ và tên" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                >
                    <Input placeholder="Nhập email" />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={initialValues ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                    // Mật khẩu chỉ bắt buộc khi ở chế độ thêm mới
                    rules={[{ required: !initialValues, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                    <Input.Password placeholder={initialValues ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'} />
                </Form.Item>

                <Form.Item
                    name="role_id" // Tên này phải khớp với payload mà API mong đợi
                    label="Vai trò"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                >
                    <Select placeholder="Chọn một vai trò">
                        {/* Kiểm tra roles có tồn tại trước khi map để tránh lỗi */}
                        {(roles || []).map(role => (
                            <Option key={role._id} value={role._id}>
                                {role.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UserFormModal;