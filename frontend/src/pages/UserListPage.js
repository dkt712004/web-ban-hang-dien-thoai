import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import UserFormModal from '../components/UserFormModal'; // Import component Modal
// (Tùy chọn) Nếu bạn muốn thêm chức năng tìm kiếm sau này

const UserListPage = () => {
    // --- Các State của Component ---
    const [users, setUsers] = useState([]); // State lưu danh sách người dùng
    const [roles, setRoles] = useState([]); // State lưu danh sách các vai trò (để lọc và cho form)
    const [loading, setLoading] = useState(true); // State loading cho bảng

    // State cho Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Lưu thông tin user đang sửa

    // --- Các Hàm xử lý ---

    // Hàm gọi API để lấy dữ liệu (cả users và roles)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Sử dụng Promise.all để gọi 2 API song song, tăng hiệu suất
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles') // API này cần được tạo ở backend để lấy danh sách vai trò
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            message.error("Không thể tải dữ liệu người dùng và vai trò.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Tải dữ liệu khi component được mount lần đầu
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Mở modal ở chế độ "Thêm mới"
    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    // Mở modal ở chế độ "Sửa" và truyền dữ liệu của hàng được chọn
    const handleEdit = (record) => {
        setEditingUser(record);
        setIsModalOpen(true);
    };

    // Xử lý khi xác nhận xóa người dùng
    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            message.success('Xóa người dùng thành công!');
            await fetchData(); // Tải lại danh sách sau khi xóa
        } catch (error) {
            message.error(error.response?.data?.message || 'Xóa thất bại!');
        }
    };

    // Hàm được gọi khi Modal Thêm/Sửa thành công
    const handleSuccess = () => {
        setIsModalOpen(false); // Đóng modal
        setEditingUser(null);  // Reset user đang sửa
        fetchData();          // Tải lại dữ liệu để cập nhật bảng
    };

    // --- Cấu hình các cột cho Bảng ---
    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            sorter: (a, b) => a.full_name.localeCompare(b.full_name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            // Render thẻ Tag với màu sắc khác nhau cho từng vai trò
            render: (role) => {
                let color = 'default';
                if (role?.name.toLowerCase() === 'admin') color = 'volcano';
                if (role?.name.toLowerCase() === 'nhân viên kho') color = 'geekblue';
                return (
                    <Tag color={color}>
                        {role?.name?.toUpperCase() || 'CHƯA CÓ'}
                    </Tag>
                );
            },
            // Tạo bộ lọc cho cột vai trò
            filters: roles.map(role => ({ text: role.name, value: role._id })),
            onFilter: (value, record) => record.role?._id === value,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc muốn xóa người dùng này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        placement="left"
                    >
                        <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 24 }}>Quản lý Người dùng</h1>
            <Space style={{ marginBottom: 16 }}>
                {/* <Search placeholder="Tìm kiếm người dùng..." style={{ width: 300 }} disabled /> */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Thêm người dùng
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                bordered
            />

            {/* Component Modal được gọi ở đây */}
            <UserFormModal
                open={isModalOpen}
                onSuccess={handleSuccess}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                }}
                initialValues={editingUser}
                roles={roles} // Truyền danh sách vai trò xuống cho Modal
            />
        </div>
    );
};

export default UserListPage;