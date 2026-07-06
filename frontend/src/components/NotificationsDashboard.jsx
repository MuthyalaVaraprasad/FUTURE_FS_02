import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const NotificationsDashboard = ({ notifications = [], onClearNotification, showToast }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getGlobalActivity();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    notifications.forEach(n => {
      if (onClearNotification) onClearNotification(n.id);
    });
    showToast('All notifications cleared.', 'success');
  };

  return (
    <div className="notifications-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>🔔 Notifications & Activity</h1>
          <p className="subtitle">Real-time alerts, timeline activity logs, and secure database updates</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="theme-btn" onClick={handleClearAll} style={{ fontSize: '12px', padding: '8px 12px' }}>
            🧹 Clear Alert Notifications
          </button>
          <button className="primary-btn" onClick={loadLogs} style={{ fontSize: '12px', padding: '8px 12px' }}>
            🔄 Refresh Activity Log
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Live Alerts */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🔔 Unread Alerts</h3>
            <span className="badge-purple">{notifications.length} Unread</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '340px' }}>
            {notifications.length === 0 ? (
              <div className="empty-notes" style={{ padding: '40px 0' }}>No unread notifications alerts.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>{n.message}</p>
                      <span style={{ fontSize: '9px', color: 'var(--text-sub)' }}>{n.time || 'Today'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (onClearNotification) onClearNotification(n.id);
                      showToast('Notification cleared.', 'success');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-sub)',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                    className="delete-task-btn"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Global Activity Log */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>📋 Global Timeline Activities</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '340px' }}>
            {loading ? (
              <div className="empty-notes" style={{ padding: '40px 0' }}>Loading activity logs...</div>
            ) : logs.length === 0 ? (
              <div className="empty-notes" style={{ padding: '40px 0' }}>No activities logged in system yet.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  {/* Vertical connector line */}
                  <div style={{
                    width: '2px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    position: 'absolute',
                    top: '16px',
                    bottom: '-12px',
                    left: '7px',
                    zIndex: 0
                  }} />

                  {/* Bullet */}
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: log.action.toLowerCase().includes('converted') ? 'var(--accent-green)' : 'var(--accent-cyan)',
                    boxShadow: log.action.toLowerCase().includes('converted') ? '0 0 6px var(--accent-green)' : '0 0 6px var(--accent-cyan)',
                    zIndex: 1,
                    marginTop: '2px'
                  }} />

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{log.lead_name || 'System'}:</strong> {log.action}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationsDashboard;
