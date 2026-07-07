import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import '../../styles/Reports.css';

const ProductSummary = () => {
  const [productReport, setProductReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductSummary();
  }, []);

  const fetchProductSummary = async () => {
    try {
      const res = await api.get('/reports/products');
      setProductReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatWeight = (value) => {
    if (value === null || value === undefined || value === '') return 'NA';
    return `${parseFloat(value).toFixed(3)} kg`;
  };

  const formatCount = (value) => {
    if (value === null || value === undefined || value === '') return 'NA';
    return parseFloat(value).toFixed(2);
  };

  const renderReviewStatus = (review, emptyText = 'Not submitted') => {
    if (!review) {
      return <span className="quantix-reports__review-empty">{emptyText}</span>;
    }

    const isMismatch = review.status === 'mismatch';

    return (
      <span
        className={`quantix-reports__review-status ${
          isMismatch
            ? 'quantix-reports__review-status--mismatch'
            : 'quantix-reports__review-status--match'
        }`}
      >
        <span className="quantix-reports__review-icon">
          {isMismatch ? '✕' : '✓'}
        </span>
        <span>{review.name || 'Unknown'}</span>
      </span>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="quantix-reports__section">
      <h3 className="quantix-reports__section-title">Product Summary</h3>
      <div className="quantix-reports__table-wrapper">
        <table className="quantix-reports__table">
          <thead>
            <tr>
              <th>Part No</th>
              <th>Part Description</th>
              <th>Unit Weight</th>
              <th>Tolerance Weight</th>
              <th>Overall Weight</th>
              <th>Total Ideal Product Count</th>
              <th>Vendor</th>
              <th>Employee</th>
            </tr>
          </thead>
          <tbody>
            {productReport.map((item) => (
              <tr key={item.partNo}>
                <td className="quantix-reports__part-no">{item.partNo}</td>
                <td>{item.description}</td>
                <td>{formatWeight(item.unitWeight)}</td>
                <td>{formatWeight(item.toleranceWeight)}</td>
                <td>{formatWeight(item.overallWeight)}</td>
                <td>{formatCount(item.totalIdealProductCount)}</td>
                <td>{renderReviewStatus(item.vendorReview)}</td>
                <td>{renderReviewStatus(item.employeeReview, 'Not reviewed')}</td>
              </tr>
            ))}
            {productReport.length === 0 && (
              <tr>
                <td colSpan="8" className="quantix-reports__empty">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSummary;

