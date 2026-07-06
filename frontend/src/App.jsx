import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import LeadProfile from './components/LeadProfile';
import FollowupsDashboard from './components/FollowupsDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NotificationsDashboard from './components/NotificationsDashboard';
import TeamDashboard from './components/TeamDashboard';
import SettingsDashboard from './components/SettingsDashboard';
import AiAssistant from './components/AiAssistant';
import LoginForm from './components/LoginForm';
import Toast from './components/Toast';
import ParticleBackground from './components/ParticleBackground';
import LeadDrawer from './components/LeadDrawer';
import { api } from './services/api';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeLeadId, setActiveLeadId] = useState(null);
  
  // Custom Theming & Settings
  const [activeTheme, setActiveTheme] = useState('cyberpunk'); // cyberpunk, light, slate
  const [targetGoal, setTargetGoal] = useState(150000);
  const [syncStatus, setSyncStatus] = useState('synced'); // synced, offline
  const [userRole, setUserRole] = useState('Admin'); // Admin, Sales Rep, Analyst
  const [currency, setCurrency] = useState('$');

  // Sidebar navigation expansion state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Custom cursor position states
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);

    if (!isTouch) {
      const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Smooth trail interpolation using requestAnimationFrame
  useEffect(() => {
    if (isTouchDevice) return;
    let animId;
    const updateTrail = () => {
      setTrailPos(prev => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        return {
          x: prev.x + dx / 5,
          y: prev.y + dy / 5
        };
      });
      animId = requestAnimationFrame(updateTrail);
    };
    animId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animId);
  }, [mousePos, isTouchDevice]);

  // Backdrop physics settings
  const [particleSpeed, setParticleSpeed] = useState(0.4);
  const [particleColor, setParticleColor] = useState('cyan');

  // Bell Notifications list
  const [notifications, setNotifications] = useState([
    { id: 1, message: '🎉 Direct Website Form captures are online.', time: '09:00 AM' },
    { id: 2, message: '⚠️ Alert: SQLite Local Database connected successfully.', time: '09:05 AM' }
  ]);



  // UI States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);

  // Adjust sidebar default width based on viewport width at start
  useEffect(() => {
    if (window.innerWidth < 900) {
      setSidebarExpanded(false);
    }
  }, []);

  // Trigger Toast Notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Append a notification alert dynamically
  const pushNotification = (message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotifications((prev) => [
      { id: Date.now(), message, time },
      ...prev
    ]);
  };

  // Verify token status on load
  useEffect(() => {
    const checkAuth = async () => {
      const authenticatedUser = await api.verifyAuth();
      if (authenticatedUser) {
        setUser(authenticatedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };
    checkAuth();

    // Check offline status
    const handleOnline = () => setSyncStatus('synced');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch leads and stats when authenticated
  const loadCrmData = async () => {
    if (!isAuthenticated) return;
    setLoadingLeads(true);
    try {
      const leadsList = await api.getLeads();
      const statsData = await api.getAnalyticsStats();
      setLeads(leadsList);
      setStats(statsData);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
      showToast('Error syncing with local database.', 'error');
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadCrmData();
  }, [isAuthenticated]);

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  // Seed Mock Data
  const handleSeedMockData = async () => {
    setLoadingSeed(true);
    try {
      const res = await api.seedMockData();
      showToast(res.message, 'success');
      pushNotification('🔄 Seeder initialized: 15 Leads seeded in database.');
      await loadCrmData();
    } catch (err) {
      showToast('Error seeding database.', 'error');
    } finally {
      setLoadingSeed(false);
    }
  };

  // Lead CRUD Operations
  const handleCreateLead = async (leadData) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit record modifications.', 'error');
      return;
    }
    await api.createLead(leadData);
    pushNotification(`👤 New manual lead added: ${leadData.name}`);
    await loadCrmData();
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit record modifications.', 'error');
      return;
    }
    try {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;
      
      const updatedData = { ...lead, status: newStatus };
      if (newStatus === 'new') updatedData.probability = 20;
      else if (newStatus === 'contacted') updatedData.probability = 40;
      else if (newStatus === 'proposal') updatedData.probability = 70;
      else if (newStatus === 'converted') updatedData.probability = 100;
      else if (newStatus === 'lost') updatedData.probability = 0;

      await api.updateLead(leadId, updatedData);
      pushNotification(`📈 ${lead.name} shifted stage status to '${newStatus}'`);
      await loadCrmData();
    } catch (err) {
      showToast('Status update failed.', 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit record modifications.', 'error');
      return;
    }
    try {
      const lead = leads.find((l) => l.id === leadId);
      await api.deleteLead(leadId);
      if (activeLeadId === leadId) setActiveLeadId(null);
      pushNotification(`🗑️ Lead deleted from database: ${lead ? lead.name : 'Unknown'}`);
      await loadCrmData();
      showToast('Lead deleted.', 'success');
    } catch (err) {
      showToast('Deletion failed.', 'error');
    }
  };

  const handleBulkDelete = async (ids) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit modifications.', 'error');
      return;
    }
    await api.bulkDeleteLeads(ids);
    pushNotification(`🗑️ Bulk deleted: ${ids.length} records removed.`);
    await loadCrmData();
  };

  const handleBulkUpdateStatus = async (ids, status) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit modifications.', 'error');
      return;
    }
    await api.bulkUpdateLeads(ids, status);
    pushNotification(`⚡ Bulk updated status: ${ids.length} records set to '${status}'.`);
    await loadCrmData();
  };

  const handleBulkImport = async (importedLeads) => {
    if (userRole === 'Analyst') {
      showToast('Analyst role does not permit modifications.', 'error');
      return;
    }
    await api.bulkImportLeads(importedLeads);
    pushNotification(`📥 Data Restored: Ingested ${importedLeads.length} leads successfully.`);
    await loadCrmData();
  };



  // Render View Routing
  const renderView = () => {
    if (!isAuthenticated) {
      return (
        <LoginForm
          onLoginSuccess={(userData) => {
            setUser(userData);
            setIsAuthenticated(true);
            setCurrentView('dashboard');
          }}
          showToast={showToast}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            leads={leads}
            targetGoal={targetGoal}
            onTargetChange={setTargetGoal}
            onSeedMockData={handleSeedMockData}
            loadingSeed={loadingSeed}
            particleSpeed={particleSpeed}
            onParticleSpeedChange={setParticleSpeed}
            particleColor={particleColor}
            onParticleColorChange={setParticleColor}
            currency={currency}
            onCurrencyChange={setCurrency}
            onToggleAi={() => setIsAiOpen(true)}
          />
        );
      case 'leads':
        return (
          <LeadTable
            leads={leads}
            onViewLead={(id) => {
              setActiveLeadId(id);
              setCurrentView('profile');
            }}
            onDeleteLead={handleDeleteLead}
            onCreateLead={handleCreateLead}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onBulkImport={handleBulkImport}
            showToast={showToast}
            currency={currency}
          />
        );
      case 'profile':
        return (
          <LeadProfile
            leads={leads}
            currentLeadId={activeLeadId}
            onSelectLead={setActiveLeadId}
            showToast={showToast}
          />
        );
      case 'followups':
        return (
          <FollowupsDashboard
            leads={leads}
            showToast={showToast}
          />
        );
      case 'analytics':
        return (
          <AnalyticsDashboard
            leads={leads}
            showToast={showToast}
            currency={currency}
          />
        );
      case 'notifications':
        return (
          <NotificationsDashboard
            notifications={notifications}
            onClearNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            showToast={showToast}
          />
        );
      case 'team':
        return (
          <TeamDashboard
            leads={leads}
            showToast={showToast}
          />
        );
      case 'settings':
        return (
          <SettingsDashboard
            activeTheme={activeTheme}
            onThemeChange={setActiveTheme}
            currency={currency}
            onCurrencyChange={setCurrency}
            targetGoal={targetGoal}
            onTargetChange={setTargetGoal}
            onSeedMockData={handleSeedMockData}
            loadingSeed={loadingSeed}
            leads={leads}
            onWipeDatabase={async () => {
              try {
                await api.bulkDeleteLeads(leads.map(l => l.id));
                await loadCrmData();
                pushNotification('⚠️ Wiped CRM database completely.');
                showToast('Database wiped clean.', 'success');
              } catch (err) {
                showToast('Wipe action failed.', 'error');
              }
            }}
            showToast={showToast}
          />
        );
      default:
        return <div>View not found.</div>;
    }
  };

  return (
    <div className={`theme-${activeTheme} app-viewport`}>
      {/* HTML5 Canvas backdrop */}
      <ParticleBackground activeTheme={activeTheme} />

      {/* Render Navbar only if authenticated or if explicitly showing public simulator form */}
      {(isAuthenticated || currentView === 'form') && (
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
          user={user}
          syncStatus={syncStatus}
          notifications={notifications}
          onClearNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
          userRole={userRole}
          onRoleChange={setUserRole}
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
        />
      )}

      {/* Main content grid - class name handles margins dynamically */}
      <main className={`app-main-content ${
        (!isAuthenticated && currentView !== 'form')
          ? 'full-width-login'
          : sidebarExpanded
            ? 'sidebar-expanded'
            : 'sidebar-collapsed'
      }`}>
        {currentView !== 'dashboard' && (
          <button 
            className="theme-btn" 
            onClick={() => setCurrentView('dashboard')}
            style={{ 
              marginBottom: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 14px', 
              fontSize: '11px',
              fontWeight: 'bold',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Executive Dashboard
          </button>
        )}
        <div key={currentView} className="dashboard-view-transition-wrapper">
          {renderView()}
        </div>
      </main>

      {/* Slide-out detail drawer */}
      {activeLeadId && (
        <LeadDrawer
          leadId={activeLeadId}
          onClose={() => setActiveLeadId(null)}
          onLeadUpdated={loadCrmData}
          showToast={showToast}
          currency={currency}
        />
      )}

      {/* Floating Alerts */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom Glowing Cursor Trail */}
      {!isTouchDevice && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-pink)',
              transform: `translate(${mousePos.x - 4}px, ${mousePos.y - 4}px)`,
              pointerEvents: 'none',
              zIndex: 99999,
              boxShadow: '0 0 10px var(--accent-pink)',
              transition: 'transform 0.03s linear'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1.5px solid var(--accent-cyan)',
              transform: `translate(${trailPos.x - 13}px, ${trailPos.y - 13}px)`,
              pointerEvents: 'none',
              zIndex: 99998,
              boxShadow: '0 0 12px rgba(0, 243, 255, 0.4)',
              transition: 'transform 0.05s ease-out'
            }}
          />
        </>
      )}
      {/* Floating AI Assistant Trigger Button */}
      <button 
        className="floating-ai-btn" 
        onClick={() => setIsAiOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00f3ff, #ff007f)',
          boxShadow: '0 0 20px rgba(0, 243, 255, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9990,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        title="Open AI CRM Assistant"
      >
        🤖
      </button>

      {/* Floating AI Assistant Drawer */}
      <AiAssistant 
        leads={leads}
        showToast={showToast}
        currency={currency}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
};

export default App;
