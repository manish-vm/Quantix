import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [productReport, setProductReport] = useState([]);
  const [filters, setFilters] = useState({ partNo: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const isFirstFilterEffect = useRef(true);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      const [logsRes, reportRes] = await Promise.all([
        api.get('/scan/logs'),
        api.get('/reports/products')
      ]);
      setLogs(logsRes.data);
      setProductReport(reportRes.data);
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
    <div className="quantix-reports">
      <h1 className="quantix-reports__title">Reports</h1>

      <div className="quantix-reports__section">
        <h3 className="quantix-reports__section-title">Product Summary</h3>
        <table className="quantix-reports__table">
          <thead>
            <tr>
              <th>Part No</th>
              <th>Description</th>
              <th>Unit Weight</th>
              <th>Overall Weight</th>
              <th>Remaining</th>
              <th>Total Scans</th>
            </tr>
          </thead>
          <tbody>
            {productReport.map((item) => (
              <tr key={item.partNo}>
                <td className="quantix-reports__part-no">{item.partNo}</td>
                <td>{item.description}</td>
                <td>{item.unitWeight ? `${item.unitWeight.toFixed(3)} kg` : '-'}</td>
                <td>{item.overallWeight ? `${item.overallWeight} kg` : '-'}</td>
                <td>
                  {item.remainingCount !== null ? (
                    <span className={`quantix-reports__badge ${item.remainingCount > 0 ? 'quantix-reports__badge--success' : 'quantix-reports__badge--error'}`}>
                      {item.remainingCount} / {item.totalCount}
                    </span>
                  ) : '-'}
                </td>
                <td>{item.totalScans}</td>
              </tr>
            ))}
            {productReport.length === 0 && (
              <tr>
                <td colSpan="6" className="quantix-reports__empty">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          <button onClick={fetchData} className="quantix-reports__button quantix-reports__button--secondary">Reset</button>
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
                  <span className={`quantix-reports__status-badge ${log.status === 'match' ? 'quantix-reports__status-badge--match' : 'quantix-reports__status-badge--mismatch'}`}>
                    {log.status === 'match' ? 'Match' : 'Mismatch'}
                  </span>
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
    </div>
  );
};

export default Reports;

