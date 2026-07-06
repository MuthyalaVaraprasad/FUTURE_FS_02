import React, { useState } from 'react';
import { RevenueIcon, UsersIcon } from './Icons';

const Kanban = ({ leads, onStatusUpdate, onViewLead }) => {
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  const columns = [
    { id: 'new', title: 'New Leads', colorClass: 'border-cyan text-cyan bg-cyan-trans' },
    { id: 'contacted', title: 'Contacted', colorClass: 'border-blue text-blue bg-blue-trans' },
    { id: 'proposal', title: 'Proposal Sent', colorClass: 'border-purple text-purple bg-purple-trans' },
    { id: 'converted', title: 'Converted (Clients)', colorClass: 'border-green text-green bg-green-trans' },
    { id: 'lost', title: 'Lost Opportunities', colorClass: 'border-red text-red bg-red-trans' }
  ];

  // Drag and Drop handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDraggedOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onStatusUpdate(parseInt(leadId), targetStatus);
    }
  };

  // Group leads by status
  const getLeadsByStatus = (status) => {
    return leads.filter((lead) => lead.status === status);
  };

  // Calculate total pipeline value for a column
  const getColPipelineValue = (colLeads) => {
    return colLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div>
          <h1>Deal Pipeline Board</h1>
          <p className="subtitle">Drag and drop cards across columns to update customer lifecycle stages</p>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colLeads = getLeadsByStatus(col.id);
          const colValue = getColPipelineValue(colLeads);
          const isOver = draggedOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${col.id}-col ${isOver ? 'drag-over-glow' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`kanban-column-header ${col.colorClass}`}>
                <div className="flex-col-title">
                  <h3>{col.title}</h3>
                  <span className="col-count">{colLeads.length}</span>
                </div>
                <div className="col-revenue">
                  <RevenueIcon className="w-4 h-4" />
                  <span>${colValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="kanban-cards-wrapper">
                {colLeads.length === 0 ? (
                  <div className="empty-col-message">Drop leads here</div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => onViewLead(lead.id)}
                      className="kanban-card glass-panel-card"
                    >
                      <div className="card-top">
                        <span className="lead-source-tag">{lead.source}</span>
                        <span className="lead-prob">{lead.probability}% prob</span>
                      </div>
                      
                      <h4 className="lead-card-name">{lead.name}</h4>
                      
                      {lead.company && (
                        <p className="lead-card-company">{lead.company}</p>
                      )}

                      {/* Display custom tags */}
                      {lead.tags && (
                        <div className="lead-card-tags">
                          {lead.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="card-custom-tag-badge">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="card-footer">
                        <div className="lead-val">
                          <span>Value:</span>
                          <strong>${(lead.value || 0).toLocaleString()}</strong>
                        </div>
                        
                        {lead.followup_date && (
                          <div className="lead-date-alert" title="Next Follow-up">
                            📅 {lead.followup_date.split('-').slice(1).join('/')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kanban;
