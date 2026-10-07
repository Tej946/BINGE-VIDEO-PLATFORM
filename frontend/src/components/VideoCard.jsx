import React from 'react';
import { Bookmark, Play, Plus, ListPlus, Eye } from 'lucide-react';
import { localStore } from '../services/localHistory';

function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function VideoCard({
  video,
  isSaved,
  onToggleSave,
  onPlayVideo,
  onSelectCreator,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const progress = localStore.getProgress(video.id);

  // Normalize thumbnail path
  const thumbUrl = video.thumbnail_path && video.thumbnail_path.startsWith('uploads')
    ? `/${video.thumbnail_path}`
    : video.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';

  const creatorInitial = (video.creator_name || 'C').charAt(0).toUpperCase();

  return (
    <div
      className="video-card"
      id={`video-card-${video.id}`}
      onClick={() => onPlayVideo(video)}
    >
      {/* Thumbnail Area */}
      <div className="thumbnail-wrapper">
        <img
          src={thumbUrl}
          alt={video.title}
          className="thumbnail-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
          }}
        />

        {/* Play Overlay on Hover */}
        <div className="thumbnail-overlay-play">
          <div className="play-icon-circle">
            <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
          </div>
        </div>

        {/* Source Badge */}
        {video.source === 'youtube' ? (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(255, 0, 0, 0.85)',
              color: '#ffffff',
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              zIndex: 2
            }}
          >
            YouTube
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'rgba(0, 229, 255, 0.2)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              zIndex: 2
            }}
          >
            Local
          </div>
        )}

        {/* Badges */}
        <div className="badge-overlay-quality">{video.resolution || '480p'}</div>
        <div className="badge-overlay-duration">
          {video.duration > 0 ? formatDuration(video.duration) : 'HD'}
        </div>

        {/* Local Watch Progress Bar */}
        {progress && progress.percent > 0 && (
          <div className="card-progress-bar">
            <div className="card-progress-fill" style={{ width: `${Math.min(progress.percent, 100)}%` }} />
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="video-info">
        <h3 className="video-title" title={video.title}>
          {video.title}
        </h3>

        {/* Description Excerpt */}
        {video.description && (
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              marginBottom: '6px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.35
            }}
          >
            {video.description}
          </p>
        )}

        {/* Creator & Actions Row */}
        <div className="video-meta-row">
          <div
            className="creator-link"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectCreator) onSelectCreator(video.creator_name);
            }}
            title={`View channel: ${video.creator_name}`}
          >
            <div className="creator-avatar-sm">{creatorInitial}</div>
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {video.creator_name || 'Creator'}
            </span>
          </div>

          <div className="video-actions-quick">
            {/* Add to Playlist button */}
            {onOpenAddToPlaylist && (
              <button
                className="quick-action-btn"
                title="Add to Playlist"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddToPlaylist(video);
                }}
              >
                <ListPlus size={16} />
              </button>
            )}

            {/* Save to Watch Later */}
            <button
              id={`save-btn-${video.id}`}
              className={`quick-action-btn ${isSaved ? 'active' : ''}`}
              title={isSaved ? "Remove from Saved" : "Save to Watch Later"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(video);
              }}
            >
              <Bookmark size={16} fill={isSaved ? 'var(--accent-amber)' : 'none'} />
            </button>
          </div>
        </div>

        {/* Space Tags */}
        {video.spaces && video.spaces.length > 0 && (
          <div className="video-spaces-tags">
            {video.spaces.map((sp) => (
              <button
                key={sp.id || sp.slug}
                className="space-mini-tag"
                style={{ borderLeft: `3px solid ${sp.color || 'var(--accent-cyan)'}` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectSpace) onSelectSpace(sp);
                }}
                title={`Open Space: ${sp.name}`}
              >
                <span>{sp.icon}</span>
                <span>{sp.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
