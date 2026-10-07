import React, { useState, useMemo } from 'react';
import { Compass, Sparkles, Flame, Clock, Tag } from 'lucide-react';
import VideoCard from './VideoCard';

export default function ExplorePage({
  videos = [],
  savedVideos = [],
  spaces = [],
  onPlayVideo,
  onToggleSave,
  onSelectCreator,
  onSelectSpace,
  onOpenAddToPlaylist
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'trending' | 'newest' | 'long' | 'short' | tag

  // Extract all unique tags dynamically from videos
  const availableTags = useMemo(() => {
    const set = new Set();
    videos.forEach((v) => {
      if (v.tags) {
        v.tags.split(',').forEach((t) => {
          const clean = t.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return Array.from(set);
  }, [videos]);

  // Compute filtered videos based on transparent criteria
  const filteredVideos = useMemo(() => {
    let list = [...videos];

    if (activeFilter === 'trending') {
      list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (activeFilter === 'newest') {
      list.sort((a, b) => b.id - a.id);
    } else if (activeFilter === 'long') {
      list = list.filter((v) => (v.duration || 0) >= 900); // 15 mins or longer
    } else if (activeFilter === 'short') {
      list = list.filter((v) => (v.duration || 0) < 600); // under 10 mins
    } else if (activeFilter !== 'all') {
      // Filter by custom tag
      list = list.filter(
        (v) => v.tags && v.tags.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    return list;
  }, [videos, activeFilter]);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Compass size={28} color="var(--accent-cyan)" />
          <span>Explore Library</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
          Discover videos across creators and user-curated spaces without tracking or algorithmic manipulation.
        </p>
      </div>

      {/* Filter Chips Bar */}
      <div className="filter-chips-bar">
        <button
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Content
        </button>

        <button
          className={`filter-chip ${activeFilter === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('trending')}
        >
          🔥 Most Viewed
        </button>

        <button
          className={`filter-chip ${activeFilter === 'newest' ? 'active' : ''}`}
          onClick={() => setActiveFilter('newest')}
        >
          ✨ Newest Uploads
        </button>

        <button
          className={`filter-chip ${activeFilter === 'long' ? 'active' : ''}`}
          onClick={() => setActiveFilter('long')}
        >
          ⏳ Deep Dives (&gt;15 min)
        </button>

        <button
          className={`filter-chip ${activeFilter === 'short' ? 'active' : ''}`}
          onClick={() => setActiveFilter('short')}
        >
          ⚡ Quick Bites (&lt;10 min)
        </button>

        {/* Dynamic Tag Chips */}
        {availableTags.slice(0, 8).map((tag) => (
          <button
            key={tag}
            className={`filter-chip ${activeFilter === tag ? 'active' : ''}`}
            onClick={() => setActiveFilter(tag)}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matching videos</h3>
          <p style={{ marginTop: '6px' }}>Try switching back to "All Content" or select another tag.</p>
        </div>
      ) : (
        <div className="video-grid">
          {filteredVideos.map((video) => (
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
