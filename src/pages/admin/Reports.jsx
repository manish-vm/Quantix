import React from 'react';
import { Outlet, NavLink, useLocation, Navigate } from 'react-router-dom';
import '../../styles/Reports.css';

const Reports = () => {
  const location = useLocation();

  // Redirect /reports to /reports/product-summary
  if (location.pathname === '/reports') {
    return <Navigate to="/reports/product-summary" replace />;
  }

  return (
    <div className="quantix-reports">
      <h1 className="quantix-reports__title">Reports</h1>

      <div className="quantix-reports__tabs">
        <NavLink
          to="/reports/product-summary"
          className={({ isActive }) =>
            `quantix-reports__tab ${isActive ? 'quantix-reports__tab--active' : ''}`
          }
        >
          Product Summary
        </NavLink>
        <NavLink
          to="/reports/scan-logs"
          className={({ isActive }) =>
            `quantix-reports__tab ${isActive ? 'quantix-reports__tab--active' : ''}`
          }
        >
          Scan Logs
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};

export default Reports;

