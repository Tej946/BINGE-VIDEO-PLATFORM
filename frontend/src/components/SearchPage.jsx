import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import VideoCard from './VideoCard';
import { searchCatalog } from '../services/api';

export default function SearchPage({
  initialQuery = '',
  spaces = [],
  savedVideos = [],
  onPlayVideo,
  onToggleSave,
  onSelectCreator,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'newest' | 'views' | 'duration'

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [sourcesSearched, setSourcesSearched] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimerRef = useRef(null);

  // Sync with initialQuery when user searches from Topbar
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Execute catalog search
  const performSearch = async (searchTerm, spaceFilter, sortOrder) => {
    setIsLoading(true);
    setError(null);

    const spaceList = spaceFilter !== 'all' ? [spaceFilter] : [];

    try {
      const data = await searchCatalog(searchTerm, {
        spaces: spaceList,
        sortBy: sortOrder,
        limit: 30
      });

      if (data.error && (!data.items || data.items.length === 0)) {
        setError(data.error);
        setResults([]);
        setTotal(0);
      } else {
        setResults(data.items || []);
        setTotal(data.total || (data.items ? data.items.length : 0));
        setSourcesSearched(data.sources_searched || []);
        setCatalogStatus(data.catalog_status || 'active');
      }
    } catch (err) {
      console.error('Catalog search failure:', err);
      setError('Unable to reach catalog search service. Please check your connection.');
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search on query/filter/sort changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Small debounce to avoid hammering API on fast keystrokes
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query, selectedSpaceFilter, sortBy);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedSpaceFilter, sortBy]);

  const handleClear = () => {
    setQuery('');
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(query, selectedSpaceFilter, sortBy);
  };

  return (
    <div>
      {/* Search Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Search size={28} color="var(--accent-cyan)" />
          <span>Unified Catalog Search</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
          Query titles, creators, and topics across BINGE local storage and privacy-shielded YouTube catalog.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <form
        onSubmit={handleManualSearch}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Input Box */}
        <div
          className="search-box-container"
          style={{ maxWidth: '580px', flex: 1, padding: '4px 16px' }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            id="catalog-search-input"
            type="text"
            className="search-input"
            placeholder="Search keywords, creators, or topics (e.g. BTS, Python, Gaming, Anime)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Space Filter Selector */}
        <select
          value={selectedSpaceFilter}
          onChange={(e) => setSelectedSpaceFilter(e.target.value)}
          className="form-input"
          style={{ width: 'auto', padding: '9px 14px', borderRadius: 'var(--radius-full)' }}
        >
          <option value="all">All Spaces</option>
          {spaces.map((sp) => (
            <option key={sp.id || sp.slug} value={sp.slug}>
              {sp.icon} {sp.name}
            </option>
          ))}
        </select>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-input"
          style={{ width: 'auto', padding: '9px 14px', borderRadius: 'var(--radius-full)' }}
        >
          <option value="relevance">Sort: Most Relevant</option>
          <option value="newest">Sort: Newest Uploads</option>
          <option value="views">Sort: Most Viewed</option>
          <option value="duration">Sort: Longest Duration</option>
        </select>
      </form>

      {/* Results Header: Count & Sources */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px',
          color: 'var(--text-muted)',
          fontSize: '0.88rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>
            Found <strong>{total}</strong> {total === 1 ? 'video' : 'videos'}
            {query.trim() && <span> for &ldquo;{query.trim()}&rdquo;</span>}
          </span>

          {sourcesSearched.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sources:</span>
              {sourcesSearched.includes('local') && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(0, 229, 255, 0.12)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    fontWeight: 600
                  }}
                >
                  Local DB
                </span>
              )}
              {sourcesSearched.includes('youtube') && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 0, 0, 0.15)',
                    color: '#FF5C5C',
                    border: '1px solid rgba(255, 0, 0, 0.35)',
                    fontWeight: 600
                  }}
                >
                  YouTube
                </span>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>
            <Loader2 size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Searching catalog...</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && !isLoading && (
        <div
          style={{
            background: 'rgba(255, 75, 114, 0.1)',
            border: '1px solid rgba(255, 75, 114, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="#FF4B72" />
            <span style={{ fontSize: '0.88rem' }}>{error}</span>
          </div>
          <button
            onClick={() => performSearch(query, selectedSpaceFilter, sortBy)}
            className="btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && results.length === 0 ? (
        <div className="video-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={`search-skeleton-${i}`}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                aspectRatio: '16 / 11',
                opacity: 0.6,
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '62%',
                  background: 'rgba(255, 255, 255, 0.04)'
                }}
              />
              <div style={{ padding: '12px' }}>
                <div
                  style={{
                    height: '14px',
                    width: '80%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}
                />
                <div
                  style={{
                    height: '11px',
                    width: '45%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 && !isLoading ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h3>No videos found</h3>
          <p style={{ marginTop: '6px' }}>
            {query.trim()
              ? `No catalog results matched "${query.trim()}". Try searching for topics like "BTS", "Python", "Gaming", or "Anime".`
              : 'Search for keywords, creators, or topics across BINGE local catalog and YouTube proxy.'}
          </p>
        </div>
      ) : (
        /* Real Video Grid */
        <div className="video-grid">
          {results.map((video) => (
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
    </div>
  );
}
