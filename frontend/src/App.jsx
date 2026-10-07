import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import VideoCard from './components/VideoCard';
import WatchPage from './components/WatchPage';
import CreatorPage from './components/CreatorPage';
import ExplorePage from './components/ExplorePage';
import SearchPage from './components/SearchPage';
import SpacesPage from './components/SpacesPage';
import PlaylistsPage from './components/PlaylistsPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import AIAssistantView from './components/AIAssistantView';
import SettingsPage from './components/SettingsPage';
import CreateSpaceModal from './components/CreateSpaceModal';
import PrivacyModal from './components/PrivacyModal';
import UploadVideoModal from './components/UploadVideoModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import { fetchHealth, fetchSpaces, fetchVideos, createSpace } from './services/api';
import { localStore } from './services/localHistory';
import {
  Play,
  Bookmark,
  Layers,
  Sparkles,
  Clock,
  Compass,
  Plus,
  RefreshCw,
  Film,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function App() {
  const [spaces, setSpaces] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [activeView, setActiveView] = useState('home'); 
  // 'home' | 'explore' | 'search' | 'spaces' | 'saved' | 'playlists' | 'subscriptions' | 'ai-assistant' | 'settings' | 'watch' | 'creator' | 'space'

  const [mergedSlugs, setMergedSlugs] = useState(() => localStore.getMergedSpaces());
  const [savedVideos, setSavedVideos] = useState(() => localStore.getSavedVideos());
  const [localHistory, setLocalHistory] = useState(() => localStore.getHistory());
  const [playlists, setPlaylists] = useState(() => localStore.getPlaylists());
  const [subscriptions, setSubscriptions] = useState(() => localStore.getSubscriptions());

  const [searchQuery, setSearchQuery] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active playing video for Watch page
  const [playingVideo, setPlayingVideo] = useState(null);
  const [previousView, setPreviousView] = useState('home');

  // Modals
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [playlistModalVideo, setPlaylistModalVideo] = useState(null);

  // Initialize data from API
  const loadData = async () => {
    setLoading(true);
    try {
      const health = await fetchHealth();
      setBackendConnected(health.status === 'healthy');

      const spacesData = await fetchSpaces();
      setSpaces(spacesData);

      const videosData = await fetchVideos();
      setVideos(videosData);
    } catch (err) {
      console.error("Error loading BINGE catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync merged spaces with localStorage
  const handleToggleMergedSpace = (slug) => {
    const updated = mergedSlugs.includes(slug)
      ? mergedSlugs.filter((s) => s !== slug)
      : [...mergedSlugs, slug];
    setMergedSlugs(updated);
    localStore.setMergedSpaces(updated);
  };

  // Saved Videos toggle
  const handleToggleSave = (video) => {
    const { savedList } = localStore.toggleSaveVideo(video);
    setSavedVideos(savedList);
  };

  // Watch video (record local history & switch to WatchPage)
  const handlePlayVideo = (video) => {
    setPlayingVideo(video);
    const updatedHistory = localStore.addToHistory(video);
    setLocalHistory(updatedHistory);
    if (activeView !== 'watch') {
      setPreviousView(activeView);
    }
    setActiveView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select creator channel
  const handleSelectCreator = (creatorName) => {
    setSelectedCreator(creatorName);
    setActiveView('creator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select a space
  const handleSelectSpace = (space) => {
    setSelectedSpace(space);
    setActiveView('space');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear history
  const handleClearHistory = () => {
    const cleared = localStore.clearHistory();
    setLocalHistory(cleared);
  };

  // Create Space Handler
  const handleCreateSpace = async (spaceData) => {
    const newSpace = await createSpace(spaceData);
    setSpaces((prev) => [...prev, newSpace]);
    setSelectedSpace(newSpace);
    setActiveView('space');
  };

  // Video Upload Handlers
  const handleVideoUploaded = async (newVideo) => {
    setVideos((prev) => [newVideo, ...prev]);
    try {
      const refreshed = await fetchSpaces();
      setSpaces(refreshed);
    } catch (e) {
      console.warn("Failed to refresh spaces:", e);
    }
  };

  const handleSpaceCreatedInline = (newSpace) => {
    setSpaces((prev) => [...prev, newSpace]);
  };

  // Topbar search submit
  const handleSearchSubmit = (q) => {
    setSearchQuery(q);
    setActiveView('search');
  };

  // Hero spotlight video (e.g. first video or highest viewed)
  const heroVideo = useMemo(() => {
    if (!videos || videos.length === 0) return null;
    return videos[0];
  }, [videos]);

  // Space-specific video list if activeView === 'space'
  const spaceVideos = useMemo(() => {
    if (!selectedSpace) return [];
    return videos.filter(
      (v) => v.spaces && v.spaces.some((s) => s.slug === selectedSpace.slug)
    );
  }, [videos, selectedSpace]);

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        spaces={spaces}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedSpace={selectedSpace}
        setSelectedSpace={setSelectedSpace}
        onOpenCreateSpace={() => setIsCreateSpaceOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        backendConnected={backendConnected}
        savedCount={savedVideos.length}
        playlistCount={playlists.length}
        subCount={subscriptions.length}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onOpenCreateSpace={() => setIsCreateSpaceOpen(true)}
          onOpenUploadVideo={() => setIsUploadOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAIAssistant={() => setActiveView('ai-assistant')}
        />

        {/* Dynamic Page Content */}
        <main className="page-content">
          {loading ? (
            <div className="empty-state">
              <RefreshCw size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', fontWeight: 500 }}>Loading BINGE library...</p>
            </div>
          ) : activeView === 'watch' && playingVideo ? (
            /* Dedicated Video Watch Page */
            <WatchPage
              video={playingVideo}
              allVideos={videos}
              onBack={() => {
                setActiveView(previousView || 'home');
                setPlayingVideo(null);
              }}
              isSaved={savedVideos.some((v) => v.id === playingVideo.id)}
              onToggleSave={handleToggleSave}
              onPlayVideo={handlePlayVideo}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
              onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
            />
          ) : activeView === 'creator' && selectedCreator ? (
            /* Dedicated Creator / Channel Page */
            <CreatorPage
              creatorName={selectedCreator}
              videos={videos}
              savedVideos={savedVideos}
              onBack={() => setActiveView('home')}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectSpace={handleSelectSpace}
              onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
            />
          ) : activeView === 'explore' ? (
            /* Dedicated Explore Page */
            <ExplorePage
              videos={videos}
              savedVideos={savedVideos}
              spaces={spaces}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
              onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
            />
          ) : activeView === 'search' ? (
            /* Dedicated Search Page */
            <SearchPage
              initialQuery={searchQuery}
              videos={videos}
              spaces={spaces}
              savedVideos={savedVideos}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
              onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
            />
          ) : activeView === 'spaces' ? (
            /* Dedicated Spaces Hub */
            <SpacesPage
              spaces={spaces}
              mergedSlugs={mergedSlugs}
              onToggleMergedSpace={handleToggleMergedSpace}
              onSelectSpace={handleSelectSpace}
              onOpenCreateSpace={() => setIsCreateSpaceOpen(true)}
            />
          ) : activeView === 'playlists' ? (
            /* Dedicated Playlists Page */
            <PlaylistsPage
              playlists={playlists}
              savedVideos={savedVideos}
              onUpdatePlaylists={(updated) => setPlaylists(updated)}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
            />
          ) : activeView === 'subscriptions' ? (
            /* Dedicated Subscriptions Page */
            <SubscriptionsPage
              subscriptions={subscriptions}
              videos={videos}
              savedVideos={savedVideos}
              onUpdateSubscriptions={(updated) => setSubscriptions(updated)}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
              onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
            />
          ) : activeView === 'ai-assistant' ? (
            /* Dedicated AI Assistant View */
            <AIAssistantView
              videos={videos}
              spaces={spaces}
              savedVideos={savedVideos}
              onPlayVideo={handlePlayVideo}
              onToggleSave={handleToggleSave}
              onSelectCreator={handleSelectCreator}
              onSelectSpace={handleSelectSpace}
            />
          ) : activeView === 'settings' ? (
            /* Dedicated Settings Page */
            <SettingsPage
              onClearHistory={handleClearHistory}
              historyCount={localHistory.length}
            />
          ) : activeView === 'saved' ? (
            /* Saved Videos Library View */
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bookmark size={28} color="var(--accent-amber)" />
                  <span>Saved Library ({savedVideos.length})</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
                  Videos saved to watch later. Stored locally without cloud profiling.
                </p>
              </div>

              {savedVideos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔖</div>
                  <h3>Your library is empty</h3>
                  <p style={{ marginTop: '6px' }}>Bookmark any video to save it for quick access here.</p>
                </div>
              ) : (
                <div className="video-grid">
                  {savedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isSaved={true}
                      onToggleSave={handleToggleSave}
                      onPlayVideo={handlePlayVideo}
                      onSelectCreator={handleSelectCreator}
                      onSelectSpace={handleSelectSpace}
                      onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : activeView === 'space' && selectedSpace ? (
            /* Single Space Content View */
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 32px',
                  marginBottom: '32px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '6px',
                  height: '100%',
                  background: selectedSpace.color || 'var(--accent-cyan)'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2.2rem' }}>{selectedSpace.icon}</span>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: selectedSpace.color || 'var(--text-primary)' }}>
                      {selectedSpace.name}
                    </h1>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Isolated space containing strictly {selectedSpace.name} content
                    </span>
                  </div>
                </div>

                {selectedSpace.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginTop: '10px', maxWidth: '680px' }}>
                    {selectedSpace.description}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
                  Videos in this Space ({spaceVideos.length})
                </h2>
              </div>

              {spaceVideos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No videos in {selectedSpace.name} yet</h3>
                  <p style={{ marginTop: '6px' }}>Upload a video and assign it to this space to start curating.</p>
                </div>
              ) : (
                <div className="video-grid">
                  {spaceVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isSaved={savedVideos.some((v) => v.id === video.id)}
                      onToggleSave={handleToggleSave}
                      onPlayVideo={handlePlayVideo}
                      onSelectCreator={handleSelectCreator}
                      onSelectSpace={handleSelectSpace}
                      onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ============================================== */
            /* REVAMPED MODERN CINEMATIC HOME STREAMING VIEW   */
            /* ============================================== */
            <div>
              {/* 1. Hero Spotlight Billboard */}
              {heroVideo && (
                <div className="hero-spotlight">
                  <img
                    src={
                      heroVideo.thumbnail_path && heroVideo.thumbnail_path.startsWith('uploads')
                        ? `/${heroVideo.thumbnail_path}`
                        : heroVideo.thumbnail_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'
                    }
                    alt={heroVideo.title}
                    className="hero-backdrop-img"
                  />
                  <div className="hero-gradient-overlay" />

                  <div className="hero-content">
                    <div className="hero-badge-row">
                      <span className="hero-badge-spotlight">
                        <Sparkles size={13} />
                        SPOTLIGHT VIDEO
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {heroVideo.resolution || '480p'} • Ad-Free
                      </span>
                    </div>

                    <h1 className="hero-title">{heroVideo.title}</h1>

                    {heroVideo.description && (
                      <p className="hero-description">{heroVideo.description}</p>
                    )}

                    <div className="hero-actions">
                      <button
                        className="btn-primary"
                        onClick={() => handlePlayVideo(heroVideo)}
                        style={{ padding: '12px 28px', fontSize: '1rem' }}
                      >
                        <Play size={18} fill="currentColor" />
                        <span>Play Video</span>
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => handleToggleSave(heroVideo)}
                        style={{ padding: '12px 20px', fontSize: '1rem' }}
                      >
                        <Bookmark
                          size={18}
                          fill={savedVideos.some((v) => v.id === heroVideo.id) ? 'var(--accent-amber)' : 'none'}
                        />
                        <span>
                          {savedVideos.some((v) => v.id === heroVideo.id) ? 'Saved' : 'Save'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Continue Watching Shelf (From Local Device History) */}
              {localHistory.length > 0 && (
                <section className="shelf-section">
                  <div className="shelf-header">
                    <div className="shelf-title-group">
                      <Clock size={20} color="var(--accent-cyan)" />
                      <h2 className="shelf-title">Continue Watching</h2>
                      <span className="shelf-subtitle">(Stored Strictly on Your Device)</span>
                    </div>

                    <button
                      className="shelf-action-btn"
                      onClick={() => setActiveView('saved')}
                    >
                      <span>View History ({localHistory.length})</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="shelf-scroll-row">
                    {localHistory.slice(0, 6).map((video) => (
                      <VideoCard
                        key={`cont-${video.id}`}
                        video={video}
                        isSaved={savedVideos.some((v) => v.id === video.id)}
                        onToggleSave={handleToggleSave}
                        onPlayVideo={handlePlayVideo}
                        onSelectCreator={handleSelectCreator}
                        onSelectSpace={handleSelectSpace}
                        onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Your Spaces Shelf */}
              <section className="shelf-section">
                <div className="shelf-header">
                  <div className="shelf-title-group">
                    <Layers size={20} color="var(--accent-purple)" />
                    <h2 className="shelf-title">Your Spaces</h2>
                    <span className="shelf-subtitle">User-Created Video Realms</span>
                  </div>

                  <button
                    className="shelf-action-btn"
                    onClick={() => setActiveView('spaces')}
                  >
                    <span>All Spaces ({spaces.length})</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="shelf-scroll-row" style={{ paddingBottom: '16px' }}>
                  {/* Create New Space Quick Card */}
                  <div
                    className="create-space-card"
                    style={{ flex: '0 0 220px', minHeight: '130px' }}
                    onClick={() => setIsCreateSpaceOpen(true)}
                  >
                    <Plus size={24} />
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>New Space</span>
                  </div>

                  {spaces.map((sp) => (
                    <div
                      key={sp.id || sp.slug}
                      className="space-card"
                      style={{ flex: '0 0 250px', '--space-color': sp.color || 'var(--accent-cyan)' }}
                      onClick={() => handleSelectSpace(sp)}
                    >
                      <div className="space-card-top">
                        <span className="space-card-icon">{sp.icon || '📁'}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: sp.color || 'var(--accent-cyan)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          {sp.video_count || 0} videos
                        </span>
                      </div>
                      <h4 className="space-card-title">{sp.name}</h4>
                      <p className="space-card-desc">{sp.description || `Space curated for ${sp.name}`}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Recently Added Shelf */}
              <section className="shelf-section">
                <div className="shelf-header">
                  <div className="shelf-title-group">
                    <Sparkles size={20} color="var(--accent-emerald)" />
                    <h2 className="shelf-title">Recently Added</h2>
                    <span className="shelf-subtitle">Latest Platform Uploads</span>
                  </div>

                  <button
                    className="shelf-action-btn"
                    onClick={() => setActiveView('explore')}
                  >
                    <span>Explore All ({videos.length})</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="video-grid">
                  {videos.slice(0, 6).map((video) => (
                    <VideoCard
                      key={`recent-${video.id}`}
                      video={video}
                      isSaved={savedVideos.some((v) => v.id === video.id)}
                      onToggleSave={handleToggleSave}
                      onPlayVideo={handlePlayVideo}
                      onSelectCreator={handleSelectCreator}
                      onSelectSpace={handleSelectSpace}
                      onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                    />
                  ))}
                </div>
              </section>

              {/* 5. Saved Videos Shelf (if any) */}
              {savedVideos.length > 0 && (
                <section className="shelf-section">
                  <div className="shelf-header">
                    <div className="shelf-title-group">
                      <Bookmark size={20} color="var(--accent-amber)" />
                      <h2 className="shelf-title">Saved Videos</h2>
                      <span className="shelf-subtitle">Watch Later Queue</span>
                    </div>

                    <button
                      className="shelf-action-btn"
                      onClick={() => setActiveView('saved')}
                    >
                      <span>View All ({savedVideos.length})</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  <div className="shelf-scroll-row">
                    {savedVideos.slice(0, 6).map((video) => (
                      <VideoCard
                        key={`saved-${video.id}`}
                        video={video}
                        isSaved={true}
                        onToggleSave={handleToggleSave}
                        onPlayVideo={handlePlayVideo}
                        onSelectCreator={handleSelectCreator}
                        onSelectSpace={handleSelectSpace}
                        onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Explore Videos Shelf */}
              <section className="shelf-section">
                <div className="shelf-header">
                  <div className="shelf-title-group">
                    <Compass size={20} color="var(--accent-cyan)" />
                    <h2 className="shelf-title">Explore Library</h2>
                    <span className="shelf-subtitle">Discover across creators and spaces</span>
                  </div>

                  <button
                    className="shelf-action-btn"
                    onClick={() => setActiveView('explore')}
                  >
                    <span>Browse Discovery Hub</span>
                    <ChevronRight size={15} />
                  </button>
                </div>

                <div className="video-grid">
                  {videos.slice(2, 8).map((video) => (
                    <VideoCard
                      key={`explore-${video.id}`}
                      video={video}
                      isSaved={savedVideos.some((v) => v.id === video.id)}
                      onToggleSave={handleToggleSave}
                      onPlayVideo={handlePlayVideo}
                      onSelectCreator={handleSelectCreator}
                      onSelectSpace={handleSelectSpace}
                      onOpenAddToPlaylist={(v) => setPlaylistModalVideo(v)}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        spaces={spaces}
        onVideoUploaded={handleVideoUploaded}
        onSpaceCreated={handleSpaceCreatedInline}
      />

      <CreateSpaceModal
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
        onCreated={handleCreateSpace}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onClearHistory={handleClearHistory}
        historyCount={localHistory.length}
      />

      {playlistModalVideo && (
        <AddToPlaylistModal
          video={playlistModalVideo}
          playlists={playlists}
          onClose={() => setPlaylistModalVideo(null)}
          onUpdatePlaylists={(updated) => setPlaylists(updated)}
        />
      )}
    </div>
  );
}
