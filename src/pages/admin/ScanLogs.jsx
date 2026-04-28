import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const ScanLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ partNo: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const isFirstFilterEffect = useRef(true);

  useEffect(() => {
    fetchScanLogs();
  }, []);

  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      handleFilter();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [filters.partNo, filters.dateFrom, filters.dateTo]);

  const fetchScanLogs = async () => {
    try {
      const res = await api.get('/scan/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.partNo) params.append('partNo', filters.partNo);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      const res = await api.get(`/scan/logs?${params.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="quantix-reports__section">
        <h3 className="quantix-reports__section-title">Filter Scan Logs</h3>
        <div className="quantix-reports__filters">
          <input
            placeholder="Part No"
            value={filters.partNo}
            onChange={(e) => setFilters({ ...filters, partNo: e.target.value })}
            className="quantix-reports__input"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="quantix-reports__input"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="quantix-reports__input"
          />
          <button onClick={handleFilter} className="quantix-reports__button">Apply Filter</button>
          <button onClick={fetchScanLogs} className="quantix-reports__button quantix-reports__button--secondary">Reset</button>
        </div>
      </div>

      <div className="quantix-reports__section">
        <h3 className="quantix-reports__section-title">Scan Logs</h3>
        <table className="quantix-reports__table">
          <thead>
            <tr>
              <th>Part No</th>
              <th>Description</th>
              <th>Measured</th>
              <th>Expected</th>
              <th>Status</th>
              <th>Scanned By</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.partNo}</td>
                <td>{log.partDescription}</td>
                <td>{log.measuredWeight} kg</td>
                <td>{log.expectedWeight} kg</td>
                <td>
                  {(() => {
                    const getStatusDisplay = () => {
                      if (log.status === 'match') return { text: 'Match', className: 'quantix-reports__status-badge--match' };
                      if (log.measuredWeight > log.expectedWeight) return { text: 'Overweight', className: 'quantix-reports__status-badge--mismatch' };
                      return { text: 'Underweight', className: 'quantix-reports__status-badge--mismatch' };
                    };
                    const statusDisplay = getStatusDisplay();
                    return (
                      <span className={`quantix-reports__status-badge ${statusDisplay.className}`}>
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </td>
                <td>{log.scannedByName}</td>
                <td className="quantix-reports__time">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="7" className="quantix-reports__empty">No scan logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ScanLogs;

