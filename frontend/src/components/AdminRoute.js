import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // 1. Thêm useLocation
import { useAuth } from '../context/AuthContext';
import { Alert } from 'antd';

const AdminRoute = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation(); // 2. Hook để lấy đường dẫn hiện tại (vd: /admin/inventory)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role?.toLowerCase(); // Lấy vai trò và chuyển về chữ thường

    // --- LOGIC PHÂN QUYỀN MỚI ---

    // 3. Nếu là Admin, cho phép truy cập tất cả các route bên trong
    if (userRole === 'admin') {
        return <Outlet />;
    }

    // 4. Nếu là Nhân viên Kho, CHỈ cho phép truy cập vào trang inventory
    if (userRole === 'nhân viên kho' && location.pathname.startsWith('/admin/inventory')) {
        return <Outlet />;
    }

    // 5. Với tất cả các trường hợp còn lại, từ chối truy cập
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <Alert
                message="Truy cập bị từ chối"
                description="Bạn không có quyền truy cập vào trang này."
                type="error"
                showIcon
            />
        </div>
    );
};

export default AdminRoute;