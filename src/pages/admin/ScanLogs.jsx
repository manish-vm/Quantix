import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const ScanLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ partNo: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const isFirstFilterEffect = useRef(true);

  const formatWeight = (value) => {
    if (value === null || value === undefined || value === '') return 'NA';
    return `${parseFloat(value).toFixed(3)} kg`;
  };

  const formatCount = (value) => {
    if (value === null || value === undefined || value === '') return 'NA';
    return parseFloat(value).toFixed(2);
  };

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
        <div className="quantix-reports__table-wrapper">
        <table className="quantix-reports__table">
          <thead>
            <tr>
              <th>Part No</th>
              <th>Description</th>
              <th>Unit Weight</th>
              <th>Overall Weight</th>
              <th>Received Weight</th>
              <th>Underweight of</th>
              <th>Overweight of</th>
              <th>Total Ideal Product Count</th>
              <th>Based on Received Weight Product Count</th>
              <th>Product Delay</th>
              <th>Excess Product</th>
              <th>Status</th>
              <th>Scanned By</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.partNo}>
                <td className="quantix-reports__part-no">{log.partNo}</td>
                <td>{log.description}</td>
                <td>{formatWeight(log.unitWeight)}</td>
                <td>{formatWeight(log.overallWeight)}</td>
                <td>{formatWeight(log.receivedWeight)}</td>
                <td>{formatWeight(log.underweight)}</td>
                <td>{formatWeight(log.overweight)}</td>
                <td>{formatCount(log.totalIdealProductCount)}</td>
                <td>{formatCount(log.basedOnReceivedWeightProductCount)}</td>
                <td>{formatCount(log.productDelay)}</td>
                <td>{formatCount(log.excessProduct)}</td>
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
                <td colSpan="14" className="quantix-reports__empty">No scan logs found</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
};

export default ScanLogs;

