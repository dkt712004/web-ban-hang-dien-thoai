import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, message, Drawer, Descriptions, Input } from 'antd';
import {
    EyeOutlined,
    ArrowDownOutlined,
    ArrowUpOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import InventoryTransactionModal from '../components/InventoryTransactionModal';

const InventoryHistoryPage = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State cho Drawer chi tiết ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // --- State cho Modal tạo phiếu ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState('IN');

    // Hàm gọi API để lấy lịch sử giao dịch
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/inventory');
            setTransactions(data);
        } catch (error) {
            console.error("Lỗi tải lịch sử kho:", error);
            message.error("Không thể tải lịch sử giao dịch kho.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Tải dữ liệu khi component được mount lần đầu
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // --- Các hàm xử lý cho Drawer Chi tiết ---
    const showDrawer = (record) => {
        setSelectedTransaction(record);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedTransaction(null);
        setRejectionReason('');
    };

    const handleReview = async (newStatus) => {
        if (!selectedTransaction) return;
        setReviewLoading(true);
        const payload = {
            status: newStatus,
            rejectionReason: newStatus === 'Rejected' ? rejectionReason : undefined,
        };
        try {
            await api.put(`/inventory/${selectedTransaction._id}/review`, payload);
            message.success('Thao tác thành công!');
            closeDrawer();
            await fetchTransactions();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setReviewLoading(false);
        }
    };

    // --- Các hàm xử lý cho Modal Tạo phiếu ---
    const showCreateModal = (type) => {
        setTransactionType(type);
        setIsCreateModalOpen(true);
    };

    // --- Cấu hình các cột cho Bảng ---
    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString('vi-VN')
        },
        { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
        { title: 'Phiên bản', dataIndex: 'variantName', key: 'variantName' },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (<Tag color={type === 'IN' ? 'green' : 'red'}>{type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO'}</Tag>)
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right'
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            // Định dạng số tiền cho dễ đọc
            render: (amount) => `${(amount || 0).toLocaleString('vi-VN')} VNĐ`
        },
        {
            title: 'Người tạo',
            dataIndex: 'user',
            key: 'user',
            render: (user) => user?.full_name || 'Không xác định'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const color = status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : 'error';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); showDrawer(record); }}>
                    Xem
                </Button>
            ),
        }
    ];

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: 24 }}>Lịch sử Nhập/Xuất kho</h1>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<ArrowDownOutlined />} onClick={() => showCreateModal('IN')}>Nhập kho</Button>
                <Button type="primary" danger icon={<ArrowUpOutlined />} onClick={() => showCreateModal('OUT')}>Xuất kho</Button>
            </Space>

            <Table
                columns={columns}
                dataSource={transactions}
                rowKey="_id"
                loading={loading}
                bordered
                onRow={(record) => ({ onClick: () => showDrawer(record), style: { cursor: 'pointer' } })}
            />

            {/* Drawer hiển thị chi tiết khi click vào một hàng */}
            {selectedTransaction && (
                <Drawer
                    title={`Chi tiết phiếu ${selectedTransaction.type === 'IN' ? 'Nhập' : 'Xuất'} Kho`}
                    width={500}
                    onClose={closeDrawer}
                    open={isDrawerOpen}
                    styles={{ body: { paddingBottom: 80 } }}
                    // Footer chỉ hiển thị cho Admin và khi phiếu đang ở trạng thái 'Pending'
                    footer={
                        user?.role.toLowerCase() === 'admin' && selectedTransaction.status === 'Pending' && (
                            <div style={{ textAlign: 'right' }}>
                                <Button onClick={() => handleReview('Rejected')} style={{ marginRight: 8 }} danger loading={reviewLoading} icon={<CloseCircleOutlined />}>
                                    Từ chối
                                </Button>
                                <Button onClick={() => handleReview('Approved')} type="primary" loading={reviewLoading} icon={<CheckCircleOutlined />}>
                                    Phê duyệt
                                </Button>
                            </div>
                        )
                    }
                >
                    <Descriptions title="Thông tin Phiếu" bordered column={1}>
                        <Descriptions.Item label="Mã Phiếu">{selectedTransaction._id}</Descriptions.Item>
                        <Descriptions.Item label="Sản phẩm">{selectedTransaction.productName}</Descriptions.Item>
                        <Descriptions.Item label="Phiên bản">{selectedTransaction.variantName}</Descriptions.Item>
                        <Descriptions.Item label="Loại GD"><Tag color={selectedTransaction.type === 'IN' ? 'green' : 'red'}>{selectedTransaction.type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO'}</Tag></Descriptions.Item>
                        <Descriptions.Item label="Số lượng">{selectedTransaction.quantity}</Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền">
                            <strong style={{ color: '#1890ff' }}>
                                {(selectedTransaction.total_amount || 0).toLocaleString('vi-VN')} VNĐ
                            </strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tạo">{selectedTransaction.user?.full_name || 'Không xác định'}</Descriptions.Item>
                        <Descriptions.Item label="Thời gian tạo">{new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{selectedTransaction.notes || 'Không có'}</Descriptions.Item>
                    </Descriptions>

                    <Descriptions title="Thông tin Phê duyệt" bordered column={1} style={{ marginTop: 24 }}>
                        <Descriptions.Item label="Trạng thái"><Tag color={selectedTransaction.status === 'Approved' ? 'success' : selectedTransaction.status === 'Pending' ? 'warning' : 'error'}>{selectedTransaction.status.toUpperCase()}</Tag></Descriptions.Item>
                        {selectedTransaction.status === 'Rejected' && (<Descriptions.Item label="Lý do từ chối">{selectedTransaction.rejectionReason}</Descriptions.Item>)}
                        {selectedTransaction.approvedBy && (<Descriptions.Item label="Người duyệt">{selectedTransaction.approvedBy?.full_name || 'Không xác định'}</Descriptions.Item>)}
                    </Descriptions>

                    {user?.role.toLowerCase() === 'admin' && selectedTransaction.status === 'Pending' && (
                        <div style={{ marginTop: 24 }}>
                            <h4>Lý do từ chối (nếu có)</h4>
                            <Input.TextArea
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập lý do nếu bạn muốn từ chối phiếu này..."
                            />
                        </div>
                    )}
                </Drawer>
            )}

            {/* Modal để tạo phiếu mới */}
            <InventoryTransactionModal
                open={isCreateModalOpen}
                type={transactionType}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchTransactions}
            />
        </div>
    );
};

export default InventoryHistoryPage;