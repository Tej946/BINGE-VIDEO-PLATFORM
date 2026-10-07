import React, { useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import VideoCard from './VideoCard';
import { localStore } from '../services/localHistory';

export default function SubscriptionsPage({
  subscriptions = [],
  videos = [],
  savedVideos = [],
  onUpdateSubscriptions,
  onPlayVideo,
  onToggleSave,
  onSelectCreator,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const [selectedCreator, setSelectedCreator] = useState('all');

  const handleUnsub = (creatorName) => {
    const res = localStore.toggleSubscription(creatorName);
    onUpdateSubscriptions(res.subscriptions);
  };

  // Filter videos from subscribed creators
  const subscribedVideos = videos.filter((v) =>
    subscriptions.some((sub) => sub.toLowerCase() === (v.creator_name || '').toLowerCase())
  );

  const displayedVideos =
    selectedCreator === 'all'
      ? subscribedVideos
      : subscribedVideos.filter(
          (v) => (v.creator_name || '').toLowerCase() === selectedCreator.toLowerCase()
        );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={28} color="var(--accent-cyan)" />
          <span>Subscriptions</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
          Follow your favorite creators. Stored strictly in your browser without cloud profiling.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No subscriptions yet</h3>
          <p style={{ marginTop: '6px' }}>
            Click "Subscribe" on any video watch page or creator channel to follow their uploads here.
          </p>
        </div>
      ) : (
        <>
          {/* Creator Pill Bar */}
          <div className="filter-chips-bar" style={{ marginBottom: '28px' }}>
            <button
              className={`filter-chip ${selectedCreator === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCreator('all')}
            >
              All Subscriptions ({subscribedVideos.length})
            </button>

            {subscriptions.map((creator) => (
              <div
                key={creator}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: selectedCreator === creator ? 'var(--accent-cyan)' : 'var(--bg-card)',
                  color: selectedCreator === creator ? '#040812' : 'var(--text-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                  gap: '8px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedCreator(creator)}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#040812',
                    color: '#FFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {creator.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{creator}</span>
              </div>
            ))}
          </div>

          {/* Videos Grid */}
          {displayedVideos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <h3>No videos found</h3>
              <p style={{ marginTop: '6px' }}>This creator hasn't uploaded any videos yet.</p>
            </div>
          ) : (
            <div className="video-grid">
              {displayedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSaved={savedVideos.some((v) => v.id === video.id)}
                  onToggleSave={onToggleSave}
                  onPlayVideo={onPlayVideo}
                  onSelectCreator={onSelectCreator}
                  onSelectSpace={onSelectSpace}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
