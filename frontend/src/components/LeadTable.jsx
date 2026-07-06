import React, { useState } from 'react';
import { SearchIcon, PlusIcon, TrashIcon, EditIcon, ExportIcon, ImportIcon, InfoIcon } from './Icons';

const LeadTable = ({
  leads,
  onViewLead,
  onDeleteLead,
  onCreateLead,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkImport,
  showToast,
  currency = '$'
}) => {
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Selection states (Bulk actions)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  // CSV Validator details
  const [validatedHeaders, setValidatedHeaders] = useState([]);
  const [csvParsedCount, setCsvParsedCount] = useState(0);
  const [validatedLeads, setValidatedLeads] = useState([]);

  // Create Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    status: 'new',
    value: '',
    probability: 20,
    tags: '',
    followup_date: ''
  });

  // Duplicate lead warning check
  const checkDuplicates = () => {
    const emails = leads.map(l => (l.email || '').toLowerCase().trim()).filter(Boolean);
    const phones = leads.map(l => (l.phone || '').trim()).filter(Boolean);
    
    const duplicateEmails = emails.filter((item, index) => emails.indexOf(item) !== index);
    const duplicatePhones = phones.filter((item, index) => phones.indexOf(item) !== index);
    
    return {
      hasDuplicates: duplicateEmails.length > 0 || duplicatePhones.length > 0,
      emails: [...new Set(duplicateEmails)],
      phones: [...new Set(duplicatePhones)]
    };
  };

  const dupInfo = checkDuplicates();

  // Handle create input
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewLead((prev) => ({ ...prev, [name]: value }));
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter]);

  // Handle Sort Change
  const triggerSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter & Sort Logic
  const filteredLeads = leads
    .filter((lead) => {
      const query = search.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.company && lead.company.toLowerCase().includes(query)) ||
        (lead.tags && lead.tags.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const isArchived = lead.tags?.includes('Archived');

      return matchesSearch && matchesStatus && matchesSource && !isArchived;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
  // Client-side pagination calculations
  const pageSize = 10;
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Duplicate Check logic: scan email list
  const emailCounts = leads.reduce((acc, lead) => {
    const email = lead.email.toLowerCase().trim();
    acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {});

  // Handle row selection
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Toggle favorite star
  const handleToggleStar = async (leadItem) => {
    const isStarred = leadItem.tags?.includes('Starred');
    const updatedTags = isStarred 
      ? (leadItem.tags || '').replace(', Starred', '').replace('Starred', '').trim()
      : leadItem.tags ? `${leadItem.tags}, Starred` : 'Starred';
    
    try {
      await api.updateLead(leadItem.id, { ...leadItem, tags: updatedTags });
      showToast(isStarred ? 'Removed from favorites.' : 'Added to favorites!', 'success');
      // trigger parents state update
      if (onBulkUpdateStatus) {
        onBulkUpdateStatus([leadItem.id], leadItem.status);
      }
    } catch (e) {
      showToast('Error updating favorites.', 'error');
    }
  };

  // Create lead submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    try {
      await onCreateLead(newLead);
      setShowCreateModal(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'Manual Entry',
        status: 'new',
        value: '',
        probability: 20,
        tags: '',
        followup_date: ''
      });
      showToast('New lead added successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create lead.', 'error');
    }
  };

  // Bulk status update
  const handleBulkStatusChange = async (e) => {
    const status = e.target.value;
    if (!status || selectedIds.length === 0) return;

    try {
      await onBulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      showToast(`Bulk updated status successfully.`, 'success');
    } catch (err) {
      showToast('Bulk update failed.', 'error');
    }
  };

  // Bulk delete
  const handleBulkDeleteSubmit = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} leads?`)) {
      try {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        showToast('Selected leads deleted successfully.', 'success');
      } catch (err) {
        showToast('Bulk deletion failed.', 'error');
      }
    }
  };

  // CSV Input Parser & Column Validator
  const handleCsvPreScan = (text) => {
    setCsvInput(text);
    if (!text.trim()) {
      setValidatedHeaders([]);
      setCsvParsedCount(0);
      setValidatedLeads([]);
      return;
    }

    try {
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      setValidatedHeaders(headers);

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const leadObj = {};
        headers.forEach((header, idx) => {
          leadObj[header] = cols[idx] || '';
        });

        if (leadObj.name && leadObj.email) {
          parsed.push(leadObj);
        }
      }
      setCsvParsedCount(parsed.length);
      setValidatedLeads(parsed);
    } catch (e) {
      // ignore parse warnings during typing
    }
  };

  // Import Validated Leads
  const handleValidatedImport = async () => {
    if (validatedLeads.length === 0) return;
    try {
      const finalLeads = validatedLeads.map((l) => ({
        name: l.name,
        email: l.email,
        phone: l.phone || l.telephone || '',
        company: l.company || l.organization || '',
        source: l.source || 'CSV Import',
        status: l.status || 'new',
        value: parseFloat(l.value || l.budget) || 0,
        probability: parseInt(l.probability) || 20,
        tags: l.tags || '',
        followup_date: l.followup_date || l.followup || ''
      }));

      await onBulkImport(finalLeads);
      setShowImportModal(false);
      setCsvInput('');
      setValidatedHeaders([]);
      setValidatedLeads([]);
      showToast(`Successfully imported ${finalLeads.length} leads.`, 'success');
    } catch (err) {
      showToast('Error during bulk import commit.', 'error');
    }
  };

  // CSV Export
  const handleCsvExport = () => {
    if (filteredLeads.length === 0) {
      showToast('No leads available to export.', 'error');
      return;
    }

    const headers = ['id', 'name', 'email', 'phone', 'company', 'source', 'status', 'value', 'probability', 'tags', 'followup_date', 'created_at'];
    const csvRows = [headers.join(',')];

    filteredLeads.forEach((lead) => {
      const values = headers.map((header) => {
        const val = lead[header] !== undefined ? lead[header] : '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leads list exported as CSV.', 'success');
  };

  // Backup CRM Database (JSON Download)
  const handleBackupJsonExport = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `crm_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    showToast('CRM Local Database exported as JSON Backup.', 'success');
  };

  // Restore CRM Database (JSON Upload)
  const handleRestoreJsonImport = (e) => {
    const fileReader = new FileReader();
    if (!e.target.files[0]) return;

    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) {
          throw new Error('JSON backup must be an array of records.');
        }

        await onBulkImport(parsed);
        setShowBackupModal(false);
        showToast(`Successfully restored ${parsed.length} client records.`, 'success');
      } catch (err) {
        showToast('Error restoring backup. Ensure file is a valid JSON database backup.', 'error');
      }
    };
  };

  // Highlight search queries
  const renderHighlightedText = (text, query) => {
    if (!text) return '';
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Two leads comparative matrix references
  const compareLeadsArray = leads.filter((l) => selectedIds.includes(l.id)).slice(0, 2);

  return (
    <div className="table-container">
      {/* Duplicate warning alert banner */}
      {dupInfo.hasDuplicates && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--accent-red)'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '13px' }}>Potential Duplicate Leads Detected!</strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-sub)' }}>
              Found duplicate contact emails/phones: {dupInfo.emails.concat(dupInfo.phones).join(', ')}
            </p>
          </div>
          <button 
            onClick={() => showToast('Duplicates flagged. Review email/phone details in table rows.', 'info')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-red)',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="table-header">
        <div className="search-box-wrapper">
          <SearchIcon className="w-5 h-5 search-icon" />
          <input
            type="text"
            placeholder="Live search by name, email, company, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-control-group">
          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="new">New Leads</option>
            <option value="contacted">Contacted</option>
            <option value="proposal">Proposal Sent</option>
            <option value="converted">Converted (Clients)</option>
            <option value="lost">Lost</option>
          </select>

          {/* Source filter */}
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-select">
            <option value="all">All Channels</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Manual Entry">Manual Entry</option>
            <option value="CSV Import">CSV Import</option>
          </select>

          {/* Comparative widget */}
          {selectedIds.length === 2 && (
            <button 
              className="icon-btn-text compare-btn active-glowing-btn" 
              onClick={() => setShowCompareModal(true)}
              title="Compare 2 Selected Leads"
            >
              📊 Compare Selected
            </button>
          )}

          {/* Backup Restore portal */}
          <button className="icon-btn-text" onClick={() => setShowBackupModal(true)} title="JSON Backup/Restore">
            💾 Backup Cabinet
          </button>

          {/* CSV Import/Export */}
          <button className="icon-btn-text" onClick={handleCsvExport} title="Export CSV">
            <ExportIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="icon-btn-text" onClick={() => setShowImportModal(true)} title="Import CSV">
            <ImportIcon className="w-4 h-4" />
            <span>Import</span>
          </button>

          {/* Add New lead button */}
          <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
          
          <button className="theme-btn" onClick={() => setShowRecycleBinModal(true)} title="Recycle Bin Archive" style={{ border: '1px solid var(--border-color)', padding: '10px' }}>
            🗑️ Recycle Bin ({leads.filter(l => l.tags?.includes('Archived')).length})
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar animate-fade-in">
          <span>{selectedIds.length} leads selected</span>
          <div className="bulk-actions-wrapper">
            <select onChange={handleBulkStatusChange} defaultValue="" className="bulk-select">
              <option value="" disabled>Change Status...</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="proposal">Proposal Sent</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <button className="bulk-delete-btn" onClick={handleBulkDeleteSubmit}>
              <TrashIcon className="w-4 h-4" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Sheet */}
      <div className="table-responsive-wrapper">
        <table className="crm-spreadsheet">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredLeads.length > 0 && selectedIds.length === filteredLeads.length}
                />
              </th>
              <th onClick={() => triggerSort('name')} className="sortable-th">
                Client Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('company')} className="sortable-th">
                Company {sortBy === 'company' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('source')} className="sortable-th">
                Source {sortBy === 'source' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('status')} className="sortable-th">
                Status {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('value')} className="sortable-th text-right">
                Value {sortBy === 'value' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('probability')} className="sortable-th text-right">
                Confidence {sortBy === 'probability' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => triggerSort('followup_date')} className="sortable-th">
                Follow-up {sortBy === 'followup_date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-records-row">
                  No matching client lead profiles found.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                const isDuplicate = emailCounts[lead.email.toLowerCase().trim()] > 1;

                return (
                  <tr key={lead.id} className={`${isSelected ? 'selected-row' : ''} ${isDuplicate ? 'duplicate-warn-row' : ''}`}>
                    <td className="td-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(lead.id)}
                      />
                    </td>
                    <td>
                      <div className="lead-identity" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {/* Star toggle */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(lead);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: '14px',
                              cursor: 'pointer',
                              color: lead.tags?.includes('Starred') ? '#fbbf24' : 'var(--text-sub)',
                              padding: 0,
                              marginRight: '6px',
                              lineHeight: 1
                            }}
                          >
                            {lead.tags?.includes('Starred') ? '★' : '☆'}
                          </button>
                          
                          <strong className="clickable-name" onClick={() => onViewLead(lead.id)}>
                            {renderHighlightedText(lead.name, search)}
                            {isDuplicate && (
                              <span className="duplicate-tag" title="Another lead matches this email address!" style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', borderRadius: '4px' }}>
                                ⚠️ Dup
                              </span>
                            )}
                          </strong>
                        </div>
                        
                        {/* Copy email action and direct click to mail */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="lead-email" style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                            {renderHighlightedText(lead.email, search)}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(lead.email);
                              showToast('Email copied to clipboard!', 'success');
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', color: 'var(--text-sub)' }}
                            title="Copy Email"
                          >
                            📋
                          </button>
                          <a href={`mailto:${lead.email}`} style={{ textDecoration: 'none', fontSize: '11px' }} title="Mail Client">✉️</a>
                        </div>

                        {/* Phone details and call triggers */}
                        {lead.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="lead-phone" style={{ fontSize: '11px', color: 'var(--text-sub)' }}>
                              📞 {lead.phone}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(lead.phone);
                                showToast('Phone copied to clipboard!', 'success');
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', color: 'var(--text-sub)' }}
                              title="Copy Phone"
                            >
                              📋
                            </button>
                            <a href={`tel:${lead.phone}`} style={{ textDecoration: 'none', fontSize: '11px' }} title="Call Client">📞</a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{renderHighlightedText(lead.company, search) || <em className="dim-text">Individual</em>}</td>
                    <td>{lead.source}</td>
                    <td>
                      <span className={`status-badge badge-${lead.status}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="text-right font-mono">{currency}{(lead.value || 0).toLocaleString()}</td>
                    <td className="text-right">
                      <div className="probability-indicator">
                        <span>{lead.probability}%</span>
                        <div className="prob-bar-container">
                          <div className={`prob-bar fill-${lead.status}`} style={{ width: `${lead.probability}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {lead.followup_date ? (
                        <span className="followup-alert-date">📅 {lead.followup_date}</span>
                      ) : (
                        <span className="dim-text">-</span>
                      )}
                    </td>
                    <td className="td-actions-buttons" style={{ display: 'flex', gap: '4px' }}>
                      <button className="row-action-btn edit" onClick={() => onViewLead(lead.id)} title="View/Edit Details">
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="row-action-btn edit" 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const updatedTags = lead.tags ? `${lead.tags}, Archived` : 'Archived';
                          try {
                            await api.updateLead(lead.id, { ...lead, tags: updatedTags });
                            showToast('Lead archived to Recycle Bin.', 'success');
                            if (onBulkUpdateStatus) {
                              onBulkUpdateStatus([lead.id], lead.status);
                            }
                          } catch (err) {
                            showToast('Failed to archive lead.', 'error');
                          }
                        }} 
                        title="Archive Lead"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        📥
                      </button>
                      <button className="row-action-btn delete" onClick={() => { if (window.confirm('Permanently delete lead?')) onDeleteLead(lead.id); }} title="Delete Lead Permanently">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-wrapper" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          marginBottom: '16px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLeads.length} leads total)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="theme-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ◀ Previous
            </button>
            <button 
              className="theme-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Lead Form Wizard */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>Add New Lead Profile</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Client Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={newLead.name}
                    onChange={handleCreateChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={newLead.email}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={newLead.phone}
                    onChange={handleCreateChange}
                  />
                </div>
                <div className="form-group">
                  <label>Company / Org</label>
                  <input
                    type="text"
                    name="company"
                    value={newLead.company}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Source Channel</label>
                  <select name="source" value={newLead.source} onChange={handleCreateChange}>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Manual Entry">Manual Entry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select name="status" value={newLead.status} onChange={handleCreateChange}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="proposal">Proposal Sent</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Project Value ({currency})</label>
                  <input
                    type="number"
                    name="value"
                    placeholder="e.g. 5000"
                    value={newLead.value}
                    onChange={handleCreateChange}
                  />
                </div>
                <div className="form-group">
                  <label>Confidence Level (%)</label>
                  <input
                    type="number"
                    name="probability"
                    min="0"
                    max="100"
                    value={newLead.probability}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Custom Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    placeholder="e.g. Urgent, High Budget"
                    value={newLead.tags}
                    onChange={handleCreateChange}
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Follow-up Date</label>
                  <input
                    type="date"
                    name="followup_date"
                    value={newLead.followup_date}
                    onChange={handleCreateChange}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn margin-top-12">
                Create Lead Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk CSV Import Wizard with Pre-Scan Validation */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>CSV Import Pre-Scanner</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <p className="modal-info-text">
                Paste raw comma-separated CSV rows. The first line must contain headers (e.g. <em>name, email, company, value, tags, followup_date</em>).
              </p>
              
              <div className="form-group">
                <label>CSV Input Content</label>
                <textarea
                  rows="5"
                  className="csv-textarea font-mono"
                  placeholder="name,email,company,value,tags&#10;Bruce Wayne,bruce@wayne.co,Wayne Corp,75000,Whale VIP"
                  value={csvInput}
                  onChange={(e) => handleCsvPreScan(e.target.value)}
                />
              </div>

              {/* Pre-scan validation indicators */}
              {validatedHeaders.length > 0 && (
                <div className="csv-pre-scan-results glass-panel animate-slide-up">
                  <h5>CSV Structure Validation:</h5>
                  <div className="header-badges-matrix">
                    {validatedHeaders.map((header, i) => {
                      const isRequired = ['name', 'email'].includes(header);
                      const isValid = ['name', 'email', 'phone', 'company', 'source', 'status', 'value', 'probability', 'tags', 'followup_date'].includes(header);
                      return (
                        <span key={i} className={`header-badge ${isValid ? 'valid' : 'invalid'} ${isRequired ? 'required' : ''}`}>
                          {header} {isRequired ? '*' : ''}
                        </span>
                      );
                    })}
                  </div>
                  
                  <div className="validation-summary-text">
                    {(!validatedHeaders.includes('name') || !validatedHeaders.includes('email')) ? (
                      <span className="validation-error">⚠️ Missing required fields (*name* and *email* headers must exist).</span>
                    ) : (
                      <span className="validation-success">✓ Validation passed! Found {csvParsedCount} valid rows ready to ingest.</span>
                    )}
                  </div>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleValidatedImport} 
                disabled={csvParsedCount === 0 || !validatedHeaders.includes('name') || !validatedHeaders.includes('email')}
                className="submit-btn margin-top-12"
              >
                Ingest Validated CSV Rows
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Lead Comparative Matrix Modal */}
      {showCompareModal && compareLeadsArray.length === 2 && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>Lead Comparative Matrix</h2>
              <button className="modal-close" onClick={() => setShowCompareModal(false)}>✕</button>
            </div>
            
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Attributes</th>
                    <th>{compareLeadsArray[0].name}</th>
                    <th>{compareLeadsArray[1].name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Company</td>
                    <td>{compareLeadsArray[0].company || 'Individual'}</td>
                    <td>{compareLeadsArray[1].company || 'Individual'}</td>
                  </tr>
                  <tr>
                    <td>Deal Value</td>
                    <td className="font-mono text-cyan">{currency}{(compareLeadsArray[0].value || 0).toLocaleString()}</td>
                    <td className="font-mono text-cyan">{currency}{(compareLeadsArray[1].value || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Status Stage</td>
                    <td><span className={`status-badge badge-${compareLeadsArray[0].status}`}>{compareLeadsArray[0].status}</span></td>
                    <td><span className={`status-badge badge-${compareLeadsArray[1].status}`}>{compareLeadsArray[1].status}</span></td>
                  </tr>
                  <tr>
                    <td>Attribution Channel</td>
                    <td>{compareLeadsArray[0].source}</td>
                    <td>{compareLeadsArray[1].source}</td>
                  </tr>
                  <tr>
                    <td>Confidence</td>
                    <td>{compareLeadsArray[0].probability}%</td>
                    <td>{compareLeadsArray[1].probability}%</td>
                  </tr>
                  <tr>
                    <td>Follow-up scheduled</td>
                    <td>{compareLeadsArray[0].followup_date || 'None'}</td>
                    <td>{compareLeadsArray[1].followup_date || 'None'}</td>
                  </tr>
                  <tr>
                    <td>Labels / Tags</td>
                    <td>{compareLeadsArray[0].tags || '-'}</td>
                    <td>{compareLeadsArray[1].tags || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: JSON Backup / Restore Cabinet */}
      {showBackupModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card max-width-600 animate-slide-up">
            <div className="modal-header">
              <h2>JSON Database Cabinet</h2>
              <button className="modal-close" onClick={() => setShowBackupModal(false)}>✕</button>
            </div>
            
            <div className="backup-modal-body">
              <div className="backup-block">
                <h4>1. Create JSON Database Backup</h4>
                <p className="subtitle">Download all leads, notes, and activity timeline histories into a single recovery file.</p>
                <button className="primary-btn margin-top-12" onClick={handleBackupJsonExport}>
                  📥 Download Recovery JSON File
                </button>
              </div>

              <div className="backup-block margin-top-12" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4>2. Restore Database from JSON Backup</h4>
                <p className="subtitle">Select a previously downloaded `.json` recovery file to import all records back.</p>
                <div className="file-upload-wrapper margin-top-12">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJsonImport}
                    className="json-file-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: Recycle Bin Soft Archive */}
      {showRecycleBinModal && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-card max-width-600 animate-slide-up" style={{ border: '1px solid var(--accent-pink)', boxShadow: '0 0 25px rgba(255, 0, 127, 0.15)' }}>
            <div className="modal-header">
              <h2>🗑️ Archive Recycle Bin</h2>
              <button className="modal-close" onClick={() => setShowRecycleBinModal(false)}>✕</button>
            </div>
            
            <div className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p className="subtitle">Restore soft-deleted leads back to the active list or permanently erase them from SQLite storage.</p>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leads.filter(l => l.tags?.includes('Archived')).length === 0 ? (
                  <div className="empty-notes" style={{ padding: '30px 0', textAlign: 'center' }}>Recycle bin is empty.</div>
                ) : (
                  leads.filter(l => l.tags?.includes('Archived')).map(leadItem => (
                    <div 
                      key={leadItem.id} 
                      style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px' }}>{leadItem.name}</strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>{leadItem.email} | {leadItem.company || 'Individual'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="primary-btn" 
                          onClick={async () => {
                            const updatedTags = (leadItem.tags || '').replace(', Archived', '').replace('Archived', '').trim();
                            try {
                              await api.updateLead(leadItem.id, { ...leadItem, tags: updatedTags });
                              showToast('Lead restored successfully!', 'success');
                              if (onBulkUpdateStatus) {
                                onBulkUpdateStatus([leadItem.id], leadItem.status);
                              }
                            } catch (e) {
                              showToast('Failed to restore lead.', 'error');
                            }
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Restore
                        </button>
                        <button 
                          className="danger-action-btn" 
                          onClick={() => {
                            if (window.confirm('Permanently erase this lead record from database?')) {
                              onDeleteLead(leadItem.id);
                              showToast('Lead deleted permanently.', 'success');
                            }
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTable;
