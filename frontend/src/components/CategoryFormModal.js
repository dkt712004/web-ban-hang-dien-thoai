import React, { useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd'; // 1. Import thêm Button

// 2. Nhận các props mới:
//    - 'open' (được đổi tên thành 'isOpen' để tránh lỗi ESLint)
//    - 'loading' để quản lý trạng thái của nút submit
const CategoryFormModal = ({ open: isOpen, onFinish, onCancel, initialValues, loading }) => {
    // 3. Sử dụng hook useForm để có thể điều khiển form
    const [form] = Form.useForm();

    // 4. Cải tiến useEffect để xử lý cả việc điền dữ liệu và reset form
    useEffect(() => {
        // Chỉ thực hiện logic khi modal được mở
        if (isOpen) {
            if (initialValues) {
                // Nếu có initialValues (chế độ Sửa), điền dữ liệu vào form
                form.setFieldsValue(initialValues);
            } else {
                // Nếu không có (chế độ Thêm mới), xóa sạch dữ liệu của lần mở trước
                form.resetFields();
            }
        }
    }, [isOpen, initialValues, form]); // useEffect sẽ chạy lại khi một trong các giá trị này thay đổi

    // Hàm được gọi khi nhấn nút OK
    const handleOk = () => {
        form
            .validateFields() // Kiểm tra xem các trường đã hợp lệ chưa
            .then(values => {
                // Không reset form ở đây, để component cha quyết định
                onFinish(values); // Gửi dữ liệu đã được validate ra ngoài
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        // 5. Sử dụng prop 'open' với giá trị là biến 'isOpen'
        <Modal
            open={isOpen}
            title={initialValues ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            onCancel={onCancel}
            // 6. Sử dụng footer tùy chỉnh để có nút loading
            footer={[
                <Button key="back" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading} // Trạng thái loading được truyền từ component cha
                    onClick={handleOk}
                >
                    {initialValues ? 'Cập nhật' : 'Tạo'}
                </Button>,
            ]}
        >
            {/* 7. Gắn instance 'form' vào component Form */}
            <Form form={form} layout="vertical" name="category_form_in_modal">
                <Form.Item
                    name="name"
                    label="Tên danh mục"
                    rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={4} placeholder="Nhập mô tả ngắn (tùy chọn)" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CategoryFormModal;