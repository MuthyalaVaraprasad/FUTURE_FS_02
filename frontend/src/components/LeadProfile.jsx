import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const LeadProfile = ({ leads = [], currentLeadId, onSelectLead, showToast, currency = '$' }) => {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteCat, setNoteCat] = useState('Internal Notes'); // Internal Notes, Meeting Notes, Requirements
  const [starred, setStarred] = useState(false);

  // Document attachments state
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'Quotation_SLA_Draft.pdf', size: '140 KB', date: '2026-07-06' },
    { id: 2, name: 'Deposit_Retainer_Invoice.pdf', size: '92 KB', date: '2026-07-05' }
  ]);
  const [uploadName, setUploadName] = useState('');

  // Communication logs history list
  const [commLogs, setCommLogs] = useState([
    { id: 1, type: 'Call', detail: 'Outbound discovery call completed. Left voice message.', timestamp: '2026-07-06 09:30 AM' },
    { id: 2, type: 'Email', detail: 'Sent initial proposal draft files via Gmail.', timestamp: '2026-07-05 04:15 PM' },
    { id: 3, type: 'Meeting', detail: 'Zoom tech spec review meeting scheduled with rep.', timestamp: '2026-07-06 11:30 AM' }
  ]);
  const [newCommType, setNewCommType] = useState('Call');
  const [newCommDetail, setNewCommDetail] = useState('');

  // Initialize selected lead ID from props
  useEffect(() => {
    if (currentLeadId) {
      setSelectedLeadId(currentLeadId.toString());
    } else if (leads.length > 0) {
      setSelectedLeadId(leads[0].id.toString());
    }
  }, [currentLeadId, leads]);

  // Load selected lead data
  useEffect(() => {
    if (selectedLeadId) {
      const loadDetails = async () => {
        try {
          const idNum = parseInt(selectedLeadId);
          const data = leads.find(l => l.id === idNum) || await api.getLead(idNum);
          const notesData = await api.getNotes(idNum);
          setLead(data);
          setNotes(notesData);
          setStarred(data.tags?.includes('Starred') || false);
        } catch (e) {
          console.error(e);
        }
      };
      loadDetails();
    }
  }, [selectedLeadId, leads]);

  const handleSelectChange = (e) => {
    setSelectedLeadId(e.target.value);
    if (onSelectLead) onSelectLead(parseInt(e.target.value));
  };

  const handleStarToggle = async () => {
    if (!lead) return;
    const updatedTags = starred 
      ? (lead.tags || '').replace(', Starred', '').replace('Starred', '').trim()
      : lead.tags ? `${lead.tags}, Starred` : 'Starred';
    
    try {
      await api.updateLead(lead.id, { ...lead, tags: updatedTags });
      setStarred(!starred);
      showToast(starred ? 'Removed from favorites.' : 'Added to favorites!', 'success');
    } catch (e) {
      showToast('Error updating status.', 'error');
    }
  };

  const handleAddProfileNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !lead) return;
    try {
      await api.addNote(lead.id, {
        content: `[${noteCat}] ${newNote}`,
        category: 'Follow-up'
      });
      showToast('Internal note saved.', 'success');
      setNewNote('');
      const updatedNotes = await api.getNotes(lead.id);
      setNotes(updatedNotes);
    } catch (err) {
      showToast('Failed to add note.', 'error');
    }
  };

  const handleUploadFile = (e) => {
    e.preventDefault();
    if (!uploadName.trim()) return;
    const newFile = {
      id: Date.now(),
      name: uploadName.endsWith('.pdf') ? uploadName : `${uploadName}.pdf`,
      size: `${Math.floor(Math.random() * 200 + 40)} KB`,
      date: new Date().toISOString().split('T')[0]
    };
    setAttachments(prev => [newFile, ...prev]);
    setUploadName('');
    showToast('Document attachment uploaded successfully.', 'success');
  };

  const handleDeleteFile = (id) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
    showToast('Document deleted.', 'info');
  };

  const handleAddCommLog = (e) => {
    e.preventDefault();
    if (!newCommDetail.trim()) return;
    const log = {
      id: Date.now(),
      type: newCommType,
      detail: newCommDetail,
      timestamp: new Date().toLocaleString()
    };
    setCommLogs(prev => [log, ...prev]);
    setNewCommDetail('');
    showToast('Communication log recorded.', 'success');
  };

  const copyContactInfo = () => {
    if (!lead) return;
    const text = `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nCompany: ${lead.company || 'N/A'}`;
    navigator.clipboard.writeText(text);
    showToast('Contact details copied!', 'success');
  };

  const getTimelineStage = (status) => {
    const stages = ['new', 'contacted', 'proposal', 'converted'];
    const idx = stages.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const timelineIndex = lead ? getTimelineStage(lead.status) : 0;

  return (
    <div className="lead-profile-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>👤 Lead Profile Dashboard</h1>
          <p className="subtitle">Single client 360° portfolio overview. Manage notes, files, and timeline records</p>
        </div>
        
        {/* Switch profiles dropdown */}
        <select 
          value={selectedLeadId}
          onChange={handleSelectChange}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            fontSize: '13px'
          }}
        >
          <option value="" disabled>-- Select Client Profile --</option>
          {leads.filter(l => !l.tags?.includes('Archived')).map(l => (
            <option key={l.id} value={l.id}>{l.name} ({l.company || 'Individual'})</option>
          ))}
        </select>
      </div>

      {lead ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Left Column: Personal and Business Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Personal Details */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <button 
                onClick={handleStarToggle}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: starred ? '#fbbf24' : 'var(--text-sub)'
                }}
              >
                {starred ? '★' : '☆'}
              </button>

              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-pink))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '16px',
                border: '2px solid var(--border-color)',
                boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)'
              }}>
                {lead.name.split(' ').map(n => n[0]).join('')}
              </div>

              <h2 style={{ margin: 0 }}>{lead.name}</h2>
              <p className="subtitle" style={{ margin: '4px 0 16px' }}>{lead.company || 'Private Client'}</p>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-sub)' }}>Email:</span>
                  <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>{lead.email}</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-sub)' }}>Phone:</span>
                  <span>{lead.phone || 'Unavailable'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-sub)' }}>Website:</span>
                  <a href={lead.company ? `https://www.${lead.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-pink)', textDecoration: 'none' }}>
                    Visit Website ↗
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-sub)' }}>Acquisition:</span>
                  <span>{lead.source}</span>
                </div>
              </div>

              <button className="primary-btn" onClick={copyContactInfo} style={{ width: '100%', marginTop: '20px', padding: '8px' }}>
                📋 Copy Contact Details
              </button>
            </div>

            {/* Business info */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3>💼 Business Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>Deal Budget:</span>
                  <strong style={{ color: 'var(--accent-green)', fontSize: '15px' }}>{currency}{(lead.value || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>Service of Interest:</span>
                  <span className="badge-purple">{lead.tags?.split(',')[0] || 'Software Engineering'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>Lead Priority:</span>
                  <span className="status-badge" style={{ background: 'rgba(255, 0, 127, 0.1)', color: 'var(--accent-pink)', border: 'none' }}>High</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>Assigned Employee:</span>
                  <span>System Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Timelines, Notes, Documents, Interactions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Timeline */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3>🎯 Pipeline Stage Timeline</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', position: 'relative', padding: '10px 0' }}>
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  left: '5%',
                  right: '5%',
                  height: '2px',
                  backgroundColor: 'rgba(255,255,255,0.08)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  left: '5%',
                  width: `${timelineIndex * 30}%`,
                  height: '2px',
                  backgroundColor: 'var(--accent-cyan)',
                  transition: 'width 0.3s ease'
                }} />

                {['Inquiry', 'Discovery', 'Proposal', 'Converted'].map((stage, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2, flex: 1 }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: idx <= timelineIndex ? 'var(--accent-cyan)' : '#101426',
                      border: `2px solid ${idx <= timelineIndex ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#fff',
                      fontWeight: 'bold'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '10px', color: idx <= timelineIndex ? 'var(--text-main)' : 'var(--text-sub)' }}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Attachments Locker */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3>📁 File Attachments Folder</h3>
              <form onSubmit={handleUploadFile} style={{ display: 'flex', gap: '8px', marginBottom: '14px', marginTop: '10px' }}>
                <input 
                  type="text"
                  placeholder="File name (e.g. Master_Agreement)..."
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px'
                  }}
                  required
                />
                <button type="submit" className="primary-btn" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  📤 Upload
                </button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {attachments.map(file => (
                  <div key={file.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px' }}>📄</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</strong>
                        <span style={{ fontSize: '9px', color: 'var(--text-sub)' }}>{file.size}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <a href="#" onClick={(e) => { e.preventDefault(); showToast(`Downloading ${file.name}...`, 'success'); }} style={{ fontSize: '11px', textDecoration: 'none' }}>📥</a>
                      <button onClick={() => handleDeleteFile(file.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorized Notes */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3>📝 Categorized Internal Notes</h3>
              
              <form onSubmit={handleAddProfileNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={noteCat}
                    onChange={(e) => setNoteCat(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px'
                    }}
                  >
                    <option value="Internal Notes">Internal Notes</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="Requirements">Requirements</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Log note text..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <button type="submit" className="primary-btn" style={{ padding: '8px' }}>
                  Save Note
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-sub)' }}>{new Date(n.created_at).toLocaleString()}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{n.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Communication Logs */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3>📞 Communication Log History</h3>
              
              <form onSubmit={handleAddCommLog} style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={newCommType} 
                  onChange={(e) => setNewCommType(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px'
                  }}
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Meeting">Meeting</option>
                </select>

                <input 
                  type="text" 
                  placeholder="E.g. Sent quotation details..."
                  value={newCommDetail} 
                  onChange={(e) => setNewCommDetail(e.target.value)} 
                  required
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px'
                  }}
                />

                <button type="submit" className="primary-btn" style={{ padding: '8px 14px' }}>
                  Log
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {commLogs.map(log => (
                  <div key={log.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge-purple" style={{ fontSize: '8px', padding: '1px 4px', marginRight: '6px' }}>{log.type}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-main)' }}>{log.detail}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-sub)' }}>{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="empty-notes" style={{ padding: '80px 0', textAlign: 'center' }}>Please seed your local database leads first in CRM settings.</div>
      )}
    </div>
  );
};

export default LeadProfile;
