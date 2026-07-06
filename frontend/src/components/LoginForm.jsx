import React, { useState } from 'react';
import { api } from '../services/api';

const LoginForm = ({ onLoginSuccess, showToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username, password);
      showToast('Welcome back, Admin!', 'success');
      onLoginSuccess(data.user);
    } catch (err) {
      showToast(err.message || 'Login failed. Invalid credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card-3d login-card">
        <div className="card-3d-inner">
          <div className="card-glow"></div>
          <div className="login-header">
            <div className="logo-badge-3d">
              <span>F</span>
            </div>
            <h2>Secure Admin Access</h2>
            <p className="subtitle">Enter credentials to unlock CRM dashboard metrics</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Decrypting Credentials...' : 'Sign In to Dashboard →'}
            </button>
          </form>

          <div className="login-footer">
            <p>Demo Admin Account:</p>
            <code>Username: <strong>admin</strong> | Password: <strong>admin123</strong></code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
