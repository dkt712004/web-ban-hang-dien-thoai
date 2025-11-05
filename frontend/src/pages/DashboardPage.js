// src/pages/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, DatePicker, Table, Spin, message } from 'antd';
import { ShoppingCartOutlined, DropboxOutlined, SwapOutlined, TagOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import api from '../services/api';
// KHÔNG CẦN IMPORT MOMENT NỮA

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

const { RangePicker } = DatePicker;

// --- HÀM HELPER ĐỂ ĐỊNH DẠNG NGÀY THÁNG ---
// Hàm này sẽ thay thế cho moment().format('YYYY-MM-DD')
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2); // Thêm '0' nếu cần và lấy 2 số cuối
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

const DashboardPage = () => {
    // ... các state giữ nguyên ...
    const [stats, setStats] = useState({});
    const [salesData, setSalesData] = useState({ labels: [], data: [] });
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllData = useCallback(async () => {
        // ... hàm này giữ nguyên ...
        setLoading(true);
        try {
            const [statsRes, salesRes, topProductsRes] = await Promise.all([
                api.get('/reports/stats'),
                api.get('/reports/sales-by-date'),
                api.get('/reports/top-selling')
            ]);
            setStats(statsRes.data);
            setSalesData(salesRes.data);
            setTopProducts(topProductsRes.data);
        } catch (error) {
            message.error("Lỗi khi tải dữ liệu dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- HÀM XỬ LÝ NGÀY THÁNG ĐÃ ĐƯỢC CẬP NHẬT ---
    const handleDateChange = async (dates) => {
        // 'dates' là một mảng 2 đối tượng Date của AntD, hoặc là null
        const [startDate, endDate] = dates || [];

        setLoading(true);
        try {
            const params = (startDate && endDate)
                ? {
                    // Sử dụng hàm helper formatDate thay vì moment
                    startDate: formatDate(startDate.toDate()),
                    endDate: formatDate(endDate.toDate()),
                }
                : {}; // Nếu không có ngày, gửi params rỗng

            const response = await api.get('/reports/sales-by-date', { params });
            setSalesData(response.data);
        } catch (error) {
            message.error("Lỗi khi lọc dữ liệu theo ngày.");
        } finally {
            setLoading(false);
        }
    };

    // ... Dữ liệu và cột cho biểu đồ không thay đổi ...
    const lineChartData = {
        labels: salesData.labels,
        datasets: [{
            label: 'Số lượng sản phẩm đã bán',
            data: salesData.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1,
            fill: true,
        }]
    };

    const topProductsColumns = [
        { title: 'Sản phẩm', dataIndex: ['productDetails', 'name'] },
        { title: 'Đã bán', dataIndex: 'totalSold', align: 'right' }
    ];

    return (
        <Spin spinning={loading} tip="Đang tải dữ liệu...">
            <div style={{ padding: 24 }}>
                <h1 style={{ marginBottom: '24px' }}>Trang báo cáo thống kê</h1>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}><Card><Statistic title="Tổng loại sản phẩm" value={stats.totalProducts} prefix={<TagOutlined />} /></Card></Col>
                    <Col xs={24} sm={12} md={6}><Card><Statistic title="Tổng tồn kho" value={stats.totalStock} prefix={<DropboxOutlined />} /></Card></Col>
                    <Col xs={24} sm={12} md={6}><Card><Statistic title="Tổng GD Xuất" value={stats.totalSalesTransactions} prefix={<SwapOutlined />} /></Card></Col>
                    <Col xs={24} sm={12} md={6}><Card><Statistic title="Tổng SP đã bán" value={stats.totalSoldItems} prefix={<ShoppingCartOutlined />} /></Card></Col>
                </Row>

                <Card title="Thống kê số lượng bán ra" style={{ marginTop: 24 }} extra={<RangePicker onChange={handleDateChange} />}>
                    <Line data={lineChartData} />
                </Card>

                <Card title="Top 5 sản phẩm bán chạy" style={{ marginTop: 24 }}>
                    <Table
                        columns={topProductsColumns}
                        dataSource={topProducts}
                        rowKey="_id"
                        pagination={false}
                    />
                </Card>
            </div>
        </Spin>
    );
};

export default DashboardPage;