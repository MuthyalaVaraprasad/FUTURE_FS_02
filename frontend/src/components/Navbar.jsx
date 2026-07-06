import React, { useState } from 'react';
import { 
  DashboardIcon, 
  UsersIcon, 
  KanbanIcon, 
  FormIcon, 
  SettingsIcon, 
  LogoutIcon,
  TasksIcon
} from './Icons';

const Navbar = ({
  currentView,
  onViewChange,
  onLogout,
  user,
  syncStatus,
  notifications = [],
  onClearNotification,
  userRole = 'Admin',
  onRoleChange,
  sidebarExpanded,
  onToggleSidebar
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Expanded menu list (8 views)
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'leads', label: 'Lead Management', icon: <UsersIcon className="w-5 h-5" /> },
    { 
      id: 'profile', 
      label: 'Lead Profile', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ) 
    },
    { id: 'followups', label: 'Follow-ups', icon: <TasksIcon className="w-5 h-5" /> },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ) 
    },
    { 
      id: 'team', 
      label: 'Team Management', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ) 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ) 
    },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> }
  ];

  const handleNavClick = (viewId) => {
    onViewChange(viewId);
  };

  return (
    <>
      {/* 1. TOP HEADER BAR */}
      <header className="navbar-container">
        <div className="navbar-wrapper">
          {/* Left: Hamburger menu toggle ("3 lines") & Brand Title */}
          <div className="header-left">
            <button 
              className="sidebar-hamburger-btn" 
              onClick={onToggleSidebar}
              title="Toggle Navigation Menu"
            >
              <div className="hamburger-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <div className="nav-brand" onClick={() => handleNavClick('dashboard')}>
              <div className="nav-logo-3d">
                <span>F</span>
              </div>
              <span className="brand-text">Future<span className="accent-text">CRM</span></span>
            </div>
          </div>

          {/* Right: Role, Notification bell, User info & Logout */}
          <div className="user-profile-section">
            <div className="role-selector-wrapper">
              <span className="role-label">Role:</span>
              <select
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="role-selector-dropdown"
              >
                <option value="Admin">Admin</option>
                <option value="Sales Rep">Sales Specialist</option>
                <option value="Analyst">Guest Analyst</option>
              </select>
            </div>

            {/* Notification Bell Center */}
            <div className="bell-container">
              <button 
                className="bell-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="bell-badge">{notifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown glass-panel animate-slide-up">
                  <div className="notifications-header">
                    <h4>Activity Alerts</h4>
                    {notifications.length > 0 && (
                      <button className="clear-all-notif-btn" onClick={() => {
                        notifications.forEach(n => onClearNotification(n.id));
                        setShowNotifications(false);
                      }}>Clear All</button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">No new activity.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="notification-item">
                          <div className="notif-desc">
                            <p>{notif.message}</p>
                            <span className="notif-time">{notif.time}</span>
                          </div>
                          <button className="notif-close-btn" onClick={() => onClearNotification(notif.id)}>✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="user-info">
                <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                <span className="user-name">{user.username}</span>
              </div>
            )}
            
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. LEFT COLLAPSIBLE SIDEBAR MENU */}
      <aside className={`crm-sidebar-aside ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-inner-wrapper">
          {/* Navigation Links */}
          <div className="sidebar-links-list">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item-btn ${currentView === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={!sidebarExpanded ? item.label : ''}
              >
                <div className="sidebar-icon-wrap">{item.icon}</div>
                <span className="sidebar-label-span">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sidebar Footer (Sync Status Details) */}
          <div className="sidebar-footer-block">
            <div className="sync-badge">
              <span className={`sync-dot ${syncStatus}`}></span>
              {sidebarExpanded && (
                <span className="sync-label">
                  {syncStatus === 'synced' ? 'Live Mode' : 'Disconnected'}
                </span>
              )}
            </div>
            
            {sidebarExpanded && user && (
              <div className="sidebar-user-details font-mono">
                <span>Rep: {user.username}</span>
                <span className="role-sub-label">{userRole}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 3. MOBILE SIDEBAR DRAWER OVERLAY */}
      {sidebarExpanded && (
        <div className="mobile-sidebar-overlay" onClick={onToggleSidebar}></div>
      )}
    </>
  );
};

export default Navbar;
