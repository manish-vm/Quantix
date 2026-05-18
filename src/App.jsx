import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductMaster from './pages/admin/ProductMaster';
import Reports from './pages/admin/Reports';
import ProductSummary from './pages/admin/ProductSummary';
import ScanLogs from './pages/admin/ScanLogs';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Scanner from './pages/employee/Scanner';

import ScanHistory from './pages/employee/ScanHistory';
import Profile from './pages/employee/Profile';
import Footer from './components/Footer';
import './styles/App.css';


function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="quantix-app-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={user?.role === 'admin' ? <Dashboard /> : <Scanner />} />
        <Route path="products" element={<PrivateRoute role="admin"><ProductMaster /></PrivateRoute>} />
        <Route path="employees" element={<PrivateRoute role="admin"><EmployeeManagement /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute role="admin"><Reports /></PrivateRoute>}>

          <Route path="product-summary" element={<PrivateRoute role="admin"><ProductSummary /></PrivateRoute>} />
          <Route path="scan-logs" element={<PrivateRoute role="admin"><ScanLogs /></PrivateRoute>} />
        </Route>
        <Route path="scan" element={<PrivateRoute role="employee"><Scanner /></PrivateRoute>} />
        <Route path="history" element={<PrivateRoute><ScanHistory /></PrivateRoute>} />

        <Route path="profile" element={<PrivateRoute role="employee"><Profile /></PrivateRoute>} />
        <Route path="footer" element={<Footer/>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

