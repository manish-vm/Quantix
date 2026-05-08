import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import '../../styles/Dashboard.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// const COLORS = ['#1890ff', '#52c41a', '#722ed1', '#ff4d4f', '#faad14'];
const MATCH_COLORS = { match: '#52c41a', mismatch: '#ff4d4f' };

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const matchData = [
    { name: 'Match', value: stats?.matchScans || 0 },
    { name: 'Mismatch', value: stats?.mismatchScans || 0 }
  ];

  const topProductsData = stats?.topProducts?.map(p => ({
    name: p._id,
    scans: p.count
  })) || [];

  return (
    <div className="quantix-dashboard">
      <h1 className="quantix-dashboard__title">Dashboard</h1>

      <div className="quantix-dashboard__stats">
        <div className="quantix-dashboard__stat-card">
          <div className="quantix-dashboard__stat-label">Total Products</div>
          <div className="quantix-dashboard__stat-value">{stats?.totalProducts || 0}</div>
        </div>
        <div className="quantix-dashboard__stat-card">
          <div className="quantix-dashboard__stat-label">Demo Data Records</div>
          <div className="quantix-dashboard__stat-value quantix-dashboard__stat-value--green">{stats?.totalDemoData || 0}</div>
        </div>
        <div className="quantix-dashboard__stat-card">
          <div className="quantix-dashboard__stat-label">Total Scans</div>
          <div className="quantix-dashboard__stat-value quantix-dashboard__stat-value--purple">{stats?.totalScans || 0}</div>
        </div>
        <div className="quantix-dashboard__stat-card">
          <div className="quantix-dashboard__stat-label">Match Rate</div>
          <div className="quantix-dashboard__stat-value quantix-dashboard__stat-value--green">
            {stats?.totalScans > 0 ? Math.round((stats.matchScans / stats.totalScans) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="quantix-dashboard__charts">
        <div className="quantix-dashboard__chart-card">
          <h3 className="quantix-dashboard__chart-title">Scans Over Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats?.scansByDateChart || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="count" stroke="#1890ff" fillOpacity={1} fill="url(#colorCount)" name="Total Scans" />
              <Area type="monotone" dataKey="matchCount" stroke="#52c41a" fill="#52c41a" fillOpacity={0.1} name="Match" />
              <Area type="monotone" dataKey="mismatchCount" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.1} name="Mismatch" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="quantix-dashboard__chart-row">
          <div className="quantix-dashboard__chart-card quantix-dashboard__chart-card--half">
            <h3 className="quantix-dashboard__chart-title">Match vs Mismatch</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={matchData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {matchData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? MATCH_COLORS.match : MATCH_COLORS.mismatch} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="quantix-dashboard__chart-card quantix-dashboard__chart-card--half">
            <h3 className="quantix-dashboard__chart-title">Top Scanned Products</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="scans" fill="#722ed1" radius={[0, 4, 4, 0]} name="Scans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="quantix-dashboard__chart-card">
          <h3 className="quantix-dashboard__chart-title">Today's Scan Activity by Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.scansByHourChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* <div className="quantix-dashboard__recent">
        <h2 className="quantix-dashboard__section-title">Recent Scan Activity</h2>
        <table className="quantix-dashboard__table">
          <thead>
            <tr>
              <th>Part No</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Scanned By</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentScans?.map((scan) => (
              <tr key={scan._id}>
                <td>{scan.partNo}</td>
                <td>{scan.measuredWeight} kg</td>
                <td>
                  {(() => {
                    const getStatusDisplay = () => {
                      if (scan.status === 'match') return { text: 'Match', className: 'quantix-dashboard__badge--match' };
                      if (scan.measuredWeight > scan.expectedWeight) return { text: 'Excess', className: 'quantix-dashboard__badge--excess' };
                      return { text: 'Short', className: 'quantix-dashboard__badge--short' };
                    };
                    const statusDisplay = getStatusDisplay();
                    return (
                      <span className={`quantix-dashboard__badge ${statusDisplay.className}`}>
                        {statusDisplay.text}
                      </span>
                    );
                  })()}
                </td>
                <td>{scan.scannedByName}</td>
                <td className="quantix-dashboard__time">
                  {new Date(scan.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {(!stats?.recentScans || stats.recentScans.length === 0) && (
              <tr>
                <td colSpan="5" className="quantix-dashboard__empty">No scan activity yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div> */}
    </div>
  );
};

export default Dashboard;

