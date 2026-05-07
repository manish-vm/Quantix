import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const EmployeeDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    fullName: '',
    department: ''
  });

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const nameQ = filters.fullName.trim().toLowerCase();
    const deptQ = filters.department.trim().toLowerCase();

    return employees.filter((e) => {
      const name = (e.fullName || e.name || '').toLowerCase();
      const dept = (e.department || '').toLowerCase();
      const nameOk = !nameQ || name.includes(nameQ);
      const deptOk = !deptQ || dept.includes(deptQ);
      return nameOk && deptOk;
    });
  }, [employees, filters]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="quantix-reports">
      <h1 className="quantix-reports__title">Employee Dashboard</h1>
      {error && <div className="quantix-reports__error">{error}</div>}

      <div className="quantix-reports__filters" style={{ marginBottom: 16 }}>
        <input
          placeholder="Search Full Name"
          value={filters.fullName}
          onChange={(e) => setFilters({ ...filters, fullName: e.target.value })}
          className="quantix-reports__input"
        />
        <input
          placeholder="Search Department"
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          className="quantix-reports__input"
        />
        <button onClick={fetchEmployees} className="quantix-reports__button">Refresh</button>
      </div>

      <div className="quantix-reports__table-wrapper">
        <table className="quantix-reports__table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Contact Details</th>
              <th>Hire Date</th>
              <th>Status</th>
              <th>Manager</th>
              <th>Salary</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((e) => (
              <tr key={e._id || e.id}>
                <td>{e.employeeId || 'N/A'}</td>
                <td>{e.fullName || e.name || 'N/A'}</td>
                <td>{e.department || 'N/A'}</td>
                <td>{e.jobTitle || 'N/A'}</td>
                <td>{e.contactDetails || 'N/A'}</td>
                <td>{formatDate(e.hireDate)}</td>
                <td>{e.employmentStatus || 'N/A'}</td>
                <td>{e.manager || 'N/A'}</td>
                <td>{e.salary != null ? e.salary : 'N/A'}</td>
                <td>{e.location || 'N/A'}</td>
              </tr>
            ))}

            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan="10" className="quantix-reports__empty">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

