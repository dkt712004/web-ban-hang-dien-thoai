import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

// 1. Import thêm App và ConfigProvider từ Ant Design
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/lib/locale/vi_VN'; // Import ngôn ngữ tiếng Việt để các component như DatePicker hiển thị đúng

import './index.css'; // Import file CSS của bạn
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            {/* ConfigProvider để set ngôn ngữ chung cho toàn bộ component của AntD */}
            <ConfigProvider locale={viVN}>
                {/* 2. Bọc toàn bộ ứng dụng của bạn trong <AntApp> */}
                {/* Provider này sẽ tạo ra context cần thiết cho các hàm message, notification, Modal.confirm hoạt động */}
                <AntApp>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </AntApp>
            </ConfigProvider>
        </Router>
    </React.StrictMode>
);