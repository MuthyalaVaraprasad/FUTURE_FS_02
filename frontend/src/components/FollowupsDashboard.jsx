import React, { useState } from 'react';

const FollowupsDashboard = ({ leads = [], showToast }) => {
  const [calendarMode, setCalendarMode] = useState('month'); // month, week, day
  const [activeTasks, setActiveTasks] = useState([
    { id: 101, client: 'Alex Johnson', task: 'Follow up on design invoice payment', date: '2026-07-06', time: '10:00 AM', priority: 'High', status: 'Pending' },
    { id: 102, client: 'Sarah Miller', task: 'Review feedback on draft SLA contract', date: '2026-07-07', time: '2:30 PM', priority: 'Medium', status: 'Pending' },
    { id: 103, client: 'Michael Chang', task: 'Schedule tech arch call with engineering desk', date: '2026-07-09', time: '11:15 AM', priority: 'High', status: 'Pending' },
    { id: 104, client: 'Robert Downey', task: 'Send finalized contract package', date: '2026-07-05', time: '9:00 AM', priority: 'High', status: 'Overdue' }
  ]);

  const handleAction = (id, action) => {
    if (action === 'complete') {
      setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
      showToast('Task marked as completed!', 'success');
    } else if (action === 'cancel') {
      setActiveTasks(prev => prev.filter(t => t.id !== id));
      showToast('Task follow-up cancelled.', 'info');
    } else if (action === 'reschedule') {
      const newDate = prompt('Enter new date (YYYY-MM-DD):', '2026-07-12');
      if (newDate) {
        setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, date: newDate, status: 'Pending' } : t));
        showToast('Task rescheduled.', 'success');
      }
    }
  };

  // Render simple calendar grid
  const renderCalendarGrid = () => {
    if (calendarMode === 'month') {
      // Mock month calendar from Mon to Sun
      const days = Array.from({ length: 30 }, (_, i) => i + 1);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '12px' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-sub)', fontWeight: 'bold', paddingBottom: '4px' }}>{day}</div>
          ))}
          {days.map(d => {
            const hasTask = activeTasks.some(t => parseInt(t.date.split('-')[2]) === d);
            return (
              <div 
                key={d} 
                style={{
                  height: '56px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="theme-btn"
                onClick={() => showToast(`Selected date: July ${d}, 2026`, 'info')}
              >
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{d}</span>
                {hasTask && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'var(--accent-pink)',
                    borderRadius: '50%',
                    alignSelf: 'center',
                    boxShadow: '0 0 8px var(--accent-pink)'
                  }}></div>
                )}
              </div>
            );
          })}
        </div>
      );
    } else if (calendarMode === 'week') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '12px' }}>
          {['Mon 6', 'Tue 7', 'Wed 8', 'Thu 9', 'Fri 10'].map((day, idx) => {
            const dateStr = `2026-07-0${idx + 6}`;
            const tasksOnDay = activeTasks.filter(t => t.date === dateStr);
            return (
              <div key={day} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', minHeight: '120px' }}>
                <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{day}</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {tasksOnDay.map(t => (
                    <div key={t.id} style={{ fontSize: '10px', background: 'rgba(255, 0, 127, 0.08)', padding: '6px', borderRadius: '4px', borderLeft: '2px solid var(--accent-pink)' }}>
                      <strong>{t.time}</strong> - {t.client}
                    </div>
                  ))}
                  {tasksOnDay.length === 0 && <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>No follow-ups</span>}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Daily view
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
          <strong style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>Daily Agenda: Monday July 6, 2026</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-pink)', width: '60px' }}>10:00 AM</span>
              <div>
                <strong>Alex Johnson</strong> - Follow up on design invoice payment
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-sub)', width: '60px' }}>02:00 PM</span>
              <span style={{ color: 'var(--text-sub)', fontStyle: 'italic' }}>No events scheduled</span>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="followups-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1>📅 Follow-up & Task Scheduler</h1>
        <p className="subtitle">Never miss client meetings, reminders, or project proposal check-ins</p>
      </div>

      {/* Grid: Calendar left, Tasks list right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Calendar view */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>📅 Schedule Planner Calendar</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className={`theme-btn ${calendarMode === 'month' ? 'active' : ''}`} onClick={() => setCalendarMode('month')} style={{ fontSize: '11px', padding: '4px 8px' }}>Month</button>
              <button className={`theme-btn ${calendarMode === 'week' ? 'active' : ''}`} onClick={() => setCalendarMode('week')} style={{ fontSize: '11px', padding: '4px 8px' }}>Week</button>
              <button className={`theme-btn ${calendarMode === 'day' ? 'active' : ''}`} onClick={() => setCalendarMode('day')} style={{ fontSize: '11px', padding: '4px 8px' }}>Day</button>
            </div>
          </div>

          {renderCalendarGrid()}
        </div>

        {/* Right Column: Tasks listings */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>⏰ Active Follow-up Reminders</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '320px' }}>
            {activeTasks.map(t => (
              <div 
                key={t.id} 
                style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>{t.client}</strong>
                  <span className={t.status === 'Overdue' ? 'badge-purple' : 'status-badge'} style={{ fontSize: '10px', padding: '2px 6px', background: t.status === 'Overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(255,0,127,0.1)', color: t.status === 'Overdue' ? 'var(--accent-red)' : 'var(--accent-pink)', border: 'none' }}>
                    {t.status}
                  </span>
                </div>
                
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>{t.task}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-sub)' }}>
                  <span>Reminder: <strong>{t.date}</strong> at <strong>{t.time}</strong></span>
                  <span style={{ color: t.priority === 'High' ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>{t.priority} Priority</span>
                </div>

                {t.status === 'Pending' || t.status === 'Overdue' ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <button className="primary-btn" onClick={() => handleAction(t.id, 'complete')} style={{ flex: 1, padding: '4px', fontSize: '10px' }}>
                      ✓ Complete
                    </button>
                    <button className="theme-btn" onClick={() => handleAction(t.id, 'reschedule')} style={{ flex: 1, padding: '4px', fontSize: '10px', border: '1px solid var(--border-color)' }}>
                      🕒 Reschedule
                    </button>
                    <button className="danger-action-btn" onClick={() => handleAction(t.id, 'cancel')} style={{ flex: 0.5, padding: '4px', fontSize: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      ✕
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FollowupsDashboard;
