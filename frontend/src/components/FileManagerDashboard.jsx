import React, { useState } from 'react';

const FileManagerDashboard = ({ leads = [], showToast }) => {
  const [files, setFiles] = useState([
    { id: 201, name: 'SLA_Service_Contract.pdf', size: '240 KB', client: 'Alex Johnson', date: '2026-07-06', type: 'PDF', content: 'MASTER SERVICES SLA AGREEMENT\n-------------------------\nClient: Alex Johnson\nCompany: CloudTech Solutions\nValue: $8,500\n\nThis agreement outlines the technical web services provided by FutureCRM Ltd. and billing conditions.' },
    { id: 202, name: 'Retainer_Invoice_Deposit.pdf', size: '110 KB', client: 'Sarah Miller', date: '2026-07-05', type: 'PDF', content: 'RETAINER DEPOSIT INVOICE\n-------------------------\nInvoice ID: INV-2026-102\nClient: Sarah Miller\nAmount Due: $1,600\n\nPayment Swift Gateway: FUTCRM2026SGL. Terms: Due upon receipt.' },
    { id: 203, name: 'Wireframe_Layout_v2.png', size: '1.2 MB', client: 'Michael Chang', date: '2026-07-06', type: 'Image', content: '🎨 Wireframe Layout Design Mockup\n[Glowing Neon glassmorphic sidebar layout schematic]' }
  ]);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [customFileType, setCustomFileType] = useState('PDF');
  const [activePreviewFile, setActivePreviewFile] = useState(null);

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!customFileName.trim() || !selectedClient) {
      showToast('Please specify file name and client profile.', 'error');
      return;
    }

    const newFile = {
      id: Date.now(),
      name: customFileName.endsWith(`.${customFileType.toLowerCase()}`) ? customFileName : `${customFileName}.${customFileType.toLowerCase()}`,
      size: `${Math.floor(Math.random() * 500 + 50)} KB`,
      client: selectedClient,
      date: new Date().toISOString().split('T')[0],
      type: customFileType,
      content: `Simulated file contents uploaded for client: ${selectedClient}.\nType: ${customFileType}\nUploaded timestamp: ${new Date().toLocaleString()}`
    };

    setFiles(prev => [newFile, ...prev]);
    setCustomFileName('');
    setShowUpload(false);
    showToast('Document uploaded successfully to local locker.', 'success');
  };

  const handleDeleteFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    showToast('Document deleted from files manager.', 'success');
  };

  const triggerDownload = (file) => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(file.content);
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading file: ${file.name}`, 'success');
  };

  return (
    <div className="file-manager-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>📂 Document & File Manager</h1>
          <p className="subtitle">Locker vault housing client contract agreements, quotation files, and wireframe PDF previews</p>
        </div>
        
        <button className="primary-btn" onClick={() => setShowUpload(true)} style={{ padding: '8px 16px' }}>
          📤 Upload Document
        </button>
      </div>

      {showUpload && (
        <div className="glass-panel animate-slide-up" style={{ padding: '16px', background: 'rgba(255, 0, 127, 0.02)', border: '1px solid var(--accent-pink)' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Upload Simulated Document</h3>
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '11px' }}>File Title Name:</label>
              <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} placeholder="Project_Specification" required />
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
              <label style={{ fontSize: '11px' }}>Document Type:</label>
              <select value={customFileType} onChange={(e) => setCustomFileType(e.target.value)}>
                <option value="PDF">PDF Document</option>
                <option value="Image">Design Image</option>
                <option value="Doc">Doc Document</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
              <label style={{ fontSize: '11px' }}>Assigned Client:</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} required>
                <option value="">-- Select Client --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="primary-btn" style={{ padding: '10px 16px' }}>Upload</button>
              <button type="button" className="theme-btn" onClick={() => setShowUpload(false)} style={{ padding: '10px 16px', border: '1px solid var(--border-color)' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vault Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3>📁 CRM Document Vault Files</h3>
        
        <div style={{ overflowX: 'auto', marginTop: '14px' }}>
          <table className="crm-spreadsheet" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>File Name</th>
                <th style={{ width: '100px' }}>Type</th>
                <th style={{ width: '100px' }}>Size</th>
                <th style={{ width: '180px' }}>Client Owner</th>
                <th style={{ width: '130px' }}>Date Uploaded</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{f.name}</strong>
                  </td>
                  <td>
                    <span className="badge-purple" style={{ fontSize: '10px' }}>{f.type}</span>
                  </td>
                  <td className="font-mono" style={{ fontSize: '12px' }}>{f.size}</td>
                  <td>{f.client}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{f.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="row-action-btn edit" onClick={() => setActivePreviewFile(f)} title="Preview File" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        👁 Preview
                      </button>
                      <button className="row-action-btn edit" onClick={() => triggerDownload(f)} title="Download File" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        📥
                      </button>
                      <button className="row-action-btn delete" onClick={() => handleDeleteFile(f.id)} title="Delete Attachment" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Preview Modal */}
      {activePreviewFile && (
        <div className="modal-backdrop" onClick={() => setActivePreviewFile(null)}>
          <div className="glass-panel modal-card max-width-600 animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--accent-cyan)', boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)' }}>
            <div className="modal-header">
              <h2>📄 Preview: {activePreviewFile.name}</h2>
              <button className="modal-close" onClick={() => setActivePreviewFile(null)}>✕</button>
            </div>
            
            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto',
              color: 'var(--text-main)'
            }}>
              {activePreviewFile.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>Size: {activePreviewFile.size} | Owner: {activePreviewFile.client}</span>
              <button className="primary-btn" onClick={() => { triggerDownload(activePreviewFile); setActivePreviewFile(null); }}>
                📥 Download Document File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagerDashboard;
