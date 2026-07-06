import React, { useState } from 'react';

const SettingsDashboard = ({
  activeTheme,
  onThemeChange,
  currency,
  onCurrencyChange,
  targetGoal,
  onTargetChange,
  onSeedMockData,
  loadingSeed,
  leads = [],
  onWipeDatabase,
  showToast
}) => {
  const [profileForm, setProfileForm] = useState({
    name: 'Administrator',
    email: 'admin@futurecrm.com',
    phone: '+1 555-0100',
    companyName: 'FutureCRM Ltd.',
    supportEmail: 'support@futurecrm.com',
    website: 'www.futurecrm.com'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactor, setTwoFactor] = useState(false);
  const [avatar, setAvatar] = useState('A');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('CRM profile updated successfully.', 'success');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    showToast('Password changed successfully.', 'success');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleBackupDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "futurecrm_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON Backup downloaded successfully.', 'success');
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let filled = 0;
    const keys = Object.keys(profileForm);
    keys.forEach(k => {
      if (profileForm[k].trim()) filled++;
    });
    return Math.round((filled / keys.length) * 100);
  };

  const completionPercent = calculateCompletion();

  return (
    <div className="settings-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1>⚙️ Settings & Profile Dashboard</h1>
        <p className="subtitle">Customize interface styling parameters, admin profiles, security details, and database records</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Profile and Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3>🙍 Profile Details</h3>
            
            {/* Completion Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span>Profile Completion:</span>
                <strong>{completionPercent}%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', backgroundColor: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* Avatar Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {avatar}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['A', 'ADM', 'SYS', 'MGR'].map(char => (
                  <button 
                    key={char} 
                    className={`theme-btn ${avatar === char ? 'active' : ''}`}
                    onClick={() => setAvatar(char)}
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Admin User Name</label>
                <input type="text" name="name" value={profileForm.name} onChange={handleInputChange} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Billing Email Address</label>
                <input type="email" name="email" value={profileForm.email} onChange={handleInputChange} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Direct Contact Phone</label>
                <input type="text" name="phone" value={profileForm.phone} onChange={handleInputChange} />
              </div>

              {/* Two-step Authentication Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Two-Step Authentication</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Prompt for authentication PIN</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={twoFactor}
                  onChange={() => {
                    setTwoFactor(!twoFactor);
                    showToast(twoFactor ? '2FA disabled.' : '2FA enabled.', 'success');
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </div>

              <button type="submit" className="primary-btn" style={{ padding: '8px' }}>
                Save Profile Edits
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3>🔐 Change Password</h3>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Current Password</label>
                <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>New Password</label>
                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
              </div>
              <button type="submit" className="primary-btn" style={{ padding: '8px' }}>
                Update Password
              </button>
            </form>
          </div>

          {/* Company configurations */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3>🏢 Company Branding Profile</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Organization Name</label>
                <input type="text" name="companyName" value={profileForm.companyName} onChange={handleInputChange} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Branding Support Email</label>
                <input type="email" name="supportEmail" value={profileForm.supportEmail} onChange={handleInputChange} />
              </div>
              <button type="submit" className="primary-btn" style={{ padding: '8px' }}>
                Update Brand Config
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: theme, seeder, active sessions & perf */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Interface Customizers */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3>🎨 Visual customizers</h3>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>Interface Color Presets</label>
              <div className="theme-toggle-group" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {['cyberpunk', 'light', 'slate'].map(t => (
                  <button 
                    key={t}
                    className={`theme-btn ${activeTheme === t ? 'active' : ''}`}
                    onClick={() => {
                      onThemeChange(t);
                      showToast(`Interface preset set to: ${t.toUpperCase()}`, 'success');
                    }}
                    style={{ flex: 1, padding: '8px', textTransform: 'capitalize' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Currency Sign</label>
                <select value={currency} onChange={(e) => onCurrencyChange(e.target.value)}>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                  <option value="₹">INR (₹)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Target Sales Goal</label>
                <input 
                  type="number" 
                  value={targetGoal} 
                  onChange={(e) => onTargetChange(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>

          {/* Active login sessions */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>🖥️ Active login sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
                <div>
                  <strong>IP: 192.168.1.45 (Current)</strong>
                  <div style={{ color: 'var(--text-sub)', fontSize: '10px' }}>Chrome • Windows 11 • Hyderabad, IN</div>
                </div>
                <span className="badge-purple" style={{ height: 'fit-content', padding: '2px 6px', fontSize: '8px' }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
                <div>
                  <strong>IP: 104.22.4.15</strong>
                  <div style={{ color: 'var(--text-sub)', fontSize: '10px' }}>Safari • iPhone 15 Pro • Bangalore, IN</div>
                </div>
                <span style={{ color: 'var(--text-sub)', fontSize: '10px' }}>2 hrs ago</span>
              </div>
            </div>
          </div>

          {/* System performance metrics */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3>📊 Server Health metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>CPU Usage</span>
                <strong style={{ display: 'block', fontSize: '16px', color: 'var(--accent-cyan)' }}>12.4%</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Memory</span>
                <strong style={{ display: 'block', fontSize: '16px', color: 'var(--accent-green)' }}>512 MB</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
              <span>Database state:</span>
              <strong style={{ color: 'var(--accent-green)' }}>CONNECTED (SQLITE)</strong>
            </div>
          </div>

          {/* Database Admin Operations */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3>🛠️ Database System Operations</h3>
            <p className="subtitle">Initialize, seed or clear SQLite data. Essential for testing workflows.</p>

            <button 
              className="primary-btn" 
              onClick={onSeedMockData}
              disabled={loadingSeed}
              style={{ width: '100%', padding: '10px' }}
            >
              {loadingSeed ? 'Populating Database...' : '🌱 Seed SQLite Mock Records'}
            </button>

            <button 
              className="theme-btn" 
              onClick={handleBackupDownload}
              style={{ width: '100%', padding: '10px' }}
            >
              📥 Download CRM JSON Backup
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <strong style={{ display: 'block', color: 'var(--accent-red)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Danger Zone</strong>
              <button 
                className="danger-action-btn"
                style={{ width: '100%', padding: '10px', border: '1px solid rgba(239,68,68,0.2)' }}
                onClick={() => {
                  if (window.confirm('Delete all database leads records? This is irreversible.')) {
                    if (onWipeDatabase) onWipeDatabase();
                  }
                }}
              >
                ⚠ Wipe SQLite Leads Database
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsDashboard;
