// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    // Kiểm tra xem thông tin người dùng có trong localStorage không
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // Nếu có userInfo (đã đăng nhập), cho phép truy cập vào route con (Outlet)
    // Nếu không, điều hướng về trang /login
    return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;