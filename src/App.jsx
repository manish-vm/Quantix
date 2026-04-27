import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductMaster from './pages/admin/ProductMaster';
import Reports from './pages/admin/Reports';
import Scanner from './pages/employee/Scanner';
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
        <Route path="reports" element={<PrivateRoute role="admin"><Reports /></PrivateRoute>} />
        <Route path="scan" element={<PrivateRoute role="employee"><Scanner /></PrivateRoute>} />
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

