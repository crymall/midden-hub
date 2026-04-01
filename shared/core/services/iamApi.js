import axios from 'axios';

const iamApi = axios.create({
  baseURL: '/iam/',
  withCredentials: true,
});

export const login = async (username, password) => {
  const response = await iamApi.post('/login', { username, password });
  return response.data;
};

export const verify2FA = async (userId, code, rememberMe = false) => {
  const response = await iamApi.post('/verify-2fa', { userId, code, rememberMe });
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await iamApi.post('/register', { username, email, password });
  return response.data;
};

export const verify = async () => {
  const response = await iamApi.get('/verify');
  return response.data;
};

export const logout = async () => {
  const response = await iamApi.post('/logout');
  return response.data;
};

export const fetchUsers = async () => {
  const response = await iamApi.get('/users');
  return response.data;
};

export const fetchUser = async (userId) => {
  const response = await iamApi.get(`/users/${userId}`);
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