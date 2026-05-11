import React, { useEffect, useMemo, useState } from 'react';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '../../services/api';
import '../../styles/Reports.css';
import '../../styles/EmployeeManagement.css';



const emptyEmployeeForm = {

  employeeType: 'employee',
  employeeId: '',
  fullName: '',
  department: '',
  jobTitle: '',
  contactDetails: '',
  employmentStatus: 'full-time',
  manager: '',
  email: '',
  password: '',
};



const formatProfileStatus = (employmentStatus) => {
  if (employmentStatus === 'full-time') return 'Active';
  if (employmentStatus === 'part-time') return 'Inactive';
  return 'N/A';
};




const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ fullName: '', department: '' });

  // create
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyEmployeeForm);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // edit

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEmployeeForm);

  const [rowBusy, setRowBusy] = useState(false);
  const [message, setMessage] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const beginEdit = (emp) => {
    setEditingId(emp._id);
    setEditForm({
      employeeType: emp.employeeType || 'employee',
      employeeId: emp.employeeId || '',
      fullName: emp.fullName || '',
      department: emp.department || '',

      jobTitle: emp.jobTitle || '',
      contactDetails: emp.contactDetails || '',

      employmentStatus: emp.employmentStatus || 'full-time',
      manager: emp.manager || '',

      // Login fields
      email: emp.email || '',
      password: '',
    });
    setMessage('');
  };


  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyEmployeeForm);
    setMessage('');
  };

  const submitCreate = async () => {
    setCreating(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        ...createForm,
        salary: createForm.salary === '' ? undefined : Number(createForm.salary),
        hireDate: createForm.hireDate ? new Date(createForm.hireDate) : undefined,
      };

      await createEmployee(payload);
      setCreateForm(emptyEmployeeForm);
      setShowCreateModal(false);
      await fetchAll();
      alert('Employee created successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const submitUpdate = async (id) => {
    setRowBusy(true);
    setError('');

    setMessage('');

    try {
      const payload = {
        employeeId: editForm.employeeId,
        fullName: editForm.fullName,
        department: editForm.department,
        jobTitle: editForm.jobTitle,
        contactDetails: editForm.contactDetails,
        hireDate: editForm.hireDate ? new Date(editForm.hireDate) : undefined,
        employmentStatus: editForm.employmentStatus,
        manager: editForm.manager,
        salary: editForm.salary === '' ? undefined : Number(editForm.salary),
        location: editForm.location,

        employeeType: editForm.employeeType,

        // optional
        email: editForm.email,
        password: editForm.password,
      };


      await updateEmployee(id, payload);
      cancelEdit();
      await fetchAll();
      alert('Employee updated successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setRowBusy(false);
    }
  };

  const submitDelete = async (id) => {
    const ok = window.confirm('Delete this employee? This cannot be undone.');
    if (!ok) return;

    setError('');
    setMessage('');
    setRowBusy(true);
    try {
      await deleteEmployee(id);
      await fetchAll();
      if (editingId === id) cancelEdit();
      alert('Employee deleted successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setRowBusy(false);
    }
  };

  return (
    <div className="quantix-reports">
      <h1 className="quantix-reports__title">Employee Management</h1>

      {error && <div className="quantix-reports__error">{error}</div>}
      {message && <div className="quantix-reports__success">{message}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h3 className="quantix-reports__section-title" style={{ margin: 0 }}>
          Manage Employee
        </h3>
        <button
          className="quantix-reports__button"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            setCreateForm(emptyEmployeeForm);
            setShowCreateModal(true);
          }}
          disabled={creating}
        >
          + Add Employee
        </button>
      </div>

      {/* Filters */}
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
        <button onClick={fetchAll} className="quantix-reports__button">
          Refresh
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="quantix-modal-overlay" role="dialog" aria-modal="true">
          <div className="quantix-modal">
            <div className="quantix-modal__header">
              <div>
                <h3 className="quantix-modal__title">Create New Employee</h3>
                <div className="quantix-modal__subtitle">Add employee/vendor details and login credentials</div>
              </div>
              <button

                className="quantix-modal__close"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreating(false);
                  setError('');
                  setMessage('');
                  setCreateForm(emptyEmployeeForm);
                }}
                aria-label="Close"
                disabled={creating}
              >
                ×
              </button>
            </div>

            <div className="quantix-modal__body">
              <div className="quantix-employee-create__content">
                <div className="quantix-employee-create__sections">
                  <div className="quantix-employee-create__section">
                    <div className="quantix-employee-create__section-title">Identity</div>
                    <div className="quantix-employee-create__grid">

                      <input
                        placeholder="Employee/Vendor ID"
                        value={createForm.employeeId}
                        onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />

                      <input
                        placeholder="Full Name"
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />

                      <input
                        placeholder="Department"
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />
                      
                      <select
        
                         value={createForm.jobTitle}
                        onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      >
                        <option value="employee">Employee</option>
                        <option value="vendor">Vendor</option>
                      </select>
                      

                      <input
                        placeholder="Contact Details"
                        value={createForm.contactDetails}
                        onChange={(e) => setCreateForm({ ...createForm, contactDetails: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />

                      <select
                        value={createForm.employmentStatus}
                        onChange={(e) => setCreateForm({ ...createForm, employmentStatus: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      >
                        <option value="full-time">Active</option>
                        <option value="part-time">Inactive</option>
                      </select>


                      <input
                        type="email"
                        placeholder="Email (login)"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />

                      <input
                        type="password"
                        placeholder="Password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="quantix-reports__input"
                        disabled={creating}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="quantix-employee-create__sections" />
            </div>

            <div className="quantix-modal__footer">
              <button className="quantix-reports__button" onClick={submitCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                className="quantix-reports__button"
                style={{ marginLeft: 10, opacity: 0.85 }}
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm(emptyEmployeeForm);
                }}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (

        <div>Loading...</div>
      ) : (
        <div className="quantix-reports__table-wrapper">
          <table className="quantix-reports__table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Contact Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => {
                const isEditing = editingId === e._id;
                return (
                  <tr key={e._id || e.id}>
                    {!isEditing ? (
                      <>
                        <td>{e.employeeId || 'N/A'}</td>
                        <td>{e.fullName || e.name || 'N/A'}</td>
                        <td>{e.department || 'N/A'}</td>
                        <td>{e.jobTitle || 'N/A'}</td>
                        <td>{e.contactDetails || 'N/A'}</td>
                        <td>
                          <span
                            className={
                              e.employmentStatus === 'full-time'
                                ? 'quantix-profile-status-dot quantix-profile-status-dot--active'
                                : 'quantix-profile-status-dot quantix-profile-status-dot--inactive'
                            }
                          />
                          {formatProfileStatus(e.employmentStatus)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="quantix-reports__button" onClick={() => beginEdit(e)} disabled={rowBusy}>
                              Edit
                            </button>
                            <button
                              className="quantix-reports__button"
                              style={{ background: '#ff4d4f' }}
                              onClick={() => submitDelete(e._id)}
                              disabled={rowBusy}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <input
                            className="quantix-reports__input"
                            value={editForm.employeeId}
                            onChange={(ev) => setEditForm({ ...editForm, employeeId: ev.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="quantix-reports__input"
                            value={editForm.fullName}
                            onChange={(ev) => setEditForm({ ...editForm, fullName: ev.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="quantix-reports__input"
                            value={editForm.department}
                            onChange={(ev) => setEditForm({ ...editForm, department: ev.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="quantix-reports__input"
                            value={editForm.jobTitle}
                            onChange={(ev) => setEditForm({ ...editForm, jobTitle: ev.target.value })}
                          >
                            {editForm.employeeType === 'vendor' ? (
                              <>
                                <option value="">Select Vendor</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Employee">Employee</option>
                              </>
                            ) : (
                              <>
                                <option value="">Select Employee type</option>
                                <option value="Employee">Employee</option>
                                <option value="Vendor">Vendor</option>
                              </>
                            )}
                          </select>
                        </td>
                        <td>
                          <input
                            className="quantix-reports__input"
                            value={editForm.contactDetails}
                            onChange={(ev) => setEditForm({ ...editForm, contactDetails: ev.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="quantix-reports__input"
                            value={editForm.employmentStatus}
                            onChange={(ev) => setEditForm({ ...editForm, employmentStatus: ev.target.value })}
                          >
                            <option value="full-time">Active</option>
                            <option value="part-time">Inactive</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="quantix-reports__button"
                              onClick={() => submitUpdate(e._id)}
                              disabled={rowBusy}
                            >
                              {rowBusy ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="quantix-reports__button"
                              style={{ opacity: 0.85 }}
                              onClick={cancelEdit}
                              disabled={rowBusy}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="7" className="quantix-reports__empty">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

