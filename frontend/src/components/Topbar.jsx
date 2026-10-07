import React from 'react';
import { Search, Shield, Plus, Upload, X, Bot } from 'lucide-react';

export default function Topbar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenCreateSpace,
  onOpenUploadVideo,
  onOpenPrivacy,
  onOpenAIAssistant
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="topbar">
      {/* Search Bar */}
      <div className="topbar-center">
        <div className="search-box-container">
          <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            id="global-search-input"
            type="text"
            className="search-input"
            placeholder="Search videos, creators, or topics across BINGE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="topbar-actions">
        {/* Privacy Shield Pill */}
        <button
          id="topbar-privacy-pill"
          className="privacy-pill-btn"
          onClick={onOpenPrivacy}
          title="BINGE Zero-Tracking Active: No profiling, no behavioral algorithms."
        >
          <Shield size={14} />
          <span>Tracking: OFF</span>
        </button>

        {/* AI Assistant Quick Pill */}
        <button
          className="btn-secondary"
          onClick={onOpenAIAssistant}
          style={{ padding: '7px 12px', fontSize: '0.84rem' }}
          title="Open Privacy-First AI Assistant"
        >
          <Bot size={15} color="var(--accent-cyan)" />
          <span>Ask AI</span>
        </button>

        {/* New Space Quick Action */}
        <button
          id="topbar-add-space-btn"
          className="btn-secondary"
          onClick={onOpenCreateSpace}
          style={{ padding: '7px 14px', fontSize: '0.84rem' }}
          title="Create a new Space"
        >
          <Plus size={15} />
          <span>New Space</span>
        </button>

        {/* Upload Video Button */}
        <button
          id="topbar-upload-video-btn"
          className="btn-primary"
          onClick={onOpenUploadVideo}
          style={{ padding: '7px 16px', fontSize: '0.84rem' }}
        >
          <Upload size={15} />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
