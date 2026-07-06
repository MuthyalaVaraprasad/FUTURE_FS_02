import React, { useState } from 'react';
import { api } from '../services/api';

const PublicForm = ({ onLeadSubmitted, showToast }) => {
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
  const [submitted, setSubmitted] = useState(false);

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
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        source: formData.source,
        value: parseFloat(formData.budget),
        message: `[Service Requested: ${formData.service}] - ${formData.message}`
      };

      await api.submitPublicLead(payload);
      setSubmitted(true);
      showToast('Inquiry submitted successfully!', 'success');
      
      // Notify parent to refresh list in background
      if (onLeadSubmitted) onLeadSubmitted();
      
      // Reset form
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
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="public-form-container">
        <div className="glass-panel public-form-card submitted-card">
          <div className="success-icon-3d">✓</div>
          <h2>Inquiry Ingested!</h2>
          <p>Thank you for reaching out. Our development agency leads desk has received your request and logged it into our CRM database.</p>
          <div className="submitted-summary">
            <span>Our system automatically logged this client pipeline request.</span>
          </div>
          <button className="submit-btn" onClick={() => setSubmitted(false)}>
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="glass-panel public-form-card">
        <div className="form-header">
          <h2>Client Ingestion Inquiry Form</h2>
          <p className="subtitle">Simulate a prospective client submitting a project request on your portfolio site</p>
        </div>

        <form onSubmit={handleSubmit} className="public-client-form">
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="+1 (555) 012-3456"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company / Organization</label>
              <input
                type="text"
                id="company"
                name="company"
                placeholder="Acme Corp"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="service">Service Required</label>
              <select id="service" name="service" value={formData.service} onChange={handleChange}>
                {services.map((svc) => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="budget">Estimated Project Budget</label>
              <select id="budget" name="budget" value={formData.budget} onChange={handleChange}>
                {budgets.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="source">Lead Channel / Attribution</label>
            <select id="source" name="source" value={formData.source} onChange={handleChange}>
              <option value="Website">Website (Portfolio)</option>
              <option value="Referral">Referral Partnership</option>
              <option value="Social Media">Social Media (LinkedIn/X)</option>
              <option value="Cold Call">Cold Outreach Email</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message & Requirements</label>
            <textarea
              id="message"
              name="message"
              rows="4"
              placeholder="Tell us details about the web app or software you need developed..."
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Transmitting Ingestion Payload...' : '🚀 Submit Project Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicForm;
