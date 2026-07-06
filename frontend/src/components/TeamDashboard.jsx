import React, { useState } from 'react';

const TeamDashboard = ({ leads = [], showToast }) => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin Administrator', username: 'admin', role: 'Administrator', status: 'Online', lastLogin: 'Just now', email: 'admin@futurecrm.com' },
    { id: 2, name: 'Sarah Miller', username: 'sarah_m', role: 'Sales Executive', status: 'Offline', lastLogin: '2 hours ago', email: 'sarah@futurecrm.com' },
    { id: 3, name: 'Alex Johnson', username: 'alex_j', role: 'Manager', status: 'Offline', lastLogin: 'Yesterday', email: 'alex@futurecrm.com' }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Sales Executive');

  const handleDeactivate = (username) => {
    if (username === 'admin') {
      showToast('Cannot deactivate primary administrator account.', 'error');
      return;
    }
    showToast(`Account for user '${username}' has been deactivated.`, 'info');
  };

  const handleResetPassword = (username) => {
    showToast(`Temporary password reset link generated for '${username}'.`, 'success');
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const cleanUsername = newUserName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setUsers(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newUserName,
        username: cleanUsername,
        role: newUserRole,
        status: 'Offline',
        lastLogin: 'Never logged in',
        email: `${cleanUsername}@futurecrm.com`
      }
    ]);
    setNewUserName('');
    setShowAddUser(false);
    showToast('New team member registered.', 'success');
  };

  return (
    <div className="team-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>👨💼 Team & User Management</h1>
          <p className="subtitle">Scalable user profiles, access permission levels, and performance stats</p>
        </div>
        
        <button className="primary-btn" onClick={() => setShowAddUser(true)} style={{ padding: '8px 16px' }}>
          ＋ Register New User
        </button>
      </div>

      {showAddUser && (
        <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 0, 127, 0.02)', border: '1px solid var(--accent-pink)' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Register Team Member</h3>
          <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '11px' }}>Full Name:</label>
              <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required placeholder="Bruce Wayne" />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
              <label style={{ fontSize: '11px' }}>Access Role:</label>
              <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                <option value="Administrator">Administrator</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-btn" style={{ padding: '10px 16px' }}>Save User</button>
              <button type="button" className="theme-btn" onClick={() => setShowAddUser(false)} style={{ padding: '10px 16px', border: '1px solid var(--border-color)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Team Users Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {users.map(u => {
          // Calculate mock performance metrics based on role
          const totalAssigned = u.role === 'Administrator' ? leads.length : Math.round(leads.length / 3);
          const converted = u.role === 'Administrator' ? leads.filter(l => l.status==='converted').length : Math.round(totalAssigned * 0.4);
          const pending = totalAssigned - converted;
          const rate = totalAssigned > 0 ? Math.round((converted / totalAssigned) * 100) : 0;

          return (
            <div key={u.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge-purple">{u.role}</span>
                <span style={{ fontSize: '11px', color: u.status === 'Online' ? 'var(--accent-green)' : 'var(--text-sub)' }}>
                  ● {u.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {u.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{u.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>@{u.username}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-sub)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Assigned Pipeline:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{totalAssigned} leads</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Converted Rate:</span>
                  <strong style={{ color: 'var(--accent-green)' }}>{converted} won ({rate}%)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last login activity:</span>
                  <span>{u.lastLogin}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                <button className="theme-btn" onClick={() => handleResetPassword(u.username)} style={{ flex: 1, padding: '6px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
                  🔑 Reset Pass
                </button>
                <button className="danger-action-btn" onClick={() => handleDeactivate(u.username)} style={{ flex: 1, padding: '6px', fontSize: '11px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ⚠ Deactivate
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamDashboard;
