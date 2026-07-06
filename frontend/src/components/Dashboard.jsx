import React, { useEffect, useRef, useState } from 'react';
import GoalTracker from './GoalTracker';
import { UsersIcon, RevenueIcon, KanbanIcon, InfoIcon, PlusIcon } from './Icons';

const Dashboard = ({
  stats,
  leads = [],
  targetGoal,
  onTargetChange,
  onSeedMockData,
  loadingSeed,
  particleSpeed = 0.4,
  onParticleSpeedChange,
  particleColor = 'cyan',
  onParticleColorChange,
  currency = '$',
  onCurrencyChange,
  onToggleAi
}) => {
  const sourceCanvasRef = useRef(null);
  const growthCanvasRef = useRef(null);
  const funnelCanvasRef = useRef(null);

  // States for Forecast & Webhook Simulation
  const [forecastMonths, setForecastMonths] = useState(6);
  const [forecastConversionRate, setForecastConversionRate] = useState(30);

  // Live clock and date states
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString());
  const [liveDate, setLiveDate] = useState(new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // Lead aggregation metrics
  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  const contactedLeadsCount = leads.filter(l => l.status === 'contacted').length;
  const proposalLeadsCount = leads.filter(l => l.status === 'proposal').length;
  const convertedLeadsCount = leads.filter(l => l.status === 'converted').length;
  const lostLeadsCount = leads.filter(l => l.status === 'lost').length;
  const todayLeadsCount = leads.filter(l => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const pendingFollowupsCount = leads.filter(l => l.followup_date).length;
  const overdueFollowupsCount = leads.filter(l => {
    if (!l.followup_date) return false;
    return new Date(l.followup_date) < new Date() && l.status !== 'converted' && l.status !== 'lost';
  }).length;

  const activePipelineValue = leads.filter(l => l.status !== 'converted' && l.status !== 'lost').reduce((sum, l) => sum + (l.value || 0), 0);
  const conversionRatePct = totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0;

  // 3D Tilt Hover Effect
  const handleMouseMove = (e, card) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    
    const glow = card.querySelector('.card-glow');
    if (glow) {
      glow.style.background = `radial-gradient(circle 120px at ${x}px ${y}px, rgba(255, 255, 255, 0.15), transparent)`;
    }
  };

  const handleMouseLeave = (card) => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    const glow = card.querySelector('.card-glow');
    if (glow) {
      glow.style.background = 'transparent';
    }
  };



  // Calculate forecasting revenue
  const totalPipelineVal = stats?.totalPipelineValue || 0;
  const forecastValue = Math.round(totalPipelineVal * (forecastConversionRate / 100) * (forecastMonths / 6));

  // Render Charts (Doughnut, Line, Funnel)
  useEffect(() => {
    if (!stats) return;

    // 1. Render Acquisition Channels Chart (Doughnut)
    const renderSourceChart = () => {
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const centerX = width * 0.4;
      const centerY = height * 0.5;
      const outerRadius = Math.min(centerX, centerY) * 0.75;
      const innerRadius = outerRadius * 0.6;

      ctx.clearRect(0, 0, width, height);

      const sources = stats.sources || [];
      const totalCount = sources.reduce((sum, item) => sum + item.count, 0);

      if (totalCount === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', centerX, centerY);
        return;
      }

      const colors = {
        'Website': '#00f3ff',
        'Referral': '#ff007f',
        'Social Media': '#8b5cf6',
        'Cold Call': '#3b82f6',
        'Manual Entry': '#10b981',
        'CSV Import': '#f59e0b'
      };

      let startAngle = -Math.PI / 2;
      sources.forEach((item) => {
        const sliceAngle = (item.count / totalCount) * 2 * Math.PI;
        const color = colors[item.source] || '#6b7280';

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        startAngle += sliceAngle;
      });

      // Center Text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(totalCount, centerX, centerY - 6);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillText('Leads', centerX, centerY + 12);

      // Legend
      let legendY = centerY - (sources.length * 20) / 2 + 10;
      sources.forEach((item) => {
        const color = colors[item.source] || '#6b7280';
        ctx.beginPath();
        ctx.arc(width * 0.72, legendY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.source}: ${item.count}`, width * 0.76, legendY + 3);
        legendY += 24;
      });
    };

    // 2. Render Growth Line Graph
    const renderGrowthChart = () => {
      const canvas = growthCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      const monthlyData = stats.monthlyLeads || [];
      if (monthlyData.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for data...', width / 2, height / 2);
        return;
      }

      const paddingLeft = 30;
      const paddingBottom = 25;
      const paddingTop = 20;
      const paddingRight = 15;
      const graphWidth = width - paddingLeft - paddingRight;
      const graphHeight = height - paddingTop - paddingBottom;

      const counts = monthlyData.map(d => d.count);
      const maxCount = Math.max(...counts, 4);

      // Grid levels
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = paddingTop + (graphHeight * i) / 3;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        const val = Math.round(maxCount - (maxCount * i) / 3);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Outfit, sans-serif';
        ctx.fillText(val, paddingLeft - 18, y + 3);
      }

      const points = [];
      const stepX = graphWidth / (monthlyData.length - 1 || 1);

      monthlyData.forEach((data, index) => {
        const x = paddingLeft + index * stepX;
        const ratio = data.count / maxCount;
        const y = paddingTop + graphHeight - ratio * graphHeight;
        points.push({ x, y, label: data.month, count: data.count });
      });

      // Line gradient fill
      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, paddingTop + graphHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, paddingTop + graphHeight);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + graphHeight);
        fillGrad.addColorStop(0, 'rgba(0, 243, 255, 0.2)');
        fillGrad.addColorStop(1, 'rgba(0, 243, 255, 0.0)');
        ctx.fillStyle = fillGrad;
        ctx.fill();
      }

      // Draw path
      ctx.beginPath();
      points.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Points
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.stroke();

        const monthShort = p.label.split('-')[1] || p.label;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(monthShort, p.x, paddingTop + graphHeight + 14);
      });
    };

    // 3. Render Sales Funnel Chart (Tapering Canvas Shape)
    const renderFunnelChart = () => {
      const canvas = funnelCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      // Funnel Stages details
      const stages = [
        { label: 'New Inquiries', count: stats.newLeads, color: '#00f3ff' },
        { label: 'Contacted', count: stats.contactedLeads, color: '#3b82f6' },
        { label: 'Proposals', count: stats.proposalsPending, color: '#8b5cf6' },
        { label: 'Converted', count: stats.convertedLeads, color: '#10b981' }
      ];

      const maxVal = Math.max(...stages.map(s => s.count), 1);
      const stageHeight = (height - 30) / stages.length;
      
      let currentTopWidth = width * 0.9;
      let currentY = 15;

      stages.forEach((stage, i) => {
        // Next bottom width is narrower
        const ratio = i === stages.length - 1 ? 0.35 : 0.9 - (i + 1) * 0.15;
        const currentBottomWidth = width * ratio;
        
        const topX1 = (width - currentTopWidth) / 2;
        const topX2 = topX1 + currentTopWidth;
        const bottomY = currentY + stageHeight;
        const bottomX1 = (width - currentBottomWidth) / 2;
        const bottomX2 = bottomX1 + currentBottomWidth;

        // Draw Trapezoid
        ctx.beginPath();
        ctx.moveTo(topX1, currentY);
        ctx.lineTo(topX2, currentY);
        ctx.lineTo(bottomX2, bottomY - 4);
        ctx.lineTo(bottomX1, bottomY - 4);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, currentY, 0, bottomY);
        grad.addColorStop(0, stage.color);
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw Stage Label & counts
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${stage.label}: ${stage.count}`, width / 2, currentY + stageHeight / 2);

        currentTopWidth = currentBottomWidth;
        currentY = bottomY;
      });
    };

    renderSourceChart();
    renderGrowthChart();
    renderFunnelChart();
  }, [stats]);

  if (!stats) return <div className="loading-state">Syncing Dashboard Analytics...</div>;

  // Unlocked milestone badges
  const actualRevenue = stats.actualRevenue;
  const milestones = [
    { label: 'First converted deal', achieved: actualRevenue > 0, bonus: '🎯 Initial Seed' },
    { label: '$15k Revenue Milestone', achieved: actualRevenue >= 15000, bonus: '💎 Silver Tier' },
    { label: 'Target sales goal met', achieved: actualRevenue >= targetGoal, bonus: '🏆 Elite Captain' }
  ];

  return (
    <div className="dashboard-container">
      {/* 🏆 Executive Dashboard (Overview) Header */}
      <div className="dashboard-welcome-banner" style={{
        background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.05), rgba(255, 0, 127, 0.05))',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>👋 Welcome back, System Administrator</h1>
          <p className="subtitle" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            FutureCRM Intelligent Client Lead Dashboard. Health Score: 94%.
          </p>
          
          {/* Quick actions buttons list */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-sub)', alignSelf: 'center', marginRight: '6px' }}>Quick Actions:</span>
            <button className="primary-btn" onClick={() => alert("Please navigate to Lead Management tab in the sidebar to add new leads.")} style={{ padding: '6px 12px', fontSize: '11px' }}>
              ＋ Add Lead
            </button>
            <button className="theme-btn" onClick={() => alert("Please navigate to Follow-ups tab in the sidebar to schedule follow-ups.")} style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
              📅 Schedule Follow-up
            </button>
            <button className="theme-btn" onClick={() => alert("Please navigate to Team Management tab in the sidebar to register employees.")} style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
              👨💼 Add Employee
            </button>
          </div>
        </div>

        {/* Right side Clock and AI Quick Action Launcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          {/* Live Clock & Date */}
          <div style={{
            textAlign: 'right',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px 18px',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--accent-pink)' }}>
              {liveTime}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '2px' }}>
              {liveDate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }}></div>
              <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Real-time Feed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3D Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Total Leads */}
        <div className="card-3d stat-card cyan-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Total Leads</h3>
              <div className="icon-badge"><UsersIcon className="w-5 h-5 text-cyan" /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{totalLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Total client profiles</div>
          </div>
        </div>

        {/* Card 2: Today's Leads */}
        <div className="card-3d stat-card green-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Today's Leads</h3>
              <div className="icon-badge"><PlusIcon className="w-5 h-5 text-green" /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{todayLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Ingested last 24 hrs</div>
          </div>
        </div>

        {/* Card 3: New Leads */}
        <div className="card-3d stat-card purple-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>New Leads</h3>
              <div className="icon-badge"><InfoIcon className="w-5 h-5 text-purple" /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{newLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Awaiting outreach</div>
          </div>
        </div>

        {/* Card 4: Contacted */}
        <div className="card-3d stat-card pink-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Contacted</h3>
              <div className="icon-badge"><KanbanIcon className="w-5 h-5 text-pink" /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{contactedLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>In active talks</div>
          </div>
        </div>

        {/* Card 5: Converted */}
        <div className="card-3d stat-card green-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Converted</h3>
              <div className="icon-badge"><RevenueIcon className="w-5 h-5 text-green" /></div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{convertedLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Converted clients</div>
          </div>
        </div>

        {/* Card 6: Lost */}
        <div className="card-3d stat-card pink-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Lost Leads</h3>
              <div className="icon-badge">❌</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{lostLeadsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Closed lost stats</div>
          </div>
        </div>

        {/* Card 7: Pending Tasks */}
        <div className="card-3d stat-card cyan-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Pending Follows</h3>
              <div className="icon-badge">📅</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{pendingFollowupsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Scheduled tasks</div>
          </div>
        </div>

        {/* Card 8: Overdue Tasks */}
        <div className="card-3d stat-card purple-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Overdue</h3>
              <div className="icon-badge" style={{ color: 'var(--accent-pink)' }}>⚠️</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0', color: overdueFollowupsCount > 0 ? 'var(--accent-pink)' : '#fff' }}>{overdueFollowupsCount}</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Missed schedules</div>
          </div>
        </div>

        {/* Card 9: Conversion Rate */}
        <div className="card-3d stat-card green-glow" onMouseMove={(e) => handleMouseMove(e, e.currentTarget)} onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}>
          <div className="card-3d-inner" style={{ padding: '14px' }}>
            <div className="card-glow"></div>
            <div className="stat-card-header">
              <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-sub)' }}>Win Rate</h3>
              <div className="icon-badge">📈</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '26px', margin: '4px 0' }}>{conversionRatePct}%</div>
            <div className="stat-card-desc" style={{ fontSize: '9px', color: 'var(--text-sub)' }}>Overall success rate</div>
          </div>
        </div>

      </div>

      {/* Grid: Goal Tracker & Canvas Charts */}
      <div className="dashboard-charts-grid">
        {/* Circular progress gauge */}
        <GoalTracker
          actualRevenue={stats.actualRevenue}
          targetGoal={targetGoal}
          onTargetChange={onTargetChange}
        />

        {/* Channels Doughnut Chart */}
        <div className="card-3d chart-card channel-chart">
          <div className="card-3d-inner">
            <h3>Leads by Acquisition Channel</h3>
            <p className="subtitle">Breakdown of inquiry sources</p>
            <div className="canvas-wrapper">
              <canvas ref={sourceCanvasRef} />
            </div>
          </div>
        </div>

        {/* Growth Line Graph */}
        <div className="card-3d chart-card growth-chart">
          <div className="card-3d-inner">
            <h3>Monthly Acquisition Trend</h3>
            <p className="subtitle">Leads ingested per month</p>
            <div className="canvas-wrapper">
              <canvas ref={growthCanvasRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Business Widgets Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
        
        {/* Today's Tasks & Upcoming Meetings */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>📋 Today's Tasks & Meetings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255, 0, 127, 0.05)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent-pink)' }}>
              <span>🕒</span>
              <div>
                <strong style={{ fontSize: '12px', display: 'block' }}>11:30 AM - Discovery Call</strong>
                <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Client: Alex Johnson (CloudTech)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(0, 243, 255, 0.05)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)' }}>
              <span>📝</span>
              <div>
                <strong style={{ fontSize: '12px', display: 'block' }}>03:00 PM - Proposal Review</strong>
                <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>Client: Michael Chang (Apex Corp)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hot & High Priority Leads */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>🔥 Hot & High Priority Leads</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', maxHeight: '180px', overflowY: 'auto' }}>
            {leads.filter(l => l.probability >= 50 && l.status !== 'converted' && l.status !== 'lost' && !l.tags?.includes('Archived')).map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ fontSize: '12px', display: 'block' }}>{l.name}</strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-sub)' }}>{l.company || 'Individual'}</span>
                </div>
                <span className="badge-purple" style={{ fontSize: '9px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'none' }}>
                  {l.probability}% Win Rate
                </span>
              </div>
            ))}
            {leads.filter(l => l.probability >= 50 && l.status !== 'converted' && l.status !== 'lost' && !l.tags?.includes('Archived')).length === 0 && (
              <div className="empty-notes" style={{ fontSize: '11px', textAlign: 'center', padding: '20px' }}>No active hot leads.</div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>🕒 Recent Activity Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {leads.slice(0, 3).map(l => (
              <div key={l.id} style={{ fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-sub)' }}>New lead ingested:</span> <strong>{l.name}</strong> ({l.source})
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Charts & KPI distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        {/* Sales Funnel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>🎯 Sales Pipeline Funnel</h3>
          <p className="subtitle">Stages progression distribution</p>
          <div style={{ height: '180px', position: 'relative', marginTop: '10px' }}>
            <canvas ref={funnelCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Business Metrics details */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3>📈 Business Performance KPIs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-sub)' }}>CRM Health Score:</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>94% Excellent</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-sub)' }}>Average Response Velocity:</span>
              <strong style={{ color: 'var(--accent-green)' }}>1.8 Hours</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-sub)' }}>Average Closing Ratio:</span>
              <strong style={{ color: 'var(--accent-pink)' }}>{conversionRatePct}%</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
