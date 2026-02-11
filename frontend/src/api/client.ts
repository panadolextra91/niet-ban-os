import axios from 'axios';

const client = axios.create({
    baseURL: '/api',
});

// Request Interceptor
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 and avoid infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (originalRequest.url === '/auth/refresh') {
                // Refresh token failed -> Logout
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            try {
                const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return client(originalRequest);
            } catch (refreshError) {
                // Refresh failed (Nuclear Option or Expired)
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default client;
