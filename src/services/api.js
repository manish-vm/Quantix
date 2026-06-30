import axios from 'axios';

const api = axios.create({
  //baseURL: 'http://localhost:5000/api',
  baseURL: 'https://quantix-backend-cdrs.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getScanSummary = () => api.get('/scan/summary');
export const getRecentScanLogs = () => api.get('/scan/recent');
export const getScanHistory = (partNo) => api.get('/scan/history', { params: { partNo } });
export const getEmployeeScanHistory = () => api.get('/scan/user-history');
export const getVendorScanHistory = () => api.get('/scan/vendor-history');
export const getVendorSubmissionsForPart = (partNo) =>
  api.get(
    `/scan/vendor-submissions?partNo=${partNo}`
  );


// Admin employee management
export const getEmployees = (employeeType) => api.get('/admin/employees', {
  params: employeeType ? { employeeType } : undefined,
});
export const createEmployee = (payload) => api.post('/admin/employees', payload);
export const updateEmployee = (id, payload) => api.put(`/admin/employees/${id}`, payload);
export const deleteEmployee = (id) => api.delete(`/admin/employees/${id}`);

export default api;


