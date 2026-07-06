import React, { useState, useEffect } from 'react';

const AiAssistant = ({ leads = [], showToast, currency = '$', isOpen, onClose }) => {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [activeLead, setActiveLead] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // chat, insights, email, summarizer, reports

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am FutureCRM AI Assistant. Ask me to score leads, write emails, or analyze pipeline deals.' }
  ]);

  // Email states
  const [emailType, setEmailType] = useState('Welcome'); // Welcome, Follow-up, Meeting Reminder, Proposal, Thank You
  const [emailText, setEmailText] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // Summarizer states
  const [summarizedNotes, setSummarizedNotes] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Sync selected lead details
  useEffect(() => {
    if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id.toString());
    }
  }, [leads]);

  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const found = leads.find(l => l.id.toString() === selectedLeadId);
      setActiveLead(found || null);
    }
  }, [selectedLeadId, leads]);

  if (!isOpen) return null;

  // AI features handlers
  const handleChatAction = (type) => {
    let reply = '';
    if (type === 'analyze') {
      reply = `AI Lead Audit: Found ${leads.filter(l => l.probability >= 50 && !l.tags?.includes('Archived')).length} high-priority leads with win rates exceeding 50%. Suggest targeting the proposal stage ones today.`;
    } else if (type === 'email') {
      setActiveTab('email');
      return;
    } else if (type === 'predict') {
      if (activeLead) {
        const score = activeLead.bant_budget ? 88 : 42;
        reply = `AI Prediction for ${activeLead.name}: ${score}% chance of conversion. Reason: ${activeLead.bant_budget ? 'Budget verified, responded to specifications.' : 'Budget unverified, discovery meeting scheduled.'}`;
      } else {
        reply = 'Please select a lead first.';
      }
    } else if (type === 'reports') {
      setActiveTab('reports');
      return;
    } else if (type === 'search') {
      reply = 'AI Smart Search Results: Found 2 leads needing immediate follow-ups today: Alex Johnson & Sarah Miller.';
    }

    setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      const query = userText.toLowerCase();
      let reply = "I am processing your query. Try asking 'Show hot leads', 'CRM Health' or 'Overdue tasks'.";

      if (query.includes('hot') || query.includes('likely')) {
        reply = "Hottest leads likely to convert: Alex Johnson (91% - verified budget), Michael Chang (82% - proposal sent).";
      } else if (query.includes('health')) {
        reply = "FutureCRM Health Score is 94% Excellent. All systems online. Average response time is 1.8 hours.";
      } else if (query.includes('overdue')) {
        reply = "Overdue task check: Found 1 overdue item (Send contract to Robert Downey). Recommended action: call client today.";
      } else if (query.includes('report')) {
        reply = `Sales Summary: Ingested ${leads.length} accounts. Active deal value represents ${currency}${leads.reduce((sum,l) => sum + (l.value || 0), 0).toLocaleString()}.`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  const handleGenerateEmail = () => {
    if (!activeLead) return;
    setIsDrafting(true);
    setTimeout(() => {
      setIsDrafting(false);
      const name = activeLead.name;
      const company = activeLead.company || 'your company';
      const service = activeLead.tags?.split(',')[0] || 'Software Engineering';

      let text = '';
      if (emailType === 'Welcome') {
        text = `Subject: Welcome to FutureCRM - ${service}\n\nHi ${name},\n\nThanks for reaching out! We are thrilled to partner with ${company} on your ${service} requirements. I'll call you shortly to align on specifications.`;
      } else if (emailType === 'Follow-up') {
        text = `Subject: Quick follow-up on ${service} draft\n\nHi ${name},\n\nJust checking in to see if you had any thoughts on the draft we sent. Let me know when you are free for a brief call.`;
      } else if (emailType === 'Meeting Reminder') {
        text = `Subject: Reminder: Technical specifications review meeting\n\nHi ${name},\n\nFriendly reminder that we have a Spec Review scheduled tomorrow at 11 AM. Here is the meeting link: zoom.us/j/futurecrm.`;
      } else if (emailType === 'Proposal') {
        text = `Subject: Tailored Proposal Package - ${service}\n\nHi ${name},\n\nPlease find attached the specifications proposal matching your team requirements. Let me know if the pricing fits your roadmap.`;
      } else {
        text = `Subject: Thank you for your partnership!\n\nHi ${name},\n\nThank you for signing the agreement! We are excited to kickoff this project and begin engineering next week.`;
      }
      setEmailText(text);
    }, 650);
  };

  const handleSummarizeNotes = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setIsSummarizing(false);
      if (activeLead) {
        setSummarizedNotes(`Client summary for ${activeLead.name}:\n- Interested in ${activeLead.tags?.split(',')[0] || 'Software Consulting'}.\n- Budget estimated at ${currency}${(activeLead.value || 0).toLocaleString()}.\n- Direct BANT budget verified status is ${activeLead.bant_budget ? 'CONFIRMED' : 'PENDING'}.\n- Recommended Next Action: schedule proposal overview call.`);
      } else {
        setSummarizedNotes('Client interested in CRM. Budget around $8,000. Meeting next Tuesday. Needs quotation.');
      }
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '24px',
      bottom: '24px',
      width: '380px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 243, 255, 0.25)',
      borderRadius: '16px',
      boxShadow: '0 0 40px rgba(0, 243, 255, 0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      color: '#fff',
      fontFamily: 'Outfit, sans-serif'
    }} className="animate-slide-up">
      
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <strong style={{ display: 'block', fontSize: '14px' }}>FutureCRM AI Assistant</strong>
            <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>CRM Copilot & Predictor</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', color: '#ff007f', cursor: 'pointer', fontSize: '16px' }}
        >
          ✕
        </button>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        {['chat', 'insights', 'email', 'summarizer', 'reports'].map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: activeTab === t ? 'rgba(0,243,255,0.08)' : 'transparent',
              color: activeTab === t ? 'var(--accent-cyan)' : 'var(--text-sub)',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              borderBottom: activeTab === t ? '2px solid var(--accent-cyan)' : 'none'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Client selector dropdown */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Lead context:</span>
        <select 
          value={selectedLeadId}
          onChange={(e) => setSelectedLeadId(e.target.value)}
          style={{
            flex: 1,
            padding: '6px',
            borderRadius: '4px',
            backgroundColor: '#090d16',
            color: '#fff',
            border: '1px solid var(--border-color)',
            fontSize: '11px'
          }}
        >
          {leads.filter(l => !l.tags?.includes('Archived')).map(l => (
            <option key={l.id} value={l.id.toString()}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Content panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        {/* Chat tab */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
            {/* Quick Actions grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button className="theme-btn" onClick={() => handleChatAction('analyze')} style={{ fontSize: '10px', padding: '6px' }}>🔍 Analyze Leads</button>
              <button className="theme-btn" onClick={() => handleChatAction('email')} style={{ fontSize: '10px', padding: '6px' }}>✉️ Generate Email</button>
              <button className="theme-btn" onClick={() => handleChatAction('predict')} style={{ fontSize: '10px', padding: '6px' }}>📈 Predict Win</button>
              <button className="theme-btn" onClick={() => handleChatAction('reports')} style={{ fontSize: '10px', padding: '6px' }}>📊 AI Reports</button>
            </div>

            {/* Chat Box */}
            <div style={{ flex: 1, minHeight: '160px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chatMessages.map((m, idx) => (
                <div key={idx} style={{
                  alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: m.sender === 'ai' ? 'rgba(0,243,255,0.06)' : 'rgba(255,0,127,0.06)',
                  border: `1px solid ${m.sender === 'ai' ? 'rgba(0,243,255,0.1)' : 'rgba(255,0,127,0.1)'}`,
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Ask: 'Show hot leads'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <button type="submit" className="primary-btn" style={{ padding: '8px 14px' }}>
                Ask
              </button>
            </form>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && activeLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>AI Lead Score:</span>
              <strong style={{ fontSize: '18px', color: activeLead.probability >= 70 ? 'var(--accent-green)' : 'var(--accent-pink)' }}>
                {activeLead.probability} {activeLead.probability >= 75 ? '(High Chance)' : activeLead.probability >= 50 ? '(Medium)' : '(Low)'}
              </strong>
            </div>

            {/* BANT & Predict Info */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-sub)' }}>Chance of Conversion:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{activeLead.bant_budget ? '91%' : '45%'}</strong>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-sub)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                💡 Reason: {activeLead.bant_budget ? 'Budget verified, responded to spec drafts, meeting scheduled.' : 'Budget unverified, discovery meeting scheduled.'}
              </div>
            </div>

            {/* Smart recommendations */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px' }}>🧠 Smart Recommendations:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', background: 'rgba(0,243,255,0.05)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--accent-cyan)' }}>
                  {activeLead.bant_budget ? 'Send proposal contract package immediately.' : 'Call client today to qualify BANT budget.'}
                </div>
                <div style={{ fontSize: '11px', background: 'rgba(255,0,127,0.05)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--accent-pink)' }}>
                  Snooze overdue task checklist item.
                </div>
              </div>
            </div>

            {/* CRM Health score */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
              <strong style={{ display: 'block', fontSize: '11px', color: 'var(--accent-green)' }}>CRM HEALTH SCORE: 94% EXCELLENT</strong>
              <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>No overdue tasks active, response velocity under 1.8 hours.</span>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && activeLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '12px' }}>AI Email Generator</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Welcome', 'Follow-up', 'Meeting Reminder', 'Proposal', 'Thank You'].map(type => (
                <button 
                  key={type}
                  className={`theme-btn ${emailType === type ? 'active' : ''}`}
                  onClick={() => setEmailType(type)}
                  style={{ fontSize: '9px', padding: '4px 8px' }}
                >
                  {type}
                </button>
              ))}
            </div>

            <button className="primary-btn" onClick={handleGenerateEmail} disabled={isDrafting} style={{ padding: '8px' }}>
              {isDrafting ? 'Writing copy...' : '✨ Generate Email'}
            </button>

            {emailText && (
              <textarea 
                value={emailText}
                readOnly
                style={{
                  width: '100%',
                  height: '140px',
                  padding: '8px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  resize: 'none'
                }}
              />
            )}
          </div>
        )}

        {/* Summarizer Tab */}
        {activeTab === 'summarizer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '12px' }}>AI Note Summarizer</h4>
            <p className="subtitle">Condense all profile notes and interaction milestones into highlights</p>

            <button className="primary-btn" onClick={handleSummarizeNotes} disabled={isSummarizing} style={{ padding: '8px' }}>
              {isSummarizing ? 'Analyzing notes...' : '📝 Summarize Client Notes'}
            </button>

            {summarizedNotes && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', fontSize: '11px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {summarizedNotes}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '12px' }}>AI Report Summarizer</h4>
            <p className="subtitle">Compile dynamic report sheets</p>

            {['Weekly Report', 'Monthly Report', 'Sales Summary'].map(rep => (
              <button 
                key={rep}
                className="theme-btn"
                onClick={() => {
                  showToast(`${rep} compiled. Download initiated.`, 'success');
                }}
                style={{ textAlign: 'left', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📊 {rep}</span>
                <span>➔</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AiAssistant;