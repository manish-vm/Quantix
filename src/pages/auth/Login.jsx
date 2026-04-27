import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Login.css';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.post('/auth/register', formData);
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        login(res.data.token, res.data.user);
      } else {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        login(res.data.token, res.data.user);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quantix-login">
      <div className="quantix-login__card">
        <img src="/Quantix_logo.png" alt="Quantix Logo" className="quantix-login__logo" />
        {/* <h1 className="quantix-login__title">Quantix</h1> */}
        <p className="quantix-login__subtitle">{isRegister ? 'Create Account' : 'Sign In'}</p>

        {error && (
          <div className="quantix-login__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label className="quantix-login__label">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="quantix-login__input"
                required
              />
              <label className="quantix-login__label">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="quantix-login__input"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}

          <label className="quantix-login__label">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="quantix-login__input"
            required
          />

          <label className="quantix-login__label">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="quantix-login__input"
            required
          />

          <button type="submit" className="quantix-login__button" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="quantix-login__toggle">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="quantix-login__toggle-btn"
          >
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

