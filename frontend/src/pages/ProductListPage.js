import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Input, Select, Popover, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons';
import api from '../services/api';
import { debounce } from 'lodash';
import { saveAs } from 'file-saver';

const { Search } = Input;

const ProductListPage = () => {
    const navigate = useNavigate();

    // --- Các State của Component ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ keyword: '', category: '' });
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [visiblePopoverId, setVisiblePopoverId] = useState(null);
    const [deleteStatus, setDeleteStatus] = useState({ id: null, loading: false, error: null });

    // --- Các Hàm xử lý ---

    // Hàm gọi API để lấy danh sách sản phẩm
    const fetchProducts = useCallback(async (page, pageSize, currentFilters) => {
        setLoading(true);
        try {
            const params = { page, pageSize, ...currentFilters };
            const { data } = await api.get('/products', { params });
            setProducts(data.products);
            setPagination({
                current: data.page,
                pageSize: pageSize,
                total: data.total,
            });
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);
            message.error("Lỗi khi tải danh sách sản phẩm.");
        } finally {
            setLoading(false);
        }
    }, []);

    // useEffect để lấy danh sách danh mục (chỉ chạy 1 lần)
    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data));
    }, []);

    // useEffect để fetch lại sản phẩm khi bộ lọc thay đổi
    useEffect(() => {
        fetchProducts(1, pagination.pageSize, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Hàm xử lý khi đổi trang hoặc pageSize trên bảng
    const handleTableChange = (newPagination) => {
        setPagination(prev => ({ ...prev, current: newPagination.current, pageSize: newPagination.pageSize }));
        fetchProducts(newPagination.current, newPagination.pageSize, filters);
    };

    // Sử dụng useRef để lưu trữ hàm debounce, tránh tạo lại sau mỗi lần render
    const debouncedSearch = useRef(
        debounce((nextValue) => {
            setFilters(prevFilters => ({
                ...prevFilters,
                keyword: nextValue,
            }));
        }, 500) // Thời gian chờ 500ms
    ).current;

    const handleSearchChange = (e) => {
        debouncedSearch(e.target.value);
    };

    const handleCategoryChange = (value) => {
        setFilters(prev => ({ ...prev, category: value || '' }));
    };

    // Xử lý xóa sản phẩm
    const handleDelete = async (id) => {
        setDeleteStatus({ id, loading: true, error: null });
        try {
            await api.delete(`/products/${id}`);
            message.success('Xóa sản phẩm thành công!');
            setVisiblePopoverId(null);
            await fetchProducts(pagination.current, pagination.pageSize, filters);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Xóa thất bại!';
            setDeleteStatus({ id, loading: false, error: errorMessage });
        }
    };

    // Quản lý đóng/mở Popover
    const handleVisibleChange = (visible, id) => {
        if (visible) {
            setVisiblePopoverId(id);
            setDeleteStatus({ id: null, loading: false, error: null });
        } else {
            setVisiblePopoverId(null);
        }
    };

    // Xử lý xuất file Excel
    const handleExport = async () => {
        message.loading({ content: 'Đang xuất file...', key: 'export_products' });
        try {
            const response = await api.get('/products/export', { responseType: 'blob' });
            saveAs(new Blob([response.data]), 'Danh_sach_san_pham.xlsx');
            message.success({ content: 'Xuất file thành công!', key: 'export_products', duration: 2 });
        } catch (error) {
            message.error({ content: 'Xuất file thất bại!', key: 'export_products', duration: 2 });
        }
    };

    // --- Cấu hình các cột cho Bảng ---
    const columns = [
        { title: 'Sản phẩm', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Tồn kho', dataIndex: 'total_stock', key: 'total_stock', align: 'right', sorter: (a, b) => a.total_stock - b.total_stock },
        { title: 'Loại', dataIndex: 'category', key: 'category', render: (category) => <Tag color="cyan">{category?.name || 'Chưa phân loại'}</Tag> },
        { title: 'Nhãn hiệu', dataIndex: 'brand', key: 'brand' },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (text) => new Date(text).toLocaleDateString('vi-VN') },
        {
            title: 'Hành động', key: 'action', align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/admin/products/edit/${record._id}`)}
                    />
                    <Popover
                        content={
                            <div style={{ width: 250 }}>
                                <p>Bạn có muốn xóa sản phẩm này không?</p>
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
                                            Xác nhận
                                        </Button>
                                    </Space>
                                </div>
                            </div>
                        }
                        title="Xác nhận Xóa"
                        trigger="click"
                        open={visiblePopoverId === record._id}
                        onOpenChange={(visible) => handleVisibleChange(visible, record._id)}
                        placement="leftTop"
                    >
                        <Button size="small" icon={<DeleteOutlined />} danger />
                    </Popover>
                </Space>
            ),
        },
    ];

    // --- Giao diện trả về ---
    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 24 }}>Quản lý Sản phẩm</h1>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <Space>
                    <Search
                        placeholder="Tìm theo tên hoặc SKU..."
                        onChange={handleSearchChange}
                        style={{ width: 300 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo danh mục"
                        style={{ width: 200 }}
                        onChange={handleCategoryChange}
                        allowClear
                        options={categories.map(cat => ({ label: cat.name, value: cat._id }))}
                    />
                </Space>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/products/add')}
                    >
                        Thêm sản phẩm
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>
                        Xuất file
                    </Button>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={products}
                rowKey="_id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                bordered
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};

export default ProductListPage;