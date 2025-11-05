import axios from 'axios';
import Cookies from 'js-cookie'; // Thư viện để làm việc với cookie một cách dễ dàng
import { message } from 'antd'; // Component hiển thị thông báo của Ant Design

// Khởi tạo một instance của axios với cấu hình mặc định
const api = axios.create({
    baseURL: 'http://localhost:5002/api', // Thay thế bằng URL backend của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cho phép axios tự động gửi cookie trong các request
// Điều này cần thiết cho cơ chế Double Submit Cookie (CSRF)
api.defaults.withCredentials = true;

// --- Axios Request Interceptor ---
api.interceptors.request.use(
    (config) => {
        // 1. Lấy JWT Token từ Local Storage
        try {
            const userInfoString = localStorage.getItem('userInfo');
            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                // Nếu có token, đính kèm vào header Authorization
                if (userInfo && userInfo.jwtToken) { // Sử dụng jwtToken cho rõ ràng
                    config.headers['Authorization'] = `Bearer ${userInfo.jwtToken}`;
                }
            }
        } catch (e) {
            console.error("Lỗi khi parse userInfo từ localStorage", e);
        }

        // 2. Lấy CSRF Token từ Cookie
        const csrfToken = Cookies.get('csrf-token'); // Đọc token từ cookie có tên 'csrf-token'
        if (csrfToken) {
            // Nếu có, đính kèm vào header X-CSRF-Token
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        return config; // Trả về config đã được sửa đổi để request được gửi đi
    },
    (error) => {
        // Nếu có lỗi trong quá trình thiết lập request, reject promise
        return Promise.reject(error);
    }
);

// --- Axios Response Interceptor ---
// Hàm này sẽ chạy KHI nhận được một response từ server.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            message.error("Lỗi mạng hoặc server không phản hồi.", 5);
            return Promise.reject(error);
        }


        // Chỉ lấy status và config, bỏ 'data' không dùng đến
        const { status, config } = error.response;
        const originalRequestUrl = config.url;

        if (status === 401) {
            const ignored401Urls = ['/auth/login', '/users/change-password'];
            const isIgnoredUrl = ignored401Urls.some(url => originalRequestUrl.includes(url));

            if (isIgnoredUrl) {
                return Promise.reject(error);
            } else {
                localStorage.removeItem('userInfo');
                Cookies.remove('csrf-token');
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 2.5);

                setTimeout(() => {
                    window.location.href = '/login';
                }, 2500);

                return Promise.reject(new Error("Session expired"));
            }
        }

        return Promise.reject(error);
    }
);


export default api;