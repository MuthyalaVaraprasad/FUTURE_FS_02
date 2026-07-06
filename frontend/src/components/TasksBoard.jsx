import React, { useState } from 'react';
import { CalendarIcon, PlusIcon, TrashIcon } from './Icons';

const TasksBoard = ({ leads, showToast }) => {
  const [tasksList, setTasksList] = useState([
    { id: 1, clientName: 'Alexis Johnson', text: 'Call to review SLA contract details', priority: 'High', date: '2026-07-06', done: false },
    { id: 2, clientName: 'Sarah Miller', text: 'Send updated portfolio and pricing options', priority: 'Medium', date: '2026-07-08', done: false },
    { id: 3, clientName: 'Bruce Wayne', text: 'Finalize Wayne Enterprises security audit invoice', priority: 'High', date: '2026-07-05', done: true },
    { id: 4, clientName: 'General Lead', text: 'Clean up duplicate ingestion email addresses', priority: 'Low', date: '2026-07-10', done: false }
  ]);

  const [newTaskText, setNewTaskText] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDate, setNewDate] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('Pending');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now(),
      clientName: newClientName || 'General CRM Alert',
      text: newTaskText,
      priority: newPriority,
      date: newDate || new Date().toISOString().split('T')[0],
      done: false
    };

    setTasksList([newTask, ...tasksList]);
    setNewTaskText('');
    setNewClientName('');
    setNewDate('');
    if (showToast) showToast('CRM task scheduled successfully.', 'success');
  };

  const handleToggleDone = (id) => {
    setTasksList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id) => {
    setTasksList(prev => prev.filter(t => t.id !== id));
    if (showToast) showToast('Task removed.', 'info');
  };

  const filteredTasks = tasksList.filter(t => {
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Pending' && !t.done) || 
      (filterStatus === 'Completed' && t.done);
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="tasks-board-container animate-slide-up">
      <div className="tasks-board-header">
        <h1>Task Scheduler & Correspondence</h1>
        <p className="subtitle">Schedule and audit follow-up tasks linked to active prospects</p>
      </div>

      <div className="tasks-grid-layout">
        {/* Left column: Add Task Form */}
        <div className="glass-panel add-task-card">
          <h3>Schedule New Touchpoint</h3>
          <form onSubmit={handleAddTask} className="task-scheduler-form margin-top-12">
            <div className="form-group">
              <label>Task Description *</label>
              <input 
                type="text" 
                placeholder="e.g. Call to finalize retainer budget..." 
                value={newTaskText} 
                onChange={(e) => setNewTaskText(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Link to Lead (Optional)</label>
              <select value={newClientName} onChange={(e) => setNewClientName(e.target.value)}>
                <option value="">-- General CRM Reminder --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.name}>{l.name} ({l.company || 'Individual'})</option>
                ))}
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Priority Rank</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)} 
                />
              </div>
            </div>

            <button type="submit" className="primary-btn margin-top-12 width-100">
              <PlusIcon className="w-4 h-4" />
              <span>Schedule Task</span>
            </button>
          </form>
        </div>

        {/* Right column: Tasks List Feed */}
        <div className="glass-panel tasks-feed-card">
          <div className="feed-header-filters">
            <h3>Active Reminders Feed</h3>
            
            <div className="feed-filter-selects">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="tasks-feed-list margin-top-12">
            {filteredTasks.length === 0 ? (
              <div className="no-tasks-placeholder">
                <CalendarIcon className="w-8 h-8 text-sub" />
                <p>No active scheduled tasks match filters.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className={`task-feed-item ${task.done ? 'task-done-item' : ''}`}>
                  <div className="task-item-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={task.done} 
                      onChange={() => handleToggleDone(task.id)} 
                    />
                  </div>
                  
                  <div className="task-item-content">
                    <div className="task-item-meta-strip">
                      <span className={`task-prio-badge prio-${task.priority.toLowerCase()}`}>
                        {task.priority} Priority
                      </span>
                      <span className="task-due-badge">📅 {task.date}</span>
                    </div>
                    <strong className="task-desc-text">{task.text}</strong>
                    <span className="task-client-ref">Linked Lead: <em className="text-cyan">{task.clientName}</em></span>
                  </div>

                  <button className="task-delete-item-btn" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksBoard;
