import React, { useEffect, useRef } from 'react';

const AnalyticsDashboard = ({ leads = [], showToast, currency = '$' }) => {
  const funnelCanvasRef = useRef(null);
  const channelsCanvasRef = useRef(null);

  // Compute metrics
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const lostLeads = leads.filter(l => l.status === 'lost').length;
  const totalRevenue = leads.filter(l => l.status === 'converted').reduce((sum, l) => sum + (l.value || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Render Charts on Canvas
  useEffect(() => {
    // 1. Render Conversion Funnel Chart
    const funnelCanvas = funnelCanvasRef.current;
    if (funnelCanvas) {
      const ctx = funnelCanvas.getContext('2d');
      const w = funnelCanvas.width = funnelCanvas.offsetWidth;
      const h = funnelCanvas.height = funnelCanvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const stages = [
        { name: 'Total Ingested', count: totalLeads, color: 'var(--accent-cyan)' },
        { name: 'Active Contacted', count: leads.filter(l => l.status !== 'new').length, color: 'var(--accent-blue)' },
        { name: 'Proposal Sent', count: leads.filter(l => l.status === 'proposal' || l.status === 'converted').length, color: 'var(--accent-purple)' },
        { name: 'Closed Converted', count: convertedLeads, color: 'var(--accent-green)' }
      ];

      const barGap = 10;
      const barHeight = (h - (stages.length - 1) * barGap) / stages.length;

      stages.forEach((stage, idx) => {
        const y = idx * (barHeight + barGap);
        const percent = totalLeads > 0 ? stage.count / totalLeads : 0;
        const barWidth = Math.max(percent * (w - 120), 10);

        // Bar background
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(0, y, w, barHeight);

        // Filled gradient bar
        const grad = ctx.createLinearGradient(0, 0, barWidth, 0);
        grad.addColorStop(0, stage.color);
        grad.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, barWidth, barHeight);

        // Label texts
        ctx.fillStyle = 'var(--text-main)';
        ctx.font = '11px Outfit, sans-serif';
        ctx.fillText(`${stage.name} (${stage.count})`, 10, y + barHeight / 2 + 4);

        // Percentage text
        ctx.fillStyle = stage.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(percent * 100)}%`, w - 10, y + barHeight / 2 + 4);
        ctx.textAlign = 'left'; // reset
      });
    }

    // 2. Render Ingestion Channels Pie Chart
    const channelsCanvas = channelsCanvasRef.current;
    if (channelsCanvas) {
      const ctx = channelsCanvas.getContext('2d');
      const w = channelsCanvas.width = channelsCanvas.offsetWidth;
      const h = channelsCanvas.height = channelsCanvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Compute counts by source
      const sources = ['Website', 'Social Media', 'Referral', 'Cold Call'];
      const counts = sources.map(src => ({
        name: src,
        count: leads.filter(l => l.source === src).length
      }));

      const totalCounts = counts.reduce((sum, item) => sum + item.count, 0) || 1;
      const colors = ['var(--accent-cyan)', 'var(--accent-pink)', 'var(--accent-purple)', 'var(--accent-green)'];

      let startAngle = 0;
      const centerX = w / 3;
      const centerY = h / 2;
      const radius = Math.min(centerX, centerY) - 15;

      counts.forEach((item, idx) => {
        const sliceAngle = (item.count / totalCounts) * Math.PI * 2;
        if (sliceAngle === 0) return;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();
        ctx.strokeStyle = 'rgba(10,14,26,0.8)';
        ctx.stroke();

        startAngle += sliceAngle;
      });

      // Draw Legend
      ctx.textAlign = 'left';
      counts.forEach((item, idx) => {
        const y = 30 + idx * 24;
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fillRect(w / 3 * 2 - 20, y - 8, 10, 10);

        ctx.fillStyle = 'var(--text-main)';
        ctx.font = '11px Outfit, sans-serif';
        const percent = Math.round((item.count / totalCounts) * 100);
        ctx.fillText(`${item.name} (${percent}%)`, w / 3 * 2 - 5, y);
      });
    }
  }, [leads, totalLeads, convertedLeads]);

  const handleExport = (type) => {
    if (totalLeads === 0) {
      showToast('No leads data to export.', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Company', 'Source', 'Status', 'Deal Value'];
    const rows = leads.map(l => [l.id, l.name, l.email, l.company || 'N/A', l.source, l.status, l.value || 0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    if (type === 'CSV' || type === 'Excel') {
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `FutureCRM_Leads_Report.${type === 'CSV' ? 'csv' : 'xls'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported report as ${type}!`, 'success');
    } else {
      showToast('Generating print-friendly PDF report mockup...', 'info');
      window.print();
    }
  };

  return (
    <div className="analytics-dashboard-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>📊 Analytics & Reports Dashboard</h1>
          <p className="subtitle">Business performance KPIs, funnel drop-off stats, and report exporting tools</p>
        </div>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="theme-btn" onClick={() => handleExport('CSV')} style={{ fontSize: '12px', padding: '8px 12px' }}>
            📥 Export CSV
          </button>
          <button className="theme-btn" onClick={() => handleExport('Excel')} style={{ fontSize: '12px', padding: '8px 12px' }}>
            📊 Export Excel
          </button>
          <button className="primary-btn" onClick={() => handleExport('PDF')} style={{ fontSize: '12px', padding: '8px 12px' }}>
            📄 Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>TOTAL LEADS</span>
          <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-cyan)', margin: '4px 0' }}>{totalLeads}</strong>
          <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>↑ +12.5% vs last month</span>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>CONVERTED CLIENTS</span>
          <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-green)', margin: '4px 0' }}>{convertedLeads}</strong>
          <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>↑ +4.2% conversion trend</span>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>CONVERSION RATE</span>
          <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-pink)', margin: '4px 0' }}>{conversionRate}%</strong>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${conversionRate}%`, height: '100%', backgroundColor: 'var(--accent-pink)' }}></div>
          </div>
        </div>
        <div className="glass-panel metric-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>TOTAL REVENUE</span>
          <strong style={{ fontSize: '24px', display: 'block', color: 'var(--accent-purple)', margin: '4px 0' }}>{currency}{totalRevenue.toLocaleString()}</strong>
          <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>↑ +$24,000 upsell goals</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Funnel Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>🎯 Conversion Funnel Stages</h3>
          <p className="subtitle">Breakdown of inquiry conversion progressions</p>
          <div style={{ height: '200px', position: 'relative', marginTop: '16px' }}>
            <canvas ref={funnelCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Channel Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>📈 Acquisition Ingestion Channels</h3>
          <p className="subtitle">Proportion of leads by origin channel</p>
          <div style={{ height: '200px', position: 'relative', marginTop: '16px' }}>
            <canvas ref={channelsCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
