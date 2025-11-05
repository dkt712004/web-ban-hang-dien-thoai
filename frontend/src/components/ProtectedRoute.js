// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Spin } from 'antd';

// Component này nhận một mảng các vai trò được phép truy cập
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isAuthenticated, loading } = useAuth();

    // Nếu đang trong quá trình xác thực user, hiển thị loading
    if (loading) {
        return <Spin tip="Đang xác thực..." style={{ display: 'block', marginTop: 50 }} />;
    }

    // Nếu chưa đăng nhập, chuyển về trang login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra xem vai trò của user có nằm trong danh sách được phép không
    // 'allowedRoles' là một mảng, vd: ['Admin', 'Nhân viên Kho']
    if (user && allowedRoles && allowedRoles.includes(user.role)) {
        // Nếu được phép, render nội dung của route
        return <Outlet />;
    }

    // Nếu đã đăng nhập nhưng không có quyền, hiển thị thông báo lỗi
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <Alert
                message="Truy cập bị từ chối"
                description="Bạn không có quyền truy cập vào chức năng này."
                type="error"
                showIcon
            />
        </div>
    );
};

export default ProtectedRoute;