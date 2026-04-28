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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="quantix-reports__section">
      <h3 className="quantix-reports__section-title">Product Summary</h3>
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
            </tr>
          </thead>
          <tbody>
            {productReport.map((item) => (
              <tr key={item.partNo}>
                <td className="quantix-reports__part-no">{item.partNo}</td>
                <td>{item.description}</td>
                <td>{formatWeight(item.unitWeight)}</td>
                <td>{formatWeight(item.overallWeight)}</td>
                <td>{formatWeight(item.receivedWeight)}</td>
                <td>{formatWeight(item.underweight)}</td>
                <td>{formatWeight(item.overweight)}</td>
                <td>{formatCount(item.totalIdealProductCount)}</td>
                <td>{formatCount(item.basedOnReceivedWeightProductCount)}</td>
                <td>{formatCount(item.productDelay)}</td>
                <td>{formatCount(item.excessProduct)}</td>
              </tr>
            ))}
            {productReport.length === 0 && (
              <tr>
                <td colSpan="11" className="quantix-reports__empty">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSummary;

