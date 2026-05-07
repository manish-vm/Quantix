import React, { useEffect, useState } from 'react';
import { getEmployeeScanHistory } from '../../services/api';
import '../../styles/Reports.css';

const EmployeeScanHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatWeight = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return `${parseFloat(value).toFixed(2)} kg`;
  };

  const formatStatus = (log) => {
    if (log.status === 'match') return 'Match';
    if (log.measuredWeight > log.expectedWeight) return 'Overweight';
    return 'Underweight';
  };

  const formatStatusKg = (log) => {
    if (log.status === 'match') return '0 kg';
    const diff = log.measuredWeight - log.expectedWeight;
    const formatted = Math.abs(diff).toFixed(2);
    return diff > 0 ? `+${formatted} kg` : `-${formatted} kg`;
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await getEmployeeScanHistory();
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load employee scan history:', err);
      setError(err.response?.data?.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="quantix-reports">
      <h1 className="quantix-reports__title">My Scan History</h1>
      {error && <div className="quantix-reports__error">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="quantix-reports__table-wrapper">
          <table className="quantix-reports__table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Part Description</th>
                <th>Unit Weight</th>
                <th>Tolerance Weight</th>
                <th>Measured Weight</th>
                <th>Total ideal product count</th>
                <th>Status</th>
                <th>Status in Kg</th>
                <th>Status Count</th>
                <th>Scanned By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={`${log._id}-${log.createdAt}`}>
                  <td className="quantix-reports__part-no">{log.partNo}</td>
                  <td>{log.partDescription}</td>
                  <td>{formatWeight(log.unitWeight)}</td>
                  <td>{formatWeight(log.toleranceWeight)}</td>
                  <td>{formatWeight(log.measuredWeight)}</td>
                  <td>{log.totalIdealProductCount != null ? log.totalIdealProductCount : 'N/A'}</td>
                  {(() => {
                    const isMismatch = formatStatus(log) === 'Overweight' || formatStatus(log) === 'Underweight';
                    const statusText = formatStatus(log);
                    const statusKgText = formatStatusKg(log);
                    const className = isMismatch ? 'quantix-reports__status-cell--bad' : 'quantix-reports__status-cell--good';

                    return (
                      <>
                        <td className={className}>{statusText}</td>
                        <td className={className}>{statusKgText}</td>
                      </>
                    );
                  })()}
                  <td>{log.expectedCount != null ? log.expectedCount : 'N/A'}</td>
                  <td>{log.scannedByName}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="11" className="quantix-reports__empty">
                    No scan history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeScanHistory;
