import React, { useState } from 'react';
import { X, Plus, Check, ListPlus } from 'lucide-react';
import { localStore } from '../services/localHistory';

export default function AddToPlaylistModal({
  video,
  playlists = [],
  onClose,
  onUpdatePlaylists
}) {
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!video) return null;

  const handleToggleInPlaylist = (playlist) => {
    const isAlreadyIn = playlist.videos.some((v) => v.id === video.id);
    let updated;
    if (isAlreadyIn) {
      updated = localStore.removeVideoFromPlaylist(playlist.id, video.id);
    } else {
      updated = localStore.addVideoToPlaylist(playlist.id, video);
    }
    onUpdatePlaylists(updated);
  };

  const handleCreateNew = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const createdList = localStore.createPlaylist(newTitle);
    // Add current video to this newly created playlist
    const newPlId = createdList[0].id;
    const updated = localStore.addVideoToPlaylist(newPlId, video);
    onUpdatePlaylists(updated);
    setNewTitle('');
    setIsCreating(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListPlus size={20} color="var(--accent-cyan)" />
            <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>Add to Playlist</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Add &ldquo;{video.title}&rdquo; to your playlists:
        </p>

        {/* Playlists List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '240px', overflowY: 'auto' }}>
          {playlists.map((pl) => {
            const isInPlaylist = pl.videos.some((v) => v.id === video.id);
            return (
              <div
                key={pl.id}
                onClick={() => handleToggleInPlaylist(pl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isInPlaylist ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-input)',
                  border: isInPlaylist ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pl.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {pl.videos.length} {pl.videos.length === 1 ? 'video' : 'videos'}
                  </div>
                </div>

                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-xs)',
                    border: isInPlaylist ? 'none' : '1px solid var(--border-subtle)',
                    background: isInPlaylist ? 'var(--accent-cyan)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#030712'
                  }}
                >
                  {isInPlaylist && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline Create Form */}
        {isCreating ? (
          <form onSubmit={handleCreateNew} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="New playlist name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 14px' }}>
              Add
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreating(false)}
              style={{ padding: '8px 12px' }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            className="btn-secondary"
            onClick={() => setIsCreating(true)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={16} />
            <span>Create New Playlist</span>
          </button>
        )}
      </div>
    </div>
  );
}
