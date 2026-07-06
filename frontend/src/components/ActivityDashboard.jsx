import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const ActivityDashboard = ({ showToast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchGlobalLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalActivity();
      setLogs(data);
    } catch (e) {
      if (showToast) showToast('Failed to load system activity logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.lead_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter === 'Status') {
      matchesCategory = (log.action || '').includes('Status') || (log.action || '').includes('status');
    } else if (categoryFilter === 'Budget') {
      matchesCategory = (log.action || '').includes('value') || (log.action || '').includes('budget');
    } else if (categoryFilter === 'Creation') {
      matchesCategory = (log.action || '').includes('created') || (log.action || '').includes('ingested');
    } else if (categoryFilter === 'Notes') {
      matchesCategory = (log.action || '').includes('Note') || (log.action || '').includes('note');
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="activity-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="activity-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>📋 CRM Activity & Audit Timeline</h1>
          <p className="subtitle">Audit logs tracking client stage transitions, BANT qualifiers, and note modifications</p>
        </div>
        <button className="primary-btn" onClick={fetchGlobalLogs} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Refreshing...' : '🔄 Refresh Audit Log'}
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-sub)' }}>TOTAL AUDIT LOGS</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-cyan)' }}>{logs.length} entries</strong>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-sub)' }}>STATUS UPDATES</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-pink)' }}>
            {logs.filter(l => l.action.toLowerCase().includes('status')).length} events
          </strong>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-sub)' }}>BUDGET ADJUSTMENTS</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-purple)' }}>
            {logs.filter(l => l.action.toLowerCase().includes('value') || l.action.toLowerCase().includes('budget')).length} events
          </strong>
        </div>
      </div>

      {/* Filters and Table Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
            <input 
              type="text"
              placeholder="Search audit actions or lead names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)', alignSelf: 'center' }}>Filter:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                fontSize: '13px'
              }}
            >
              <option value="All">All Events</option>
              <option value="Status">Status Shifts</option>
              <option value="Budget">Budget Changes</option>
              <option value="Notes">Notes Logged</option>
              <option value="Creation">Creation Events</option>
            </select>
          </div>
        </div>

        {/* Timeline Log Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="crm-spreadsheet" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '160px' }}>Timestamp</th>
                <th style={{ width: '180px' }}>Lead Target</th>
                <th>Action Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center" style={{ padding: '40px' }}>
                    <div className="animate-pulse">Loading global audit records...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center" style={{ padding: '40px' }}>
                    No matching activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} style={{ transition: 'background-color 0.2s' }}>
                    <td className="font-mono" style={{ fontSize: '12px' }}>#{log.id}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      {log.lead_name ? (
                        <strong style={{ color: 'var(--accent-cyan)' }}>{log.lead_name}</strong>
                      ) : (
                        <em className="dim-text" style={{ fontSize: '11px' }}>Wiped Record (ID: {log.lead_id})</em>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                      {log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;
