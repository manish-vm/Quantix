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
    if (log.measuredWeight > log.expectedWeight) return 'Excess';
    return 'Short';
  };

  const formatStatusKg = (log) => {
    if (log.status === 'match') return '0 kg';
    const diff = log.measuredWeight - log.expectedWeight;
    const formatted = Math.abs(diff).toFixed(2);
    return diff > 0 ? `+${formatted} kg` : `-${formatted} kg`;
  };

  const getStatusCount = (log) => {
    const unitWeight = Number(log.unitWeight);
    const overallWeight = Number(log.overallWeight ?? log.expectedWeight);
    const receivedWeight = Number(log.measuredWeight);

    if (!Number.isFinite(unitWeight) || unitWeight <= 0 || !Number.isFinite(overallWeight) || !Number.isFinite(receivedWeight)) {
      return 'N/A';
    }

    const diff = receivedWeight - overallWeight;
    if (diff === 0) return '0';

    const countDiff = diff / unitWeight;
    const roundedCount = Math.round(Math.abs(countDiff));
    if (roundedCount === 0) return '0';

    return `${diff > 0 ? '+' : '-'}${roundedCount}`;
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
                <th>Overall Weight</th>
                <th>Measured Weight</th>
                <th>Total ideal product count</th>
                <th>Status</th>
                <th>Status in Kg</th>
                <th>Status Count</th>
                <th>Final Validation</th>
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
                  <td>{formatWeight(log.overallWeight)}</td>
                  <td>{formatWeight(log.measuredWeight)}</td>
                  <td>{log.totalIdealProductCount != null ? log.totalIdealProductCount : 'N/A'}</td>
                  {(() => {
                    const statusText = formatStatus(log);
                    const statusKgText = formatStatusKg(log);

                    const className =
                      statusText === 'Short'
                        ? 'quantix-reports__status-cell--short'
                        : statusText === 'Excess'
                          ? 'quantix-reports__status-cell--excess'
                          : 'quantix-reports__status-cell--good';

                    return (
                      <>
                        <td className={className}>{statusText}</td>
                        <td className={className}>{statusKgText}</td>
                      </>
                    );
                  })()}
                  <td className={
                    (() => {
                      const unitWeight = Number(log.unitWeight);
                      const overallWeight = Number(log.overallWeight ?? log.expectedWeight);
                      const receivedWeight = Number(log.measuredWeight);
                      if (!Number.isFinite(unitWeight) || unitWeight <= 0 || !Number.isFinite(overallWeight) || !Number.isFinite(receivedWeight)) {
                        return 'quantix-reports__status-cell--good';
                      }
                      const diff = receivedWeight - overallWeight;
                      if (diff > 0) return 'quantix-reports__status-cell--excess';
                      if (diff < 0) return 'quantix-reports__status-cell--short';
                      return 'quantix-reports__status-cell--good';
                    })()
                  }>
                    {getStatusCount(log)}
                  </td>
                  <td className={log.finalValidationStatus === 'accepted' ? 'quantix-reports__status-cell--good' : 'quantix-reports__status-cell--short'}>
                    {log.finalValidationStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                  </td>
                  <td>{log.scannedByName}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="12" className="quantix-reports__empty">
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

