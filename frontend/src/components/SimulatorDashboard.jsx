import React, { useState } from 'react';
import { api } from '../services/api';

const SimulatorDashboard = ({ onLeadSubmitted, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'Full-Stack Development',
    budget: '5000',
    message: '',
    source: 'Website'
  });
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: '🔌 Ingestion API Gateway listener ready. Form submits will record to SQLite and print payload headers below.'
    }
  ]);

  const services = [
    'Full-Stack Development',
    'Mobile Application Development',
    'SaaS Product Engineering',
    'UI/UX Design & Brand Styling',
    'AI Integration & Automation',
    'Cloud Consultation'
  ];

  const budgets = [
    { label: 'Starter Project ($1,500 - $3,000)', value: '2000' },
    { label: 'Standard Web Application ($3,000 - $8,000)', value: '5000' },
    { label: 'Enterprise Platform ($10,000 - $25,000)', value: '15000' },
    { label: 'Scale-up SaaS Ecosystem ($30,000+)', value: '50000' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showToast('Please fill in required fields (Name & Email).', 'error');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      source: formData.source,
      value: parseFloat(formData.budget),
      message: `[Service Requested: ${formData.service}] - ${formData.message}`
    };

    // Log the request payload initiation
    const timeStr = new Date().toLocaleTimeString();
    const reqLog = {
      timestamp: timeStr,
      type: 'POST_REQUEST',
      endpoint: '/api/leads/submit',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FutureCRM_Gateway_v1.0',
        'Accept': 'application/json'
      },
      body: payload
    };

    setLogs(prev => [reqLog, ...prev]);

    try {
      const res = await api.submitPublicLead(payload);
      
      const resLog = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'POST_RESPONSE',
        status: 201,
        statusText: 'Created',
        body: res
      };
      setLogs(prev => [resLog, ...prev]);
      showToast('Lead captured & SQLite record created!', 'success');

      if (onLeadSubmitted) onLeadSubmitted();

      // Reset form fields
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: 'Full-Stack Development',
        budget: '5000',
        message: '',
        source: 'Website'
      });
    } catch (err) {
      const errLog = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'POST_ERROR',
        status: 500,
        message: err.message || 'Transmission failed.'
      };
      setLogs(prev => [errLog, ...prev]);
      showToast('Lead capture failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate API Webhook ingestion
  const handleSimulateWebhook = async () => {
    const names = ['Bruce Wayne', 'Clark Kent', 'Diana Prince', 'Barry Allen', 'Hal Jordan'];
    const companies = ['Wayne Enterprises', 'Daily Planet', 'Themyscira Museum', 'S.T.A.R. Labs', 'Ferris Aircraft'];
    const sources = ['Referral', 'Social Media', 'Cold Call', 'Website', 'AdWords'];
    
    const idx = Math.floor(Math.random() * names.length);
    const mockLead = {
      name: names[idx],
      email: `${names[idx].toLowerCase().replace(' ', '.')}@domain.com`,
      phone: `+1 555-01${Math.floor(Math.random()*90 + 10)}`,
      company: companies[idx],
      source: sources[idx],
      value: [5000, 12000, 35000, 120000, 500000][idx],
      message: 'Simulated API webhook conversion payload'
    };

    const timeStr = new Date().toLocaleTimeString();
    const reqLog = {
      timestamp: timeStr,
      type: 'POST_REQUEST',
      endpoint: '/api/leads/submit',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'sha256=futcrm_secret_key_sig',
        'User-Agent': 'Zapier_Webhook_Integration'
      },
      body: mockLead
    };
    setLogs(prev => [reqLog, ...prev]);

    try {
      const res = await api.submitPublicLead(mockLead);
      const resLog = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'POST_RESPONSE',
        status: 201,
        statusText: 'Created',
        body: res
      };
      setLogs(prev => [resLog, ...prev]);
      showToast('External lead ingested via webhook!', 'success');
      if (onLeadSubmitted) onLeadSubmitted();
    } catch (err) {
      const errLog = {
        timestamp: new Date().toLocaleTimeString(),
        type: 'POST_ERROR',
        status: 500,
        message: err.message || 'Webhook transmission failed.'
      };
      setLogs(prev => [errLog, ...prev]);
    }
  };

  return (
    <div className="simulator-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="simulator-dashboard-header">
        <h1>🔌 Ingestion Portal & Form Simulator</h1>
        <p className="subtitle">Submit public inquiries or trigger API webhooks to watch direct SQLite captures</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Card: Contact Form Ingestion */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>📬 Public Inquiry Form Simulator</h3>
          <p className="subtitle" style={{ marginBottom: '16px' }}>Represents a contact form page on a public portfolio or site</p>

          <form onSubmit={handleSubmit} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name *</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Tony Stark" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>Email Address *</label>
              <input 
                type="email" 
                name="email" 
                placeholder="tony@stark.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                placeholder="+1 555-0100" 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Company / Agency</label>
              <input 
                type="text" 
                name="company" 
                placeholder="Stark Industries" 
                value={formData.company} 
                onChange={handleChange} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Requested Service</label>
                <select name="service" value={formData.service} onChange={handleChange}>
                  {services.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Target Budget</label>
                <select name="budget" value={formData.budget} onChange={handleChange}>
                  {budgets.map((b, idx) => (
                    <option key={idx} value={b.value}>{b.label.split(' ($')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Inquiry Source</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option value="Website">Website Form</option>
                <option value="Social Media">Social Media Ingestion</option>
                <option value="Cold Call">Cold Outreach</option>
                <option value="Referral">Client Referral</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Detailed Message</label>
              <textarea 
                name="message" 
                placeholder="Please describe project specifications..." 
                value={formData.message} 
                onChange={handleChange}
                style={{
                  width: '100%',
                  height: '60px',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '8px' }}>
              {submitting ? 'Transmitting Form Data...' : '🚀 Submit Contact Inquiry'}
            </button>
          </form>
        </div>

        {/* Right Card: HTTP Ingestion Terminal console */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🔌 API Ingestion Payload Console</h3>
            <button className="theme-btn" onClick={handleSimulateWebhook} style={{ fontSize: '11px', padding: '4px 10px' }}>
              🔗 Trigger Webhook POST
            </button>
          </div>
          <p className="subtitle">Real-time HTTP logger tracking inbound payloads and response outputs</p>

          <div style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            overflowY: 'auto',
            maxHeight: '430px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.4'
          }}>
            {logs.map((log, index) => (
              <div key={index} style={{
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                paddingBottom: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-sub)', marginBottom: '4px' }}>
                  <span>[{log.timestamp}]</span>
                  <strong style={{
                    color: log.type.includes('ERROR') ? 'var(--accent-red)' :
                           log.type.includes('RESPONSE') ? 'var(--accent-green)' :
                           log.type.includes('REQUEST') ? 'var(--accent-pink)' : 'var(--accent-cyan)'
                  }}>{log.type}</strong>
                </div>

                {log.endpoint && (
                  <div style={{ color: 'var(--text-main)', marginBottom: '4px' }}>
                    <code>POST {log.endpoint}</code>
                  </div>
                )}

                {log.status && (
                  <div style={{ color: log.status === 201 ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: '4px' }}>
                    <code>Status: {log.status} {log.statusText || ''}</code>
                  </div>
                )}

                {log.headers && (
                  <div style={{ paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-sub)', marginBottom: '4px' }}>
                    <strong>Headers:</strong>
                    <pre style={{ margin: 0, fontSize: '10px' }}>{JSON.stringify(log.headers, null, 2)}</pre>
                  </div>
                )}

                {log.body && (
                  <div style={{ paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent-cyan)' }}>
                    <strong>Body:</strong>
                    <pre style={{ margin: 0, fontSize: '10px', color: 'var(--text-main)' }}>{JSON.stringify(log.body, null, 2)}</pre>
                  </div>
                )}

                {log.message && (
                  <div style={{ color: 'var(--text-main)' }}>
                    {log.message}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            className="theme-btn" 
            style={{ width: '100%', padding: '6px' }}
            onClick={() => setLogs([{ timestamp: new Date().toLocaleTimeString(), type: 'INFO', message: 'Console logs cleared. Ready.' }])}
          >
            🧹 Clear Console logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulatorDashboard;
