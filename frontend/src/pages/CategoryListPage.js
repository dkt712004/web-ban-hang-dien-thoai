import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Popover, message } from 'antd';
import { PlusOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';
import { saveAs } from 'file-saver';
import CategoryFormModal from '../components/CategoryFormModal';

const { Search } = Input;

const CategoryListPage = () => {
    // --- Các State của Component ---
    const [categories, setCategories] = useState([]); // State lưu danh sách danh mục
    const [loading, setLoading] = useState(true); // State loading cho toàn bộ bảng

    // State cho Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // Lưu thông tin danh mục đang sửa
    const [modalLoading, setModalLoading] = useState(false); // State loading cho nút submit trong modal

    // State cho Popover Xóa
    const [visiblePopoverId, setVisiblePopoverId] = useState(null); // Lưu ID của hàng có popover đang mở
    const [deleteStatus, setDeleteStatus] = useState({ id: null, loading: false, error: null }); // Quản lý trạng thái xóa cho từng hàng

    // --- Các Hàm xử lý ---

    // Hàm gọi API để lấy danh sách danh mục
    const fetchCategories = async (keyword = '') => {
        setLoading(true);
        try {
            const { data } = await api.get('/categories', { params: { keyword } });
            setCategories(data);
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
            message.error("Không thể tải danh sách danh mục.");
        } finally {
            setLoading(false);
        }
    };

    // Gọi fetchCategories khi component được mount lần đầu
    useEffect(() => {
        fetchCategories();
    }, []);

    // Xử lý khi người dùng nhấn tìm kiếm
    const handleSearch = (value) => {
        fetchCategories(value);
    };

    // Mở modal ở chế độ "Thêm mới"
    const handleAdd = () => {
        setEditingCategory(null); // Đảm bảo không có dữ liệu cũ
        setIsModalOpen(true);
    };

    // Mở modal ở chế độ "Sửa" và truyền dữ liệu của hàng được chọn
    const handleEdit = (record) => {
        setEditingCategory(record);
        setIsModalOpen(true);
    };

    // Xử lý khi người dùng xác nhận xóa trong Popover
    const handleDelete = async (id) => {
        setDeleteStatus({ id, loading: true, error: null }); // Bật loading cho nút xóa
        try {
            await api.delete(`/categories/${id}`);
            message.success('Xóa danh mục thành công!');
            setVisiblePopoverId(null); // Đóng popover lại
            await fetchCategories(); // Tải lại danh sách danh mục
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Xóa thất bại!';
            // Cập nhật state để hiển thị lỗi trong Popover
            setDeleteStatus({ id, loading: false, error: errorMessage });
        }
    };

    // Xử lý khi submit form trong Modal (Thêm hoặc Sửa)
    const handleModalFinish = async (values) => {
        setModalLoading(true);
        try {
            if (editingCategory) {
                // Chế độ Sửa
                await api.put(`/categories/${editingCategory._id}`, values);
                message.success('Cập nhật thành công!');
            } else {
                // Chế độ Thêm mới
                await api.post('/categories', values);
                message.success('Thêm thành công!');
            }
            setIsModalOpen(false);
            await fetchCategories();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại!');
        } finally {
            setModalLoading(false);
        }
    };

    // Xử lý xuất file Excel
    const handleExportExcel = async () => {
        message.loading({ content: 'Đang xuất file...', key: 'export_categories' });
        try {
            const response = await api.get('/categories/export', { responseType: 'blob' });
            saveAs(new Blob([response.data]), "Danh_muc_san_pham.xlsx");
            message.success({ content: 'Xuất file thành công!', key: 'export_categories', duration: 2 });
        } catch (error) {
            message.error({ content: 'Lỗi khi xuất file Excel.', key: 'export_categories', duration: 3 });
        }
    };

    // Xử lý khi đóng/mở Popover
    const handleVisibleChange = (visible, id) => {
        if (visible) {
            setVisiblePopoverId(id);
            // Reset trạng thái lỗi của lần xóa trước khi mở popover mới
            setDeleteStatus({ id: null, loading: false, error: null });
        } else {
            // Nếu người dùng nhấn ra ngoài để đóng, cũng reset state
            setVisiblePopoverId(null);
        }
    };


    // --- Cấu hình các cột cho Bảng ---
    const columns = [
        { title: 'Danh mục', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Số lượng sản phẩm', dataIndex: 'productCount', key: 'productCount', sorter: (a, b) => a.productCount - b.productCount, align: 'right' },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (text) => new Date(text).toLocaleDateString('vi-VN') },
        {
            title: 'Hành động', key: 'action', align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
                    <Popover
                        content={
                            <div style={{ width: 250 }}>
                                <p>Bạn có chắc chắn muốn xóa danh mục này không?</p>
                                {deleteStatus.error && deleteStatus.id === record._id && (
                                    <p style={{ color: 'red', marginTop: 8 }}>{deleteStatus.error}</p>
                                )}
                                <div style={{ textAlign: 'right', marginTop: 12 }}>
                                    <Space>
                                        <Button size="small" onClick={() => handleVisibleChange(false, record._id)}>Hủy</Button>
                                        <Button
                                            size="small"
                                            type="primary"
                                            danger
                                            onClick={() => handleDelete(record._id)}
                                            loading={deleteStatus.loading && deleteStatus.id === record._id}
                                        >
                                            Xác nhận Xóa
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        }
                        title="Xác nhận"
                        trigger="click"
                        open={visiblePopoverId === record._id}
                        onOpenChange={(visible) => handleVisibleChange(visible, record._id)}
                        placement="leftTop"
                    >
                        <Button icon={<DeleteOutlined />} danger>Xóa</Button>
                    </Popover>
                </Space>
            ),
        },
    ];

    // --- Giao diện trả về ---
    return (
        <div className="page-container">
            <h1>Quản lý Danh mục sản phẩm</h1>
            <Space style={{ marginBottom: 16 }}>
                <Search placeholder="Tìm kiếm danh mục..." onSearch={handleSearch} style={{ width: 300 }} allowClear />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm danh mục</Button>
                <Button icon={<ExportOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
            </Space>
            <Table
                columns={columns}
                dataSource={categories}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                bordered
            />
            <CategoryFormModal
                open={isModalOpen}
                onFinish={handleModalFinish}
                onCancel={() => setIsModalOpen(false)}
                initialValues={editingCategory}
                loading={modalLoading}
            />
        </div>
    );
};

export default CategoryListPage;