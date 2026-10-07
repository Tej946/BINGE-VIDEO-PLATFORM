import React from 'react';
import { Layers, Plus, Check, SlidersHorizontal, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SpacesPage({
  spaces = [],
  mergedSlugs = [],
  onToggleMergedSpace,
  onSelectSpace,
  onOpenCreateSpace
}) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="var(--accent-cyan)" />
            <span>Your Spaces</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px', maxWidth: '640px' }}>
            Spaces are entirely user-created. Create whatever categories or isolated realms you want, and combine them into your own custom composite feed.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={onOpenCreateSpace}
          style={{ padding: '10px 20px' }}
        >
          <Plus size={16} />
          <span>Create New Space</span>
        </button>
      </div>

      {/* Spaces Grid */}
      <div className="spaces-grid" style={{ marginBottom: '40px' }}>
        {/* Create Space Card */}
        <div className="create-space-card" onClick={onOpenCreateSpace}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Plus size={22} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>Create Custom Space</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Define custom icon, color, and rules
          </span>
        </div>

        {/* Space Cards */}
        {spaces.map((sp) => {
          const isMerged = mergedSlugs.includes(sp.slug);
          return (
            <div
              key={sp.id || sp.slug}
              className="space-card"
              style={{ '--space-color': sp.color || 'var(--accent-cyan)' }}
              onClick={() => onSelectSpace(sp)}
            >
              <div className="space-card-top">
                <span className="space-card-icon">{sp.icon || '📁'}</span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    color: sp.color || 'var(--accent-cyan)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {sp.video_count || 0} {sp.video_count === 1 ? 'video' : 'videos'}
                </span>
              </div>

              <h3 className="space-card-title">{sp.name}</h3>

              <p className="space-card-desc">
                {sp.description || `Custom Space curated for ${sp.name} content.`}
              </p>

              <div className="space-card-footer" onClick={(e) => e.stopPropagation()}>
                {/* Merged View Toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: isMerged ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}
                  title="Toggle this space in your composite Merged Feed"
                >
                  <input
                    type="checkbox"
                    checked={isMerged}
                    onChange={() => onToggleMergedSpace(sp.slug)}
                    style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  />
                  <span>Merged Feed</span>
                </label>

                {/* Browse Link */}
                <button
                  onClick={() => onSelectSpace(sp)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Browse</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Merged Feed Summary Box */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 229, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}
          >
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700 }}>
              Composite Merged Feed Active
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              Currently combining <strong>{mergedSlugs.length}</strong> of {spaces.length} spaces into your personal feed.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.82rem' }}>
          <ShieldCheck size={16} />
          <span>User-controlled aggregation • Zero recommendations</span>
        </div>
      </div>
    </div>
  );
}
