import React, { useState } from 'react';

const MyProfileDashboard = ({ showToast }) => {
  const [profile, setProfile] = useState({
    name: 'Administrator',
    email: 'admin@futurecrm.com',
    phone: '+1 555-0100',
    role: 'System Architect',
    bio: 'Oversees customer success pipelines and database sync configurations.'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactor, setTwoFactor] = useState(false);

  // Compute profile completion percentage
  const getCompletion = () => {
    let filled = 0;
    const keys = Object.keys(profile);
    keys.forEach(k => {
      if (profile[k].trim()) filled++;
    });
    return Math.round((filled / keys.length) * 100);
  };

  const completionPercent = getCompletion();

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    showToast('Personal profile info updated successfully.', 'success');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    showToast('Admin password changed successfully.', 'success');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="myprofile-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1>🙍 My Profile & Security</h1>
        <p className="subtitle">Audit active JWT admin logins, change system passwords, and enable multi-factor 2FA locks</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Personal profile details */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>🙍 Admin Profile Information</h3>
          
          {/* Avatar and completion */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '20px',
              color: '#fff',
              border: '2px solid var(--border-color)',
              boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)'
            }}>
              {profile.name.split(' ').map(n=>n[0]).join('')}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span>Profile strength:</span>
                <strong>{completionPercent}%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercent}%`, height: '100%', backgroundColor: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Admin Name</label>
              <input type="text" name="name" value={profile.name} onChange={handleProfileChange} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Direct Billing Email</label>
              <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Role</label>
              <input type="text" name="role" value={profile.role} onChange={handleProfileChange} required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Bio Summary</label>
              <input type="text" name="bio" value={profile.bio} onChange={handleProfileChange} />
            </div>
            
            <button type="submit" className="primary-btn" style={{ padding: '8px', marginTop: '6px' }}>
              Update Profile Details
            </button>
          </form>
        </div>

        {/* Right Column: Security, Password, JWT session */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Change Password */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3>🔐 Change System Password</h3>
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Current Password</label>
                <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>New Secure Password</label>
                <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
              </div>
              <button type="submit" className="primary-btn" style={{ padding: '8px', marginTop: '6px' }}>
                Commit Password Update
              </button>
            </form>
          </div>

          {/* JWT Security Session Info */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3>🔒 Active Authentication Session</h3>
            
            {/* Two-step Authentication Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Two-Step Authentication</span>
                <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Require PIN code upon login</span>
              </div>
              <input 
                type="checkbox" 
                checked={twoFactor}
                onChange={() => {
                  setTwoFactor(!twoFactor);
                  showToast(twoFactor ? '2FA disabled.' : '2FA activated.', 'success');
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-sub)', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Authentication Method:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>JWT Bearer Token</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Token Expiry:</span>
                <span>In 8 Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Session IP Gateway:</span>
                <span>127.0.0.1 (Localhost)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyProfileDashboard;
