import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const NotesDashboard = ({ leads = [], showToast }) => {
  const [globalNotes, setGlobalNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [pinnedIds, setPinnedIds] = useState([]); // local state for pinned notes

  const loadAllNotes = async () => {
    setLoading(true);
    try {
      const allNotes = [];
      for (const lead of leads) {
        const leadNotes = await api.getNotes(lead.id);
        leadNotes.forEach(n => {
          allNotes.push({ ...n, leadName: lead.name, leadId: lead.id });
        });
      }
      setGlobalNotes(allNotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leads.length > 0) {
      loadAllNotes();
    } else {
      setLoading(false);
    }
  }, [leads]);

  const togglePinNote = (id) => {
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
    showToast('Note pin status updated.', 'success');
  };

  // Determine note categories based on text prefixes
  const getNoteCategory = (content) => {
    if (content.startsWith('[Admin Notes]')) return 'Admin Notes';
    if (content.startsWith('[Meeting Notes]')) return 'Meeting Notes';
    if (content.startsWith('[Requirements]')) return 'Requirements';
    if (content.startsWith('[Private Notes]')) return 'Private Notes';
    return 'General Note';
  };

  const getCleanContent = (content) => {
    return content.replace(/^\[.*?\]\s*/, '');
  };

  // Filter & Sort logs (pinned elements first)
  const filteredNotes = globalNotes
    .filter(note => {
      const cat = getNoteCategory(note.content);
      const matchesSearch = 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.leadName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || cat === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const isAPinned = pinnedIds.includes(a.id);
      const isBPinned = pinnedIds.includes(b.id);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="notes-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>📝 Notes & Activity Timeline</h1>
          <p className="subtitle">Pin important notes, categorize client requirements, and audit historical timeline feeds</p>
        </div>
        
        <button className="primary-btn" onClick={loadAllNotes} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Refreshing...' : '🔄 Refresh All Notes'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-sub)' }}>TOTAL LOGGED NOTES</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-cyan)' }}>{globalNotes.length} entries</strong>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-sub)' }}>PINNED IMPORTANT</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-pink)' }}>{pinnedIds.length} pinned</strong>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '11px', color: 'var(--text-sub)' }}>MEETING SUMMARIES</h4>
          <strong style={{ fontSize: '24px', color: 'var(--accent-purple)' }}>
            {globalNotes.filter(n => getNoteCategory(n.content) === 'Meeting Notes').length} logs
          </strong>
        </div>
      </div>

      {/* Filter Options */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder="Search notes content or client names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-sub)', alignSelf: 'center' }}>Category:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: '#fff',
                border: '1px solid var(--border-color)',
                fontSize: '13px'
              }}
            >
              <option value="All">All Categories</option>
              <option value="Admin Notes">Admin Notes</option>
              <option value="Meeting Notes">Meeting Notes</option>
              <option value="Requirements">Requirements</option>
              <option value="Private Notes">Private Notes</option>
              <option value="General Note">General Notes</option>
            </select>
          </div>
        </div>

        {/* Notes Timeline Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div className="empty-notes" style={{ padding: '40px 0' }}>Loading logged interactions timeline...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="empty-notes" style={{ padding: '40px 0' }}>No notes match selected criteria.</div>
          ) : (
            filteredNotes.map(n => {
              const isPinned = pinnedIds.includes(n.id);
              const cat = getNoteCategory(n.content);
              const text = getCleanContent(n.content);

              return (
                <div 
                  key={n.id} 
                  style={{
                    padding: '16px',
                    background: isPinned ? 'rgba(0, 243, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isPinned ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'all 0.2s',
                    boxShadow: isPinned ? '0 0 15px rgba(0, 243, 255, 0.05)' : 'none'
                  }}
                >
                  {/* Pin button */}
                  <button 
                    onClick={() => togglePinNote(n.id)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: isPinned ? 'var(--accent-cyan)' : 'var(--text-sub)'
                    }}
                    title={isPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    📌
                  </button>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge-purple">{cat}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                      Timestamp: {new Date(n.created_at).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>|</span>
                    <strong style={{ fontSize: '12px', color: 'var(--accent-pink)' }}>Client: {n.leadName}</strong>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>{text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesDashboard;
