import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { TrashIcon, CalendarIcon, PlusIcon, LoadingIcon } from './Icons';

const LeadDrawer = ({ leadId, onClose, onLeadUpdated, showToast, currency = '$' }) => {
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [timeline, setTimeline] = useState([]);
  
  // Edit Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Follow-up');
  const [addingNote, setAddingNote] = useState(false);

  // BANT framework qualification
  const [bant, setBant] = useState({ budget: false, authority: false, need: false, timeline: false });
  const [bantScore, setBantScore] = useState(0);

  // Cost breakdown estimator variables
  const [designHours, setDesignHours] = useState(15);
  const [frontHours, setFrontHours] = useState(30);
  const [backHours, setBackHours] = useState(40);
  const [hourlyRate, setHourlyRate] = useState(80);

  // Micro Task checklist
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Analyze initial form inquiry requirements', done: true },
    { id: 2, text: 'Schedule 15-minute discovery call', done: false },
    { id: 3, text: 'Draft service proposal contract agreement', done: false }
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  // Auxiliary modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Discovery Call Waveform Player States
  const waveformRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 100
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Load details
  const fetchLeadDetails = async () => {
    try {
      const leadData = await api.getLead(leadId);
      const notesData = await api.getNotes(leadId);
      const timelineData = await api.getTimeline(leadId);
      
      setLead(leadData);
      setEditForm(leadData);
      setNotes(notesData);
      setTimeline(timelineData);

      // Parse BANT score directly from SQLite columns
      setBant({
        budget: leadData.bant_budget === 1,
        authority: leadData.bant_authority === 1,
        need: leadData.bant_need === 1,
        timeline: leadData.bant_timeline === 1
      });
    } catch (err) {
      showToast('Failed to load lead details.', 'error');
      onClose();
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  // Recalculate BANT score
  useEffect(() => {
    let score = 0;
    if (bant.budget) score += 25;
    if (bant.authority) score += 25;
    if (bant.need) score += 25;
    if (bant.timeline) score += 25;
    setBantScore(score);
  }, [bant]);

  // AI Lead Score calculation
  const calculateAiScore = () => {
    let score = 20; // baseline
    if (bant.budget) score += 20;
    if (bant.authority) score += 10;
    if (bant.need) score += 10;
    if (bant.timeline) score += 10;
    score += Math.round((lead?.probability || 0) * 0.2);
    score += Math.min(notes.length * 2.5, 10);
    return Math.min(score, 100);
  };

  const aiScore = calculateAiScore();

  // Sentiment Analysis from actual notes content
  const analyzeSentiment = () => {
    if (notes.length === 0) return { label: 'Neutral', score: 0, color: 'var(--accent-cyan)', bg: 'rgba(0, 243, 255, 0.1)' };

    const positiveWords = ['happy', 'ready', 'interested', 'excited', 'agree', 'good', 'proceed', 'accept', 'signed', 'positive', 'love', 'great', 'yes', 'convert', 'start', 'qualified', 'clear', 'meet'];
    const negativeWords = ['unhappy', 'expensive', 'slow', 'delay', 'cancel', 'angry', 'bad', 'budget limit', 'no', 'reject', 'lost', 'issue', 'problem', 'disagree', 'high', 'concerned', 'wait'];

    let posCount = 0;
    let negCount = 0;

    notes.forEach(note => {
      const content = (note.content || '').toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) posCount++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negCount++;
      });
    });

    if (posCount > negCount) {
      return { label: 'Positive Intent', score: posCount - negCount, color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.15)' };
    } else if (negCount > posCount) {
      return { label: 'Concerned / High Risk', score: negCount - posCount, color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.15)' };
    } else {
      return { label: 'Neutral Context', score: 0, color: 'var(--accent-cyan)', bg: 'rgba(0, 243, 255, 0.1)' };
    }
  };

  const sentiment = analyzeSentiment();

  // Drive playback animation
  useEffect(() => {
    let animId;
    if (isPlaying) {
      const step = () => {
        setCurrentTime(prev => {
          const next = prev + 0.35 * playbackSpeed;
          if (next >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed]);

  // Draw Audio Waveform on Canvas
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = waveformRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const barWidth = 3;
      const gap = 2;
      const barCount = Math.floor(w / (barWidth + gap));
      
      // Generate deterministic height values based on index to create wave shapes
      const heights = [];
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 4;
        const heightVal = Math.abs(Math.sin(angle) * 0.45 + Math.cos(angle * 2) * 0.3 + Math.sin(angle * 6) * 0.1) * (h - 12) + 6;
        heights.push(heightVal);
      }

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const barHeight = heights[i];
        const y = (h - barHeight) / 2;

        // Determine if this bar is before or after progress line
        const progressIndex = (currentTime / 100) * barCount;
        const isPast = i <= progressIndex;

        if (isPast) {
          ctx.fillStyle = 'var(--accent-pink)';
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'var(--accent-pink)';
        } else {
          ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        ctx.fill();
      }
    };

    drawWaveform();

    window.addEventListener('resize', drawWaveform);
    return () => {
      window.removeEventListener('resize', drawWaveform);
    };
  }, [currentTime]);

  if (!lead) {
    return (
      <div className="drawer-overlay">
        <div className="drawer-panel loading-drawer">
          <LoadingIcon className="w-8 h-8 text-cyan animate-spin" />
          <span>Retrieving Lead Profile...</span>
        </div>
      </div>
    );
  }

  // Handle Edit Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Lead Edits
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = { 
      ...editForm,
      bant_budget: bant.budget ? 1 : 0,
      bant_authority: bant.authority ? 1 : 0,
      bant_need: bant.need ? 1 : 0,
      bant_timeline: bant.timeline ? 1 : 0
    };

    try {
      await api.updateLead(lead.id, payload);
      showToast('Lead profile updated successfully.', 'success');
      setIsEditing(false);
      await fetchLeadDetails();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to update lead.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Append Cost Estimator items into Deal Value
  const handleApplyCostEstimate = () => {
    const calculatedSum = (designHours + frontHours + backHours) * hourlyRate;
    setEditForm((prev) => ({ ...prev, value: calculatedSum }));
    showToast(`Estimator sum (${currency}${calculatedSum}) loaded into budget input.`, 'success');
  };

  // BANT Checkbox changes
  const handleBantChange = async (key) => {
    const updatedBant = { ...bant, [key]: !bant[key] };
    setBant(updatedBant);

    try {
      const payload = {
        ...lead,
        bant_budget: updatedBant.budget ? 1 : 0,
        bant_authority: updatedBant.authority ? 1 : 0,
        bant_need: updatedBant.need ? 1 : 0,
        bant_timeline: updatedBant.timeline ? 1 : 0
      };
      await api.updateLead(lead.id, payload);
      if (onLeadUpdated) onLeadUpdated();
      await fetchLeadDetails();
    } catch (err) {
      showToast('Failed to save BANT update.', 'error');
    }
  };

  // Add micro task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTaskText, done: false }
    ]);
    setNewTaskText('');
  };

  // Toggle task checkbox
  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // Delete task item
  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Add follow-up note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setAddingNote(true);
    try {
      const taggedContent = `[${noteCategory}] ${newNoteContent}`;
      await api.addNote(lead.id, taggedContent);
      setNewNoteContent('');
      showToast('Follow-up interaction note saved.', 'success');
      await fetchLeadDetails();
    } catch (err) {
      showToast('Failed to add note.', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Delete note?')) {
      try {
        await api.deleteNote(lead.id, noteId);
        showToast('Note deleted.', 'success');
        await fetchLeadDetails();
      } catch (err) {
        showToast('Failed to delete note.', 'error');
      }
    }
  };

  // Countdown timer calculations
  const calculateDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Scheduled Today';
    return `${days} days remaining`;
  };

  const countdownText = calculateDaysRemaining(lead.followup_date);

  // Quick lookup anchors
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(lead.name + ' ' + (lead.company || ''))}`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-meta-title">
            <span className={`status-badge badge-${lead.status}`}>{lead.status}</span>
            <h2>{lead.name}</h2>
            {lead.company && <p className="company-subtitle">{lead.company}</p>}
          </div>
          <button className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {/* AI lead insights panel */}
          <div className="drawer-section ai-insights-dashboard-strip" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            gap: '16px',
            marginBottom: '20px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            backdropFilter: 'blur(4px)'
          }}>
            {/* AI Score Radial Gauge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: `conic-gradient(var(--accent-pink) ${aiScore * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255, 0, 127, 0.25)',
                position: 'relative'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#0a0e1a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{aiScore}</span>
                  <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.5px' }}>Score</span>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-sub)' }}>AI Lead Score</span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '50px', backgroundColor: 'var(--border-color)' }}></div>

            {/* Sentiment Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <div style={{
                color: sentiment.color,
                background: sentiment.bg,
                border: `1px solid ${sentiment.color}33`,
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 0 10px ${sentiment.color}1a`
              }}>
                <span>{sentiment.label === 'Positive Intent' ? '😊' : sentiment.label === 'Concerned / High Risk' ? '⚠️' : '💬'}</span>
                <span>{sentiment.label}</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-sub)' }}>Client Sentiment</span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '50px', backgroundColor: 'var(--border-color)' }}></div>

            {/* BANT summary progress */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                {Math.round(bantScore / 25)}/4
              </div>
              <div style={{ width: '80px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${bantScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))', borderRadius: '3px' }}></div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-sub)' }}>BANT Qualifiers</span>
            </div>
          </div>

          {/* Section: Action buttons */}
          <div className="quick-actions-strip">
            <a href={`mailto:${lead.email}`} className="action-strip-btn email-btn">✉ Email Client</a>
            <a href={googleSearchUrl} target="_blank" rel="noreferrer" className="action-strip-btn whatsapp-btn">🔍 Google Find</a>
            <a href={linkedinSearchUrl} target="_blank" rel="noreferrer" className="action-strip-btn calendar-btn">💼 LinkedIn Find</a>
          </div>

          {/* New Section: Wizards & Agreement Documents */}
          <div className="drawer-section documentation-wizards-panel">
            <h3>Sales Agreement Wizards</h3>
            <div className="quick-actions-strip grid-2">
              <button className="icon-btn-text" onClick={() => setShowContractModal(true)}>
                📄 Build Contract Agreement
              </button>
              <button className="icon-btn-text" onClick={() => setShowInvoiceModal(true)}>
                💰 Build Deposit Invoice
              </button>
            </div>
          </div>

          {/* Section: BANT Qualification Framework */}
          <div className="drawer-section bant-framework-section">
            <div className="section-header-row">
              <h3>BANT Qualification Score</h3>
              <div className="bant-score-badge fill-green">{bantScore}% Qualify</div>
            </div>
            <div className="bant-checkboxes-grid">
              <label className="bant-checkbox-item">
                <input type="checkbox" checked={bant.budget} onChange={() => handleBantChange('budget')} />
                <div className="bant-texts">
                  <strong>[B] Budget Approved</strong>
                  <span>Client budget matches core pricing brackets</span>
                </div>
              </label>
              <label className="bant-checkbox-item">
                <input type="checkbox" checked={bant.authority} onChange={() => handleBantChange('authority')} />
                <div className="bant-texts">
                  <strong>[A] Decision Authority</strong>
                  <span>Contact is the project decision maker</span>
                </div>
              </label>
              <label className="bant-checkbox-item">
                <input type="checkbox" checked={bant.need} onChange={() => handleBantChange('need')} />
                <div className="bant-texts">
                  <strong>[N] Technical Need</strong>
                  <span>Clear project requirements fit capabilities</span>
                </div>
              </label>
              <label className="bant-checkbox-item">
                <input type="checkbox" checked={bant.timeline} onChange={() => handleBantChange('timeline')} />
                <div className="bant-texts">
                  <strong>[T] Launch Timeline</strong>
                  <span>Project kicks off within the next 90 days</span>
                </div>
              </label>
            </div>
          </div>

          {/* Discovery Call Waveform Player Section */}
          <div className="drawer-section audio-waveform-section" style={{
            background: 'rgba(0, 243, 255, 0.02)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 0 20px rgba(0, 243, 255, 0.01)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <span>🎙️</span> Discovery Call Analysis
              </h3>
              <span className="badge-purple font-mono" style={{ fontSize: '10px', padding: '2px 6px' }}>AI Transcript</span>
            </div>
            <p className="subtitle" style={{ marginBottom: '12px' }}>Listen to call audio recording and analyze intent</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isPlaying ? 'var(--accent-pink)' : 'var(--accent-cyan)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: isPlaying ? '0 0 10px rgba(255, 0, 127, 0.4)' : '0 0 10px rgba(0, 243, 255, 0.4)'
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <canvas 
                ref={waveformRef} 
                style={{ flex: 1, height: '40px', background: 'transparent' }}
              />

              <button 
                onClick={() => setPlaybackSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-sub)',
                  fontSize: '10px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  width: '42px',
                  textAlign: 'center'
                }}
              >
                {playbackSpeed}x
              </button>
            </div>

            <div style={{ 
              marginTop: '12px', 
              padding: '10px', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '6px', 
              fontSize: '11px', 
              lineHeight: '1.4', 
              fontFamily: 'var(--font-mono)',
              borderLeft: '2px solid var(--accent-pink)',
              color: 'var(--text-sub)'
            }}>
              {currentTime === 0 && (
                <em>Click Play to start listening to the conversation recording...</em>
              )}
              {currentTime > 0 && currentTime < 30 && (
                <div>
                  <strong style={{ color: 'var(--accent-cyan)' }}>[0:04] Rep:</strong> Thanks for connecting! Can you tell me about your project needs?
                </div>
              )}
              {currentTime >= 30 && currentTime < 65 && (
                <div>
                  <strong style={{ color: 'var(--accent-pink)' }}>[0:15] Client:</strong> We need a high-fidelity glassmorphic React app connected to an SQLite backend. We have a solid budget.
                </div>
              )}
              {currentTime >= 65 && currentTime < 100 && (
                <div>
                  <strong style={{ color: 'var(--accent-cyan)' }}>[0:32] Rep:</strong> That fits our capabilities perfectly. I will draft the service SLA contract today.
                </div>
              )}
            </div>
          </div>

          {/* Section: Cost Itemizer Estimator (Calculates Value) */}
          <div className="drawer-section cost-itemizer-section">
            <h3>Project Cost Breakdown Itemizer</h3>
            <p className="subtitle">Break down hours to calculate deal value automatically</p>
            <div className="itemizer-sliders-grid">
              <div className="slider-group">
                <div className="slider-labels">
                  <span>UI/UX Design Hours:</span>
                  <strong>{designHours}h</strong>
                </div>
                <input type="range" min="5" max="60" value={designHours} onChange={(e) => setDesignHours(parseInt(e.target.value))} className="settings-slider" />
              </div>
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Frontend Dev Hours:</span>
                  <strong>{frontHours}h</strong>
                </div>
                <input type="range" min="10" max="120" value={frontHours} onChange={(e) => setFrontHours(parseInt(e.target.value))} className="settings-slider" />
              </div>
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Backend Integration:</span>
                  <strong>{backHours}h</strong>
                </div>
                <input type="range" min="10" max="150" value={backHours} onChange={(e) => setBackHours(parseInt(e.target.value))} className="settings-slider" />
              </div>
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Hourly Agency Rate:</span>
                  <strong>{currency}{hourlyRate}/hr</strong>
                </div>
                <input type="range" min="40" max="250" step="5" value={hourlyRate} onChange={(e) => setHourlyRate(parseInt(e.target.value))} className="settings-slider" />
              </div>
            </div>
            <div className="itemizer-footer">
              <div className="itemizer-sum">
                <span>Calculated Sum:</span>
                <strong>{currency}{((designHours + frontHours + backHours) * hourlyRate).toLocaleString()}</strong>
              </div>
              <button className="primary-btn apply-cost-btn" onClick={handleApplyCostEstimate}>
                ✓ Apply Budget Value
              </button>
            </div>
          </div>

          {/* Section: Task Checklist Manager */}
          <div className="drawer-section checklist-tasks-section">
            <h3>CRM Lead Checklist Tasks</h3>
            
            <form onSubmit={handleAddTask} className="note-entry-form">
              <input
                type="text"
                placeholder="Add new task (e.g. Schedule call)..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                required
              />
              <button type="submit" className="add-note-btn">
                <PlusIcon className="w-4 h-4" />
              </button>
            </form>

            <div className="tasks-feed">
              {tasks.length === 0 ? (
                <div className="empty-notes">No tasks created.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="task-row">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => handleToggleTask(t.id)}
                    />
                    <span className={`task-text-span ${t.done ? 'task-done' : ''}`}>{t.text}</span>
                    <button className="delete-task-btn" onClick={() => handleDeleteTask(t.id)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Edit Lead Details */}
          <div className="drawer-section">
            <div className="section-header-row">
              <h3>Lead Profile Details</h3>
              <button className="text-action-link" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel Edit' : 'Edit Fields'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="drawer-edit-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={editForm.phone || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Company / Org</label>
                  <input type="text" name="company" value={editForm.company || ''} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Pipeline Stage Status</label>
                  <select name="status" value={editForm.status} onChange={handleInputChange}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="proposal">Proposal Sent</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Project Value ({currency})</label>
                  <input type="number" name="value" value={editForm.value} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Confidence (%)</label>
                  <input type="number" name="probability" value={editForm.probability} onChange={handleInputChange} min="0" max="100" />
                </div>
                <div className="form-group">
                  <label>Custom Labels / Tags</label>
                  <input type="text" name="tags" value={editForm.tags || ''} onChange={handleInputChange} placeholder="Urgent, Tech Stack" />
                </div>
                <div className="form-group">
                  <label>Next Follow-up Task Date</label>
                  <input type="date" name="followup_date" value={editForm.followup_date || ''} onChange={handleInputChange} />
                </div>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving changes...' : 'Save Lead Profile'}
                </button>
              </form>
            ) : (
              <div className="details-read-only">
                <div className="details-grid">
                  <div className="detail-item">
                    <span>Email</span>
                    <strong>{lead.email}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Phone</span>
                    <strong>{lead.phone || <em className="dim-text">Unavailable</em>}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Channel Source</span>
                    <strong>{lead.source}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Estimated Revenue</span>
                    <strong className="text-cyan">{currency}{(lead.value || 0).toLocaleString()}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Probability</span>
                    <strong>{lead.probability}% conversion rate</strong>
                  </div>
                  <div className="detail-item">
                    <span>Created Date</span>
                    <strong>{new Date(lead.created_at).toLocaleString()}</strong>
                  </div>
                </div>

                {lead.tags && (
                  <div className="tags-read-section">
                    <span>Active Tags:</span>
                    <div className="read-tags-list">
                      {lead.tags.split(',').map((t, idx) => (
                        <span key={idx} className="drawer-tag-badge">{t.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {lead.followup_date ? (
                  <div className="followup-alert-box alert-active">
                    <CalendarIcon className="w-5 h-5" />
                    <div>
                      <span>Scheduled Follow-up Task:</span>
                      <strong>{lead.followup_date} ({countdownText})</strong>
                    </div>
                  </div>
                ) : (
                  <div className="followup-alert-box alert-empty">
                    <CalendarIcon className="w-5 h-5" />
                    <span>No follow-up action scheduled.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Notes & Comments */}
          <div className="drawer-section notes-section">
            <h3>Follow-up Communications Log</h3>
            
            <form onSubmit={handleAddNote} className="note-entry-form">
              <select 
                value={noteCategory} 
                onChange={(e) => setNoteCategory(e.target.value)} 
                className="note-category-dropdown"
              >
                <option value="Follow-up">Follow-up</option>
                <option value="Technical">Technical</option>
                <option value="Contract">Contract</option>
                <option value="Inquiry">Inquiry</option>
              </select>
              <input
                type="text"
                placeholder="Log call/interaction details..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                required
              />
              <button type="submit" disabled={addingNote} className="add-note-btn">
                {addingNote ? '...' : <PlusIcon className="w-4 h-4" />}
              </button>
            </form>

            <div className="notes-feed">
              {notes.length === 0 ? (
                <div className="empty-notes">No interactions logged yet.</div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="note-card">
                    <div className="note-card-meta">
                      <span className="note-time">{new Date(n.created_at).toLocaleString()}</span>
                      <button className="delete-note-btn" onClick={() => handleDeleteNote(n.id)}>
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="note-content">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Activity History Timeline */}
          <div className="drawer-section timeline-section">
            <h3>Audit Log Timeline</h3>
            <div className="timeline-tree">
              {timeline.length === 0 ? (
                <div className="empty-timeline">No history recorded yet.</div>
              ) : (
                timeline.map((item) => (
                  <div key={item.id} className="timeline-node">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span className="timeline-action">{item.action}</span>
                      <span className="timeline-date">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AUXILIARY MODAL 1: Contract Agreement Generator */}
      {showContractModal && createPortal(
        <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>Master Service SLA Contract</h2>
              <button className="modal-close" onClick={() => setShowContractModal(false)}>✕</button>
            </div>
            <div className="contract-prefilled-text font-mono" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5' }}>
{`MASTER SERVICES AGREEMENT
-------------------------
CLIENT PARTNER: ${lead.name}
COMPANY/ORG: ${lead.company || 'Individual Client'}
PROJECT VALUE: ${currency}${(lead.value || 0).toLocaleString()}
AGENCY PROVIDER: FutureCRM Engineering Services Ltd.

1. SCOPE OF SERVICES
Provider agrees to deliver comprehensive technical consulting, web application engineering, and interface styling designs as outlined in BANT qualification specifications.

2. COMPENSATION & PAYMENTS
Total estimated contract value is set at ${currency}${(lead.value || 0).toLocaleString()}. Client agrees to remit a 50% upfront deposit before milestones kick-off.

3. INTELLECTUAL PROPERTY
Upon full payment receipt, all rights, title, and interest in design layouts, source code, and configurations transfer to the Client.

IN WITNESS WHEREOF, the parties hereto have executed this SLA Contract.

Authorized Provider Signature:
FutureCRM Engineering Desk (Digital signature)

Client Signature:
${lead.name} (Prefilled online sign)`}
            </div>
            <button className="primary-btn margin-top-12" onClick={() => {
              navigator.clipboard.writeText(document.querySelector('.contract-prefilled-text').innerText);
              showToast('Contract copyied to clipboard.', 'success');
            }}>
              📋 Copy Service Agreement
            </button>
          </div>
        </div>,
        document.getElementById('modal-portal-root') || document.body
      )}

      {/* AUXILIARY MODAL 2: Deposit Invoice Generator */}
      {showInvoiceModal && createPortal(
        <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>Mock Client Retainer Invoice</h2>
              <button className="modal-close" onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>
            <div className="invoice-prefilled-text font-mono" style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5' }}>
{`INVOICE RECEIPT
---------------
INVOICE ID: INV-2026-${lead.id}
DATE: ${new Date().toLocaleDateString()}
BILL TO:
Name: ${lead.name}
Company: ${lead.company || 'N/A'}
Email: ${lead.email}

PROJECT: Full-Stack Engineering Retainer Services
TOTAL EST. DEAL: ${currency}${(lead.value || 0).toLocaleString()}
50% UPFRONT RETAINER REQUIRED: ${currency}${((lead.value || 0) * 0.5).toLocaleString()}

PAYMENT TERMS: Due upon invoice ingestion.
BANK TRANSFERS TO: FutureCRM Engineering Escrow Bank
SWIFT GATEWAY: FUTCRM2026SGL

Thank you for your business!`}
            </div>
            <button className="primary-btn margin-top-12" onClick={() => {
              navigator.clipboard.writeText(document.querySelector('.invoice-prefilled-text').innerText);
              showToast('Invoice details copied to clipboard.', 'success');
            }}>
              📋 Copy Invoice Details
            </button>
          </div>
        </div>,
        document.getElementById('modal-portal-root') || document.body
      )}
    </div>
  );
};

export default LeadDrawer;
