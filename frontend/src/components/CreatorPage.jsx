import React, { useState } from 'react';
import { ArrowLeft, Users, Film, Eye } from 'lucide-react';
import VideoCard from './VideoCard';
import { localStore } from '../services/localHistory';

export default function CreatorPage({
  creatorName,
  videos = [],
  savedVideos = [],
  onBack,
  onPlayVideo,
  onToggleSave,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const creatorVideos = videos.filter(
    (v) => v.creator_name && v.creator_name.toLowerCase() === creatorName.toLowerCase()
  );

  const [isSubscribed, setIsSubscribed] = useState(() =>
    localStore.isSubscribed(creatorName)
  );

  const handleToggleSub = () => {
    const res = localStore.toggleSubscription(creatorName);
    setIsSubscribed(res.isSubscribed);
  };

  const totalViews = creatorVideos.reduce((acc, v) => acc + (v.views_count || 0), 0);
  const initial = creatorName ? creatorName.charAt(0).toUpperCase() : 'C';

  return (
    <div>
      {/* Back button */}
      <button
        className="btn-secondary"
        onClick={onBack}
        style={{ marginBottom: '20px', padding: '8px 14px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Browse</span>
      </button>

      {/* Channel Banner */}
      <div className="creator-banner" />

      {/* Creator Header Profile */}
      <div className="creator-header-card">
        <div className="creator-identity-group">
          <div className="creator-avatar-hero">{initial}</div>
          <div>
            <h1 className="creator-hero-title">{creatorName}</h1>
            <div className="creator-hero-stats">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Film size={15} /> {creatorVideos.length} {creatorVideos.length === 1 ? 'video' : 'videos'}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={15} /> {totalViews} views
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Users size={15} /> {isSubscribed ? 'Subscribed' : 'Channel'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <button
            className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleToggleSub}
            style={{ padding: '10px 24px', fontSize: '0.94rem' }}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>

      {/* Creator Videos Grid */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
          Uploads by {creatorName}
        </h2>
      </div>

      {creatorVideos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <h3>No videos from this creator</h3>
          <p style={{ marginTop: '6px' }}>This creator hasn't published any videos yet.</p>
        </div>
      ) : (
        <div className="video-grid">
          {creatorVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isSaved={savedVideos.some((v) => v.id === video.id)}
              onToggleSave={onToggleSave}
              onPlayVideo={onPlayVideo}
              onSelectSpace={onSelectSpace}
              onOpenAddToPlaylist={onOpenAddToPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
