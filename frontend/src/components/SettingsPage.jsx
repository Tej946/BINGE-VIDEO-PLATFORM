import React, { useState } from 'react';
import { Settings, Shield, Trash2, Download, Check, RefreshCw } from 'lucide-react';
import { localStore } from '../services/localHistory';

export default function SettingsPage({ onClearHistory, historyCount = 0 }) {
  const [settings, setSettings] = useState(() => localStore.getSettings());
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStore.saveSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      savedVideos: localStore.getSavedVideos(),
      playlists: localStore.getPlaylists(),
      subscriptions: localStore.getSubscriptions(),
      history: localStore.getHistory(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `binge_privacy_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="var(--accent-cyan)" />
          <span>Platform Settings</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
          Manage your playback preferences and local privacy controls.
        </p>
      </div>

      {savedFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: 'var(--accent-emerald)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>Settings saved locally.</span>
        </div>
      )}

      {/* Privacy Controls Section */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-emerald)" />
          <span>Privacy & Data Hygiene</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Strict Privacy Shield</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Guarantees zero behavioral profiling, zero third-party telemetry, and ad-free experience.
              </div>
            </div>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.85rem' }}>ALWAYS ON</span>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Record Local Watch History</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Saves watched videos strictly in your browser for the "Continue Watching" shelf.
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.recordHistory}
                onChange={() => handleToggle('recordHistory')}
                style={{ accentColor: 'var(--accent-cyan)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Clear Watch History</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Permanently wipes all {historyCount} locally recorded watch history items and progress.
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={onClearHistory}
              style={{ color: 'var(--accent-rose)', fontSize: '0.84rem', padding: '6px 14px' }}
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Streaming & Playback Preferences */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
          Playback & Video Streaming
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Lean Streaming Resolution</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Default 480p resolution optimized for instant playback and minimal bandwidth.
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              480p Lean Stream
            </span>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Auto-play Next Video</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Automatically play the next related video when current video completes.
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.autoplayNext}
                onChange={() => handleToggle('autoplayNext')}
                style={{ accentColor: 'var(--accent-cyan)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Backup Your Data</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Export your saved videos, custom playlists, and creator subscriptions as JSON.
          </div>
        </div>
        <button className="btn-secondary" onClick={handleExportData}>
          <Download size={16} />
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
