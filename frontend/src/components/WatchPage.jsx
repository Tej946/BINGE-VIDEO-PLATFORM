import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  Bookmark,
  Heart,
  ListPlus,
  Share2,
  ShieldCheck,
  Zap,
  Check,
  Play,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { getVideoStreamUrl, fetchVideoById, getDeterministicRelatedVideos } from '../services/api';
import { localStore } from '../services/localHistory';

function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function WatchPage({
  video,
  allVideos = [],
  onBack,
  isSaved,
  onToggleSave,
  onPlayVideo,
  onSelectCreator,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const videoRef = useRef(null);
  const [videoDetails, setVideoDetails] = useState(video);
  const [playbackError, setPlaybackError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(() =>
    localStore.isSubscribed(video.creator_name)
  );
  const [isLiked, setIsLiked] = useState(() => localStore.isLiked(video.id));
  const [copyFeedback, setCopyFeedback] = useState(false);

  const currentVideo = videoDetails || video;
  const isExternalVideo = currentVideo.playback_type === 'embed' ||
    currentVideo.source === 'youtube' ||
    currentVideo.source === 'external' ||
    String(currentVideo.id).startsWith('ext_') ||
    Boolean(currentVideo.embed_url);

  const cleanExternalId = currentVideo.external_id || String(currentVideo.id).replace('ext_', '');
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${cleanExternalId}`;

  const embedUrl = cleanExternalId
    ? `https://www.youtube.com/embed/${cleanExternalId}?autoplay=1&rel=0&modestbranding=1`
    : (currentVideo.embed_url ? currentVideo.embed_url.replace('youtube-nocookie.com', 'youtube.com') : null);

  const streamUrl = isExternalVideo ? null : getVideoStreamUrl(currentVideo.id);

  // Embeddability state: initial check from backend + runtime detection
  const [embedBlocked, setEmbedBlocked] = useState(() => currentVideo.is_embeddable === false);
  const [forceEmbed, setForceEmbed] = useState(false);

  // Reset embedBlocked whenever video changes
  useEffect(() => {
    setEmbedBlocked(currentVideo.is_embeddable === false);
    setForceEmbed(false);
  }, [currentVideo.id, currentVideo.is_embeddable]);

  // Listen to YouTube IFrame postMessage events for runtime embedding errors (Error 101/150)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'onError' && (data.info === 101 || data.info === 150)) {
          setEmbedBlocked(true);
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync latest views count from backend
  useEffect(() => {
    if (!video?.id) return;
    let isMounted = true;
    fetchVideoById(video.id)
      .then((data) => {
        if (isMounted && data) {
          setVideoDetails(data);
          if (data.is_embeddable === false) {
            setEmbedBlocked(true);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch updated video stats:', err));

    return () => {
      isMounted = false;
    };
  }, [video?.id]);

  // Track progress locally while playing
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      localStore.setProgress(currentVideo.id, currentTime, duration);
    }
  };

  // Restore playback position if previously started
  useEffect(() => {
    const savedProgress = localStore.getProgress(currentVideo.id);
    if (savedProgress && videoRef.current && savedProgress.currentTime > 0) {
      // If watched less than 95%, resume
      if (savedProgress.percent < 95) {
        videoRef.current.currentTime = savedProgress.currentTime;
      }
    }
  }, [currentVideo.id]);

  // Toggle Subscribe
  const handleToggleSub = () => {
    const res = localStore.toggleSubscription(currentVideo.creator_name);
    setIsSubscribed(res.isSubscribed);
  };

  // Toggle Like
  const handleToggleLike = () => {
    const res = localStore.toggleLike(currentVideo.id);
    setIsLiked(res.isLiked);
  };

  // Handle Share
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Deterministic related videos
  const relatedVideos = getDeterministicRelatedVideos(currentVideo, allVideos, 6);

  const creatorInitial = (currentVideo.creator_name || 'C').charAt(0).toUpperCase();

  const thumbUrl = currentVideo.thumbnail_path && currentVideo.thumbnail_path.startsWith('uploads')
    ? `/${currentVideo.thumbnail_path}`
    : currentVideo.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';

  return (
    <div className="watch-page-layout">
      {/* Main Video & Details Column */}
      <div className="watch-main-column">
        {/* Back Button */}
        <div>
          <button
            className="btn-secondary"
            onClick={onBack}
            style={{ padding: '8px 14px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Browse</span>
          </button>
        </div>

        {/* Video Player Container */}
        <div className="cinema-player-container">
          {playbackError ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <p style={{ color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '6px' }}>Playback Error</p>
              <p style={{ fontSize: '0.86rem' }}>{playbackError}</p>
            </div>
          ) : isExternalVideo && embedBlocked && !forceEmbed ? (
            /* Clean BINGE-native fallback message when embedding is disabled */
            <div
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: '16 / 9',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, rgba(16, 20, 28, 0.97), rgba(9, 11, 16, 0.99))'
              }}
            >
              {/* Blurred poster background */}
              {thumbUrl && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${thumbUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(30px) brightness(0.2)',
                    opacity: 0.5,
                    transform: 'scale(1.1)',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Native Message Card */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  maxWidth: '480px',
                  background: 'rgba(18, 22, 32, 0.88)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 30px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 75, 114, 0.12)',
                    border: '1px solid rgba(255, 75, 114, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'var(--accent-rose)'
                  }}
                >
                  <ShieldAlert size={24} />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  This video can't be played inside BINGE
                </h2>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                    marginBottom: '20px'
                  }}
                >
                  The creator has disabled embedded playback.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink size={16} />
                  </a>

                  {currentVideo.is_embeddable !== false && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setForceEmbed(true)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.86rem'
                      }}
                    >
                      Try Embedding Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : isExternalVideo && embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentVideo.title}
              className="cinema-video-element"
              style={{
                border: 'none',
                width: '100%',
                height: '100%',
                aspectRatio: '16 / 9',
                display: 'block'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
            />
          ) : (
            <video
              ref={videoRef}
              src={streamUrl}
              poster={thumbUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onError={() => {
                setPlaybackError('Unable to stream video from server. Verify the video file exists on disk.');
              }}
              className="cinema-video-element"
            >
              Your browser does not support HTML5 video playback.
            </video>
          )}
        </div>

        {/* External Video Helper */}
        {isExternalVideo && !embedBlocked && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', marginBottom: '4px' }}>
            <button
              type="button"
              onClick={() => setEmbedBlocked(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="If YouTube player shows 'Watch on YouTube', switch to BINGE fallback"
            >
              <span>Player blocked by creator?</span>
              <span style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Switch to YouTube fallback</span>
            </button>
          </div>
        )}

        {/* Video Title */}
        <h1 className="watch-video-title">{currentVideo.title}</h1>

        {/* Meta Bar: Creator & Actions */}
        <div className="watch-meta-bar">
          {/* Creator Profile */}
          <div className="creator-profile-bar">
            <div
              className="creator-avatar-lg"
              onClick={() => onSelectCreator(currentVideo.creator_name)}
              title={`View ${currentVideo.creator_name}'s channel`}
            >
              {creatorInitial}
            </div>
            <div className="creator-info-text">
              <span
                className="creator-name-lg"
                onClick={() => onSelectCreator(currentVideo.creator_name)}
              >
                {currentVideo.creator_name || 'Creator'}
              </span>
              <span className="creator-sub-count">
                {isSubscribed ? 'Subscribed channel' : 'Creator channel'}
              </span>
            </div>

            <button
              className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={handleToggleSub}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="watch-action-buttons">
            {/* Like */}
            <button
              className={`action-pill-btn ${isLiked ? 'active' : ''}`}
              onClick={handleToggleLike}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={isLiked ? 'var(--accent-amber)' : 'none'} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Save to Watch Later */}
            <button
              className={`action-pill-btn ${isSaved ? 'active' : ''}`}
              onClick={() => onToggleSave(currentVideo)}
              title={isSaved ? 'Saved in Library' : 'Save Video'}
            >
              <Bookmark size={16} fill={isSaved ? 'var(--accent-amber)' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Add to Playlist */}
            {onOpenAddToPlaylist && (
              <button
                className="action-pill-btn"
                onClick={() => onOpenAddToPlaylist(currentVideo)}
                title="Add to Playlist"
              >
                <ListPlus size={16} />
                <span>Playlist</span>
              </button>
            )}

            {/* Share */}
            <button className="action-pill-btn" onClick={handleShare} title="Share link">
              {copyFeedback ? <Check size={16} color="var(--accent-emerald)" /> : <Share2 size={16} />}
              <span>{copyFeedback ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="watch-description-box">
          <div className="watch-stats-row">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Eye size={15} /> {currentVideo.views_count || 1} views
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {currentVideo.resolution || '480p'} Stream
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-emerald)', fontSize: '0.82rem' }}>
              <ShieldCheck size={14} /> Zero Tracking
            </span>
          </div>

          {currentVideo.description && (
            <p className="watch-description-text">{currentVideo.description}</p>
          )}

          {/* Spaces Tags */}
          {currentVideo.spaces && currentVideo.spaces.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {currentVideo.spaces.map((sp) => (
                <button
                  key={sp.id || sp.slug}
                  className="space-mini-tag"
                  style={{ borderLeft: `3px solid ${sp.color || 'var(--accent-cyan)'}` }}
                  onClick={() => onSelectSpace(sp)}
                  title={`Browse Space: ${sp.name}`}
                >
                  <span>{sp.icon}</span>
                  <span>{sp.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Column: Deterministic Related Videos */}
      <div className="watch-sidebar-column">
        <div className="related-header">
          <span>Related Discovery</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NON-ALGORITHMIC
          </span>
        </div>

        {relatedVideos.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No related videos found in current spaces or creators.
          </div>
        ) : (
          relatedVideos.map((item) => {
            const relThumb = item.thumbnail_path && item.thumbnail_path.startsWith('uploads')
              ? `/${item.thumbnail_path}`
              : item.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';

            return (
              <div
                key={item.id}
                className="related-video-row"
                onClick={() => onPlayVideo(item)}
              >
                <div className="related-thumb-wrapper">
                  <img
                    src={relThumb}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div className="badge-overlay-duration" style={{ fontSize: '0.66rem', bottom: '4px', right: '4px' }}>
                    {formatDuration(item.duration)}
                  </div>
                </div>

                <div className="related-info">
                  <span className="related-title" title={item.title}>
                    {item.title}
                  </span>
                  <span className="related-creator">{item.creator_name}</span>
                  <span className="related-meta">{item.views_count || 0} views</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
