import React from 'react';
import {
  Home,
  Compass,
  Search,
  Layers,
  Bookmark,
  ListMusic,
  Users,
  Bot,
  Settings,
  Plus,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function Sidebar({
  spaces = [],
  activeView,
  setActiveView,
  selectedSpace,
  setSelectedSpace,
  onOpenCreateSpace,
  onOpenPrivacy,
  backendConnected,
  savedCount = 0,
  playlistCount = 0,
  subCount = 0
}) {
  const handleNavClick = (view) => {
    setActiveView(view);
    setSelectedSpace(null);
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-section" onClick={() => handleNavClick('home')}>
        <div className="brand-logo">
          <Layers size={22} strokeWidth={2.5} />
        </div>
        <div>
          <span className="brand-title">BINGE</span>
        </div>
        <span className="brand-badge">480p</span>
      </div>

      {/* Primary Navigation */}
      <div className="sidebar-nav">
        <button
          id="nav-home-btn"
          className={`nav-link ${activeView === 'home' && !selectedSpace ? 'active' : ''}`}
          onClick={() => handleNavClick('home')}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          id="nav-explore-btn"
          className={`nav-link ${activeView === 'explore' ? 'active' : ''}`}
          onClick={() => handleNavClick('explore')}
        >
          <Compass size={18} />
          <span>Explore</span>
        </button>

        <button
          id="nav-search-btn"
          className={`nav-link ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => handleNavClick('search')}
        >
          <Search size={18} />
          <span>Search</span>
        </button>

        <button
          id="nav-spaces-btn"
          className={`nav-link ${activeView === 'spaces' ? 'active' : ''}`}
          onClick={() => handleNavClick('spaces')}
        >
          <Layers size={18} />
          <span>Spaces</span>
          {spaces.length > 0 && <span className="nav-link-badge">{spaces.length}</span>}
        </button>

        <button
          id="nav-saved-btn"
          className={`nav-link ${activeView === 'saved' ? 'active' : ''}`}
          onClick={() => handleNavClick('saved')}
        >
          <Bookmark size={18} />
          <span>Saved</span>
          {savedCount > 0 && <span className="nav-link-badge">{savedCount}</span>}
        </button>

        <button
          id="nav-playlists-btn"
          className={`nav-link ${activeView === 'playlists' ? 'active' : ''}`}
          onClick={() => handleNavClick('playlists')}
        >
          <ListMusic size={18} />
          <span>Playlists</span>
          {playlistCount > 0 && <span className="nav-link-badge">{playlistCount}</span>}
        </button>

        <button
          id="nav-subscriptions-btn"
          className={`nav-link ${activeView === 'subscriptions' ? 'active' : ''}`}
          onClick={() => handleNavClick('subscriptions')}
        >
          <Users size={18} />
          <span>Subscriptions</span>
          {subCount > 0 && <span className="nav-link-badge">{subCount}</span>}
        </button>

        <button
          id="nav-ai-btn"
          className={`nav-link ${activeView === 'ai-assistant' ? 'active' : ''}`}
          onClick={() => handleNavClick('ai-assistant')}
        >
          <Bot size={18} color="var(--accent-cyan)" />
          <span>AI Assistant</span>
        </button>

        <button
          id="nav-settings-btn"
          className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

      <div className="sidebar-section-divider" />

      {/* User Spaces List */}
      <div className="sidebar-section-title">
        <span>YOUR SPACES</span>
        <button
          id="create-space-btn"
          onClick={onOpenCreateSpace}
          title="Create a custom Space"
        >
          <Plus size={14} /> NEW
        </button>
      </div>

      <div className="spaces-scroll-container">
        {spaces.length === 0 ? (
          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No spaces created yet. Click NEW to create your first space!
          </div>
        ) : (
          spaces.map((sp) => {
            const isActive = selectedSpace && selectedSpace.slug === sp.slug;
            return (
              <button
                key={sp.id || sp.slug}
                id={`space-btn-${sp.slug}`}
                className={`space-item-btn ${isActive ? 'active' : ''}`}
                style={{ '--active-color': sp.color || 'var(--accent-cyan)' }}
                onClick={() => {
                  setSelectedSpace(sp);
                  setActiveView('space');
                }}
              >
                <div className="space-item-left">
                  <span className="space-icon">{sp.icon || '📁'}</span>
                  <span style={{ fontWeight: isActive ? 600 : 400 }}>{sp.name}</span>
                </div>
                {sp.video_count !== undefined && (
                  <span className="space-count-badge">{sp.video_count}</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          id="sidebar-privacy-btn"
          onClick={onOpenPrivacy}
          className="nav-link"
          style={{ padding: '7px 10px', fontSize: '0.82rem' }}
        >
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>Privacy Center</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            color: 'var(--text-muted)'
          }}
        >
          <Radio size={12} color={backendConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)'} />
          <span>{backendConnected ? 'API Connected' : 'Offline Mode'}</span>
        </div>
      </div>
    </aside>
  );
}
