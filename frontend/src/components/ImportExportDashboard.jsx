import React, { useState } from 'react';

const ImportExportDashboard = ({ leads = [], onBulkImport, showToast }) => {
  const [csvText, setCsvText] = useState('');
  const [validationMsg, setValidationMsg] = useState('');
  const [parsedLeads, setParsedLeads] = useState([]);

  // Validate CSV structure
  const handleValidateCsv = () => {
    if (!csvText.trim()) {
      setValidationMsg('CSV text area is empty.');
      return;
    }
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setValidationMsg('CSV must contain a header row and at least one lead data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['name', 'email'];
    const missing = required.filter(r => !headers.includes(r));
    
    if (missing.length > 0) {
      setValidationMsg(`Invalid headers! Missing required fields: ${missing.join(', ')}. Valid columns are: name, email, phone, company, value`);
      return;
    }

    const leadsList = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const leadObj = {};
      headers.forEach((header, idx) => {
        leadObj[header] = cols[idx] || '';
      });
      
      // Ensure name and email are present
      if (leadObj.name && leadObj.email) {
        leadsList.push({
          name: leadObj.name,
          email: leadObj.email,
          phone: leadObj.phone || '',
          company: leadObj.company || '',
          value: parseFloat(leadObj.value) || 0,
          source: 'CSV Import',
          status: 'new',
          probability: 20
        });
      }
    }

    setParsedLeads(leadsList);
    setValidationMsg(`CSV Validated! Found ${leadsList.length} importable client leads records.`);
  };

  const handleCommitImport = async () => {
    if (parsedLeads.length === 0) return;
    try {
      await onBulkImport(parsedLeads);
      showToast(`Successfully imported ${parsedLeads.length} leads to SQLite.`, 'success');
      setCsvText('');
      setParsedLeads([]);
      setValidationMsg('');
    } catch (e) {
      showToast('Error during bulk import.', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,email,phone,company,value\nAlex Mercer,alex@mercer.com,+1 555-9012,Gentech Ltd,14000\nDana Scully,dana@fbi.gov,+1 555-1013,FBI Division,9500";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FutureCRM_Leads_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leads template CSV downloaded.', 'success');
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      showToast('No database leads found to export.', 'error');
      return;
    }
    const headers = ['name', 'email', 'phone', 'company', 'value', 'source', 'status'];
    const rows = leads.map(l => [l.name, l.email, l.phone || '', l.company || '', l.value || 0, l.source, l.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FutureCRM_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Leads list exported as CSV.', 'success');
  };

  const handleExportExcel = () => {
    handleExportCsv(); // CSV format is fully readable by Excel
  };

  return (
    <div className="import-export-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1>📤 Import / Export Center</h1>
        <p className="subtitle">Execute CSV file ingestion, download Excel templates, and trigger print-friendly PDF reporting</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: CSV Import Ingestor */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>📥 Ingest Bulk Leads CSV</h3>
            <button className="theme-btn" onClick={handleDownloadTemplate} style={{ fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border-color)' }}>
              📥 Get CSV Template
            </button>
          </div>

          <textarea 
            rows="6"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="name,email,phone,company,value&#10;Bruce Wayne,bruce@waynecorp.com,+1 555-0010,Wayne Ent,45000&#10;Clark Kent,clark@dailyplanet.com,+1 555-1122,Daily Planet,12000"
            style={{
              width: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="theme-btn" onClick={handleValidateCsv} style={{ flex: 1, border: '1px solid var(--border-color)' }}>
              🔍 Parse and Validate CSV
            </button>
            
            {parsedLeads.length > 0 && (
              <button className="primary-btn" onClick={handleCommitImport} style={{ flex: 1 }}>
                🚀 Commit Ingestion ({parsedLeads.length})
              </button>
            )}
          </div>

          {validationMsg && (
            <div style={{
              padding: '10px 12px',
              background: validationMsg.startsWith('CSV Validated') ? 'rgba(0,243,255,0.05)' : 'rgba(255,0,127,0.05)',
              border: `1px solid ${validationMsg.startsWith('CSV Validated') ? 'var(--accent-cyan)' : 'var(--accent-pink)'}`,
              borderRadius: '6px',
              fontSize: '11px',
              color: validationMsg.startsWith('CSV Validated') ? 'var(--accent-cyan)' : 'var(--accent-pink)'
            }}>
              {validationMsg}
            </div>
          )}
        </div>

        {/* Right Column: Global Export Hub */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>📤 CRM Bulk Export Engine</h3>
          <p className="subtitle">Download active SQLite database records in standard formats</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="primary-btn" onClick={handleExportCsv} style={{ padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📥 Download Leads Data Sheet</span>
              <strong>CSV Format</strong>
            </button>

            <button className="theme-btn" onClick={handleExportExcel} style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
              <span>📊 Download Financial Report</span>
              <strong>Excel Format</strong>
            </button>

            <button 
              className="theme-btn" 
              onClick={() => {
                showToast('Preparing PDF Report... Click Print.', 'info');
                window.print();
              }} 
              style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}
            >
              <span>📄 Print CRM Dashboard Report</span>
              <strong>PDF Printout</strong>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImportExportDashboard;
