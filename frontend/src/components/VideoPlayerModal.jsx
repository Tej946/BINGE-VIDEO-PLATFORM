import React, { useEffect, useRef, useState } from 'react';
import { X, Film, Eye, Bookmark, Check, ShieldCheck, Zap, ExternalLink, ShieldAlert } from 'lucide-react';
import { getVideoStreamUrl, fetchVideoById } from '../services/api';

function normalizeThumbnail(path) {
  if (!path) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
}

export default function VideoPlayerModal({
  video,
  onClose,
  isSaved,
  onToggleSave,
  onSelectSpace
}) {
  const videoRef = useRef(null);
  const [videoDetails, setVideoDetails] = useState(video);
  const [playbackError, setPlaybackError] = useState(null);

  // Sync and increment view counter from backend
  useEffect(() => {
    if (!video?.id) return;
    let isMounted = true;
    fetchVideoById(video.id)
      .then(data => {
        if (isMounted && data) {
          setVideoDetails(data);
        }
      })
      .catch(err => console.warn('Could not fetch updated video details:', err));

    return () => {
      isMounted = false;
    };
  }, [video?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

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

  const [embedBlocked, setEmbedBlocked] = useState(() => currentVideo.is_embeddable === false);
  const [forceEmbed, setForceEmbed] = useState(false);

  useEffect(() => {
    setEmbedBlocked(currentVideo.is_embeddable === false);
    setForceEmbed(false);
  }, [currentVideo.id, currentVideo.is_embeddable]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'onError' && (data.info === 101 || data.info === 150)) {
          setEmbedBlocked(true);
        }
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '880px',
          width: '95%',
          padding: '0',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Film size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
              {currentVideo.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '3px 10px',
              fontSize: '0.74rem',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)'
            }}>
              <Zap size={12} />
              <span>480p • Lean Stream</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close Player (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Real HTML5 Video Player */}
        <div style={{
          background: '#000',
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {playbackError ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ color: '#FF4B72', fontWeight: 600, marginBottom: '6px' }}>Playback Error</p>
              <p style={{ fontSize: '0.86rem' }}>{playbackError}</p>
            </div>
          ) : isExternalVideo && embedBlocked && !forceEmbed ? (
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
              {currentVideo.thumbnail_path && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${normalizeThumbnail(currentVideo.thumbnail_path)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(30px) brightness(0.2)',
                    opacity: 0.5,
                    transform: 'scale(1.1)',
                    pointerEvents: 'none'
                  }}
                />
              )}

              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  maxWidth: '460px',
                  background: 'rgba(18, 22, 32, 0.88)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px 28px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 75, 114, 0.12)',
                    border: '1px solid rgba(255, 75, 114, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    color: 'var(--accent-rose)'
                  }}
                >
                  <ShieldAlert size={22} />
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.18rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}
                >
                  This video can't be played inside BINGE
                </h3>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    marginBottom: '18px'
                  }}
                >
                  The creator has disabled embedded playback.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      borderRadius: 'var(--radius-full)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.88rem'
                    }}
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink size={15} />
                  </a>

                  {currentVideo.is_embeddable !== false && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setForceEmbed(true)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.84rem'
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
              poster={normalizeThumbnail(currentVideo.thumbnail_path)}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={() => {
                setPlaybackError('Unable to stream video from server. Verify the video file exists on disk.');
              }}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                outline: 'none'
              }}
            >
              Your browser does not support HTML5 video playback.
            </video>
          )}
        </div>

        {/* External Video Helper */}
        {isExternalVideo && !embedBlocked && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px 0 20px', background: 'var(--bg-surface)' }}>
            <button
              type="button"
              onClick={() => setEmbedBlocked(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
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

        {/* Video Info Section */}
        <div style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '14px'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px'
              }}>
                {currentVideo.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentVideo.creator_name || 'Creator'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                  <Eye size={13} /> {currentVideo.views_count || 1} views
                </span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {currentVideo.resolution || '480p'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              className="btn-secondary"
              onClick={() => onToggleSave(currentVideo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                padding: '8px 14px'
              }}
            >
              <Bookmark size={15} fill={isSaved ? 'var(--accent-amber)' : 'none'} color={isSaved ? 'var(--accent-amber)' : 'currentColor'} />
              <span>{isSaved ? 'Saved in Library' : 'Save to Library'}</span>
            </button>
          </div>

          {/* Description */}
          {currentVideo.description && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              marginBottom: '16px',
              whiteSpace: 'pre-line'
            }}>
              {currentVideo.description}
            </p>
          )}

          {/* Spaces Tags & Privacy Guarantee */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Spaces:</span>
              {currentVideo.spaces && currentVideo.spaces.length > 0 ? (
                currentVideo.spaces.map(sp => (
                  <button
                    key={sp.id || sp.slug}
                    className="space-mini-tag"
                    onClick={() => {
                      if (onSelectSpace) onSelectSpace(sp);
                      onClose();
                    }}
                    style={{
                      borderLeft: `3px solid ${sp.color || '#00E5FF'}`,
                      background: 'var(--bg-input)',
                      cursor: 'pointer',
                      borderTop: 'none',
                      borderRight: 'none',
                      borderBottom: 'none'
                    }}
                    title={`View all videos in ${sp.name}`}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.name}</span>
                  </button>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Unassigned Space
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              color: 'var(--accent-emerald)'
            }}>
              <ShieldCheck size={14} />
              <span>Direct HTTP 206 Streaming • Zero Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
