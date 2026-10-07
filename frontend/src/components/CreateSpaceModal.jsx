import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

const PRESET_ICONS = ['🎌', '👻', '🎬', '🎮', '🎵', '📚', '💻', '🗾', '🔬', '🚀', '🎨', '🍳'];
const PRESET_COLORS = ['#00E5FF', '#FF4B72', '#9D4EDD', '#FFB703', '#06D6A0', '#4361EE', '#FF9100'];

export default function CreateSpaceModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState('#00E5FF');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a space name");
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onCreated({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        icon,
        color,
        description: description.trim()
      });
      setName('');
      setSlug('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create space");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h2 className="modal-title">Create Custom Space</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.84rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Space Name</label>
            <input
              id="space-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. College Notes, Retro Gaming..."
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Slug / URL Identifier</label>
            <input
              id="space-slug-input"
              type="text"
              className="form-input"
              placeholder="e.g. college-notes"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Choose Icon</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {PRESET_ICONS.map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  style={{
                    fontSize: '1.25rem',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: icon === emoji ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: icon === emoji ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-input)',
                    cursor: 'pointer'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {PRESET_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-full)',
                    background: c,
                    cursor: 'pointer',
                    outline: color === c ? '2px solid #FFF' : 'none',
                    outlineOffset: '2px'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              id="space-desc-input"
              className="form-input"
              rows={2}
              placeholder="What belongs in this space?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="submit-create-space-btn"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
