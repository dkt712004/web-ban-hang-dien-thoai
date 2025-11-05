import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserFromStorage = () => {
            try {
                const userInfoString = localStorage.getItem('userInfo');
                if (userInfoString) {
                    const storedUser = JSON.parse(userInfoString);
                    // Cập nhật lại user state với dữ liệu từ localStorage
                    setUser(storedUser);
                }
            } catch (e) {
                localStorage.removeItem('userInfo');
            } finally {
                setLoading(false);
            }
        };
        loadUserFromStorage();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });

            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);

            // LOGIC CHUYỂN HƯỚNG DỰA TRÊN VAI TRÒ
            const userRole = data.role.toLowerCase();

            if (userRole === 'admin') {
                navigate('/admin/dashboard');
            } else if (userRole === 'nhân viên kho') {
                navigate('/admin/inventory');
            } else {
                navigate('/profile');
            }

        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Gọi API logout của backend để xóa cookie
            await api.post('/auth/logout');
        } catch (error) {
            // Ngay cả khi API call thất bại (ví dụ: mất mạng),
            // chúng ta vẫn nên xóa dữ liệu ở phía client
            console.error("Lỗi khi gọi API logout:", error);
        } finally {
            // Dọn dẹp ở phía client bất kể kết quả API call
            localStorage.removeItem('userInfo');
            setUser(null);
            navigate('/login');
        }
    };

    const value = { user, login, logout, loading, isAuthenticated: !!user };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};