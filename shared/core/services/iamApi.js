import axios from 'axios';

const iamApi = axios.create({
  baseURL: '/iam/',
});

iamApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (username, password) => {
  const response = await iamApi.post('/login', { username, password });
  return response.data;
};

export const verify2FA = async (userId, code) => {
  const response = await iamApi.post('/verify-2fa', { userId, code });
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await iamApi.post('/register', { username, email, password });
  return response.data;
};

export const fetchUsers = async () => {
  const response = await iamApi.get('/users');
  return response.data;
};

export const updateUserRole = async (userId, roleId) => {
  const response = await iamApi.patch(`/users/${userId}/role`, { roleId });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await iamApi.delete(`/users/${userId}`);
  return response.data;
};