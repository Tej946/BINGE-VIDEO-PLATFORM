import React, { useState } from 'react';
import { ListMusic, Plus, Play, Trash2, ArrowLeft } from 'lucide-react';
import VideoCard from './VideoCard';
import { localStore } from '../services/localHistory';

function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaylistsPage({
  playlists = [],
  savedVideos = [],
  onUpdatePlaylists,
  onPlayVideo,
  onToggleSave,
  onSelectCreator,
  onSelectSpace
}) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = localStore.createPlaylist(newTitle, newDesc);
    onUpdatePlaylists(updated);
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleDelete = (playlistId) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      const updated = localStore.deletePlaylist(playlistId);
      onUpdatePlaylists(updated);
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
      }
    }
  };

  const handleRemoveVideo = (playlistId, videoId) => {
    const updated = localStore.removeVideoFromPlaylist(playlistId, videoId);
    onUpdatePlaylists(updated);
  };

  // If viewing a specific playlist
  if (selectedPlaylist) {
    const totalDuration = (selectedPlaylist.videos || []).reduce(
      (acc, v) => acc + (v.duration || 0),
      0
    );

    return (
      <div>
        <button
          className="btn-secondary"
          onClick={() => setSelectedPlaylistId(null)}
          style={{ marginBottom: '20px', padding: '8px 14px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Custom Playlist
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
              {selectedPlaylist.title}
            </h1>
            {selectedPlaylist.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '600px' }}>
                {selectedPlaylist.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span>{selectedPlaylist.videos?.length || 0} videos</span>
              <span>•</span>
              <span>Total run: {formatDuration(totalDuration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedPlaylist.videos && selectedPlaylist.videos.length > 0 && (
              <button
                className="btn-primary"
                onClick={() => onPlayVideo(selectedPlaylist.videos[0])}
              >
                <Play size={16} fill="currentColor" />
                <span>Play All</span>
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={() => handleDelete(selectedPlaylist.id)}
              style={{ color: 'var(--accent-rose)' }}
              title="Delete Playlist"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Videos in Playlist */}
        {(!selectedPlaylist.videos || selectedPlaylist.videos.length === 0) ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h3>Playlist is empty</h3>
            <p style={{ marginTop: '6px' }}>
              Add videos to this playlist by clicking the playlist icon on any video card or watch page.
            </p>
          </div>
        ) : (
          <div className="video-grid">
            {selectedPlaylist.videos.map((video) => (
              <div key={video.id} style={{ position: 'relative' }}>
                <VideoCard
                  video={video}
                  isSaved={savedVideos.some((v) => v.id === video.id)}
                  onToggleSave={onToggleSave}
                  onPlayVideo={onPlayVideo}
                  onSelectCreator={onSelectCreator}
                  onSelectSpace={onSelectSpace}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVideo(selectedPlaylist.id, video.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  title="Remove from playlist"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // All Playlists Grid
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ListMusic size={28} color="var(--accent-cyan)" />
            <span>Playlists</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Organize videos into custom collections. Stored locally without cloud tracking.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom: '16px' }}>Create New Playlist</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Playlist Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cinema Masterclasses, Coding Deep Dives"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="What is this collection about?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Playlists Grid */}
      <div className="spaces-grid">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="space-card"
            onClick={() => setSelectedPlaylistId(pl.id)}
          >
            <div className="space-card-top">
              <span className="space-card-icon">📁</span>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {pl.videos?.length || 0} {pl.videos?.length === 1 ? 'video' : 'videos'}
              </span>
            </div>

            <h3 className="space-card-title">{pl.title}</h3>

            <p className="space-card-desc">
              {pl.description || 'Custom user playlist.'}
            </p>

            <div className="space-card-footer">
              <span style={{ fontSize: '0.8rem' }}>View Collection</span>
              <Play size={14} color="var(--accent-cyan)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
