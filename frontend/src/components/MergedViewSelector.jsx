import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

export default function MergedViewSelector({ spaces, selectedSlugs, onToggleSpace, onSelectAll, onClearAll }) {
  return (
    <div className="merged-view-bar">
      <div className="merged-label">
        <SlidersHorizontal size={16} color="var(--accent-cyan)" />
        <span>Merged Feed:</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
        {spaces.map(sp => {
          const isSelected = selectedSlugs.includes(sp.slug);
          return (
            <button
              key={sp.id}
              id={`merged-chip-${sp.slug}`}
              className={`space-toggle-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleSpace(sp.slug)}
            >
              <span>{sp.icon}</span>
              <span>{sp.name}</span>
              {isSelected && <Check size={12} strokeWidth={3} color="var(--accent-cyan)" />}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          onClick={onSelectAll}
        >
          Select All
        </button>
        <button
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          onClick={onClearAll}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
