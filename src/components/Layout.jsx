import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import '../styles/Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="quantix-layout">
      <nav className="quantix-layout__nav">
        <div className="quantix-layout__brand">
          <img src="/Quantix-logopic.png" alt="Quantix Logo" className="quantix-layout__logo" />
          <img src="/quantix-logo-text.png" alt="Quantix Logo Text" className="quantix-layout__logo-text" />
        </div>
        <div className="quantix-layout__nav-right-area">
          <div className="quantix-layout__nav-links">
            {user?.role === 'admin' && (
              <>
                <Link to="/" className={`quantix-layout__nav-link ${location.pathname === '/' ? 'quantix-layout__nav-link--active' : ''}`}>Dashboard</Link>
                <Link to="/products" className={`quantix-layout__nav-link ${location.pathname === '/products' ? 'quantix-layout__nav-link--active' : ''}`}>Products</Link>
                <Link to="/employees" className={`quantix-layout__nav-link ${location.pathname.startsWith('/employees') ? 'quantix-layout__nav-link--active' : ''}`}>Employees</Link>
                <Link to="/reports" className={`quantix-layout__nav-link ${location.pathname.startsWith('/reports') ? 'quantix-layout__nav-link--active' : ''}`}>Reports</Link>
              </>
            )}

            {(user?.role === 'employee' || user?.role === 'vendor' || user?.employeeType === 'vendor') && (
              <>
                <Link
                  to="/"
                  className={`quantix-layout__nav-link ${location.pathname === '/' ? 'quantix-layout__nav-link--active' : ''}`}
                >
                  Scanner
                </Link>
                <Link
                  to="/history"
                  className={`quantix-layout__nav-link ${location.pathname === '/history' ? 'quantix-layout__nav-link--active' : ''}`}
                >
                  Scan Log History
                </Link>
              </>
            )}
          </div>
          <span className="quantix-layout__user-name">
            {user?.name} ({user?.role})
          </span>
          <button onClick={logout} className="quantix-layout__logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <main className="quantix-layout__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
