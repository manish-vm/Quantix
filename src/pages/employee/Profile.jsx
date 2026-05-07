import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import '../../styles/Profile.css';

const normalizeSalary = (v) => {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
};

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Auth identity
    name: '',
    email: '',
    // HR fields
    employeeId: '',
    fullName: '',
    department: '',
    jobTitle: '',
    contactDetails: '',
    hireDate: '',
    employmentStatus: 'full-time',
    manager: '',
    salary: '',
    location: ''
  });


  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/auth/me');
        setForm({
          name: res.data?.name ?? '',
          email: res.data?.email ?? '',
          employeeId: res.data?.employeeId ?? '',
          fullName: res.data?.fullName ?? '',
          department: res.data?.department ?? '',
          jobTitle: res.data?.jobTitle ?? '',
          contactDetails: res.data?.contactDetails ?? '',
          hireDate: res.data?.hireDate ? new Date(res.data.hireDate).toISOString().slice(0, 10) : '',
          employmentStatus: res.data?.employmentStatus ?? 'full-time',
          manager: res.data?.manager ?? '',
          salary: res.data?.salary ?? '',
          location: res.data?.location ?? ''
        });

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // If backend does not support update, this will fail; still keeps UI logic.
      // Ideally backend provides: PUT /api/auth/me
      await api.put('/auth/me', {
        ...form,
        salary: normalizeSalary(form.salary)
      });


      // Reload
      const res = await api.get('/auth/me');
      setForm({
        name: res.data?.name ?? '',
        email: res.data?.email ?? ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="quantix-profile">Loading...</div>;

  return (
    <div className="quantix-profile">
      <h1 className="quantix-profile__title">Employee Dashboard</h1>
      {error && <div className="quantix-profile__error">{error}</div>}

      <form className="quantix-profile__form" onSubmit={handleSave}>
        {/* Identity (email usually immutable, but kept editable to match existing behavior) */}
        <label className="quantix-profile__label">
          Full Name
          <input
            className="quantix-profile__input"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Full Name"
          />
        </label>

        <label className="quantix-profile__label">
          Employee ID
          <input
            className="quantix-profile__input"
            value={form.employeeId}
            onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
            placeholder="Employee ID"
          />
        </label>

        <label className="quantix-profile__label">
          Email
          <input
            className="quantix-profile__input"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
          />
        </label>

        <label className="quantix-profile__label">
          Department
          <input
            className="quantix-profile__input"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            placeholder="Department"
          />
        </label>

        <label className="quantix-profile__label">
          Job Title
          <input
            className="quantix-profile__input"
            value={form.jobTitle}
            onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
            placeholder="Job Title"
          />
        </label>

        <label className="quantix-profile__label">
          Contact Details
          <input
            className="quantix-profile__input"
            value={form.contactDetails}
            onChange={(e) => setForm((p) => ({ ...p, contactDetails: e.target.value }))}
            placeholder="Contact Details"
          />
        </label>

        <label className="quantix-profile__label">
          Hire Date
          <input
            type="date"
            className="quantix-profile__input"
            value={form.hireDate}
            onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))}
          />
        </label>

        <label className="quantix-profile__label">
          Employment Status
          <select
            className="quantix-profile__input"
            value={form.employmentStatus}
            onChange={(e) => setForm((p) => ({ ...p, employmentStatus: e.target.value }))}
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
          </select>
        </label>

        <label className="quantix-profile__label">
          Manager
          <input
            className="quantix-profile__input"
            value={form.manager}
            onChange={(e) => setForm((p) => ({ ...p, manager: e.target.value }))}
            placeholder="Manager"
          />
        </label>

        <label className="quantix-profile__label">
          Salary
          <input
            type="number"
            className="quantix-profile__input"
            value={form.salary}
            onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value }))}
            placeholder="Salary"
          />
        </label>

        <label className="quantix-profile__label">
          Location
          <input
            className="quantix-profile__input"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            placeholder="Location"
          />
        </label>

        <button className="quantix-profile__save-btn" disabled={saving} type="submit">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

    </div>
  );
};

export default Profile;

