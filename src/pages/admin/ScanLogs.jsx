import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const ScanLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ partNo: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const isFirstFilterEffect = useRef(true);

  const formatWeight = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return `${parseFloat(value).toFixed(3)} kg`;
  };

  const formatCount = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return parseFloat(value).toFixed(2);
  };

  const getDisplayOverallWeight = (log) => (
    log.expectedWeight ?? log.overallWeight
  );

  const getStatusCountValue = (log) => {
    const unitWeight = Number(log.unitWeight);
    const overallWeight = Number(getDisplayOverallWeight(log));
    const receivedWeight = Number(log.receivedWeight);

    if (!Number.isFinite(unitWeight) || unitWeight <= 0 || !Number.isFinite(overallWeight) || !Number.isFinite(receivedWeight)) {
      return null;
    }

    const diff = receivedWeight - overallWeight;
    if (diff === 0) return 0;

    const countDiff = diff / unitWeight;
    const roundedCount = Math.round(Math.abs(countDiff));
    if (roundedCount === 0) return 0;

    return diff > 0 ? roundedCount : -roundedCount;
  };

  const getStatusCount = (log) => {
    const statusCount = getStatusCountValue(log);
    if (statusCount === null) return '-';
    if (statusCount === 0) return '0';

    return `${statusCount > 0 ? '+' : ''}${statusCount}`;
  };

  const getProductDelay = (log) => {
    const statusCount = getStatusCountValue(log);
    return statusCount !== null && statusCount < 0 ? Math.abs(statusCount) : null;
  };

  const getExcessProduct = (log) => {
    const statusCount = getStatusCountValue(log);
    return statusCount !== null && statusCount > 0 ? statusCount : null;
  };

  const getFinalValidationStatus = (log) => (
    log.finalValidationStatus || (log.status === 'match' ? 'accepted' : 'rejected')
  );

  const fetchScanLogs = useCallback(async (customFilters) => {
    const effectiveFilters = customFilters ?? filters;
    try {
      const params = new URLSearchParams();
      if (effectiveFilters.partNo) params.append('partNo', effectiveFilters.partNo);
      if (effectiveFilters.dateFrom) params.append('dateFrom', effectiveFilters.dateFrom);
      if (effectiveFilters.dateTo) params.append('dateTo', effectiveFilters.dateTo);

      const query = params.toString();
      const url = query ? `/scan/logs?${query}` : '/scan/logs';
      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilter = useCallback(async () => {
    setLoading(true);
    await fetchScanLogs(filters);
  }, [fetchScanLogs, filters]);

  useEffect(() => {
    fetchScanLogs(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [filters.partNo, filters.dateFrom, filters.dateTo, handleFilter]);

  const derivedLogs = useMemo(() => logs, [logs]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="quantix-reports__section">
        <h3 className="quantix-reports__section-title">Filter Scan Logs</h3>
        <div className="quantix-reports__filters">
          <input
            placeholder="Part No"
            value={filters.partNo}
            onChange={(e) => setFilters((p) => ({ ...p, partNo: e.target.value }))}
            className="quantix-reports__input"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
            className="quantix-reports__input"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
            className="quantix-reports__input"
          />
          <button onClick={handleFilter} className="quantix-reports__button">
            Apply Filter
          </button>
          <button
            onClick={() => {
              setFilters({ partNo: '', dateFrom: '', dateTo: '' });
              fetchScanLogs({ partNo: '', dateFrom: '', dateTo: '' });
            }}
            className="quantix-reports__button quantix-reports__button--secondary"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="quantix-reports__section">
        <h3 className="quantix-reports__section-title">Scan Logs (All Employees)</h3>
        <div className="quantix-reports__table-wrapper">
          <table className="quantix-reports__table">
            <thead>
              <tr>
                <th>Part No</th>
                <th>Description</th>
                <th>Unit Weight</th>
                <th>Tolerance Weight</th>
                <th>Overall Weight</th>
                <th>Received Weight</th>
                <th>Short of</th>
                <th>Excess of</th>
                <th>Status Count</th>
                <th>Total Ideal Product Count</th>
                <th>Validated Product Count</th>
                <th>Product Delay</th>
                <th>Excess Product</th>
                <th>Status</th>
                <th>Final Validation Status</th>
                <th>Scanned By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {derivedLogs.map((log, idx) => (
                <tr key={`${log.partNo}-${log.createdAt}-${idx}`}>
                  <td className="quantix-reports__part-no">{log.partNo}</td>
                  <td>{log.description}</td>
                  <td>{formatWeight(log.unitWeight)}</td>
                  <td>{formatWeight(log.toleranceWeight)}</td>
                  <td>{formatWeight(getDisplayOverallWeight(log))}</td>
                  <td>{formatWeight(log.receivedWeight)}</td>
                  <td>{formatWeight(log.short)}</td>
                  <td>{formatWeight(log.excess)}</td>
                  <td className={
                    log.short ? 'quantix-reports__status-cell--short' : log.excess ? 'quantix-reports__status-cell--excess' : 'quantix-reports__status-cell--good'
                  }>
                    {getStatusCount(log)}
                  </td>
                  <td>{formatCount(log.totalIdealProductCount)}</td>
                  <td>{formatCount(log.basedOnReceivedWeightProductCount)}</td>
                  <td>{formatCount(getProductDelay(log))}</td>
                  <td>{formatCount(getExcessProduct(log))}</td>
                  <td>
                    {(() => {
                      const getStatusDisplay = () => {
                        if (log.status === 'match') return { text: 'Match', className: 'quantix-reports__status-badge--match' };
                        if (log.measuredWeight > log.expectedWeight) {
                          return { text: 'Excess', className: 'quantix-reports__status-badge--excess' };
                        }
                        return { text: 'Short', className: 'quantix-reports__status-badge--short' };
                      };
                      const statusDisplay = getStatusDisplay();
                      return (
                        <span className={`quantix-reports__status-badge ${statusDisplay.className}`}>
                          {statusDisplay.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {(() => {
                      const finalStatus = getFinalValidationStatus(log);
                      return (
                        <span className={`quantix-reports__status-badge quantix-reports__status-badge--${finalStatus}`}>
                          {finalStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                        </span>
                      );
                    })()}
                  </td>
                  <td>{log.scannedByName}</td>
                  <td className="quantix-reports__time">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}

              {derivedLogs.length === 0 && (
                <tr>
                  <td colSpan="17" className="quantix-reports__empty">
                    No scan logs found
                  </td>
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

