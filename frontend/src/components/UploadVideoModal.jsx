import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Plus, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadVideo, createSpace } from '../services/api';

const PRESET_COLORS = [
  '#00E5FF', '#FF4B72', '#06D6A0', '#FFB703',
  '#9D4EDD', '#4361EE', '#EF476F', '#118AB2'
];

export default function UploadVideoModal({ isOpen, onClose, spaces = [], onVideoUploaded, onSpaceCreated }) {
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [creatorName, setCreatorName] = useState('Creator');
  const [description, setDescription] = useState('');
  const [selectedSpaceIds, setSelectedSpaceIds] = useState([]);
  const [tags, setTags] = useState('');

  // Inline Quick Space Creation State
  const [showNewSpaceForm, setShowNewSpaceForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceIcon, setNewSpaceIcon] = useState('📁');
  const [newSpaceColor, setNewSpaceColor] = useState('#00E5FF');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Upload progress / states
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  if (!isOpen) return null;

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.mp4', '.mkv', '.webm', '.mov', '.avi'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMessage(`Unsupported video format (${ext}). Supported formats: MP4, WebM, MKV, MOV.`);
      return;
    }

    setVideoFile(file);
    setErrorMessage('');
    if (!title) {
      // Auto-fill title from clean filename
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(cleanName.replace(/[_-]/g, ' '));
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleSpaceSelection = (spaceId) => {
    setSelectedSpaceIds(prev =>
      prev.includes(spaceId)
        ? prev.filter(id => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleQuickCreateSpace = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    setIsCreatingSpace(true);
    try {
      const slug = newSpaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const created = await createSpace({
        name: newSpaceName.trim(),
        slug: slug || `space-${Date.now()}`,
        icon: newSpaceIcon || '📁',
        color: newSpaceColor || '#00E5FF',
        description: `User-created space for ${newSpaceName.trim()}`
      });

      if (onSpaceCreated) {
        onSpaceCreated(created);
      }
      setSelectedSpaceIds(prev => [...prev, created.id]);
      setNewSpaceName('');
      setShowNewSpaceForm(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create new space');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setErrorMessage('Please select a video file to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a video title.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('creator_name', creatorName.trim() || 'Creator');
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (selectedSpaceIds.length > 0) {
        formData.append('space_ids', selectedSpaceIds.join(','));
      }
      if (tags.trim()) {
        formData.append('tags', tags.trim());
      }
      formData.append('video_file', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail_file', thumbnailFile);
      }

      const uploaded = await uploadVideo(formData);
      if (onVideoUploaded) {
        onVideoUploaded(uploaded);
      }
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload video to backend.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Upload size={20} />
            </div>
            <div>
              <h2 className="modal-title">Upload Video</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Publish to your chosen Spaces with 480p streaming
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FF4B72',
            fontSize: '0.86rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Video File Dropzone */}
          <div className="form-group">
            <label className="form-label">Video File (MP4, WebM, MKV, MOV) *</label>
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept=".mp4,.mkv,.webm,.mov,.avi"
              style={{ display: 'none' }}
            />
            <div
              onClick={() => videoInputRef.current?.click()}
              style={{
                border: videoFile ? '1px solid var(--accent-cyan)' : '2px dashed var(--border-subtle)',
                background: videoFile ? 'rgba(0, 229, 255, 0.04)' : 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {videoFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <Film size={28} color="var(--accent-cyan)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      {videoFile.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Film size={32} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    Click to select or drag video file
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Standard 480p delivery • Max 500MB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Creator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Video Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Speedrun Analysis Part 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Creator / Channel Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Creator"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="What is this video about? Add notes or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Thumbnail & Tags Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Custom Poster / Thumbnail (Optional)</label>
              <input
                type="file"
                ref={thumbInputRef}
                onChange={handleThumbnailSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div
                onClick={() => thumbInputRef.current?.click()}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    style={{ width: '40px', height: '24px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                ) : (
                  <ImageIcon size={18} color="var(--text-muted)" />
                )}
                <span style={{ fontSize: '0.82rem', color: thumbnailFile ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {thumbnailFile ? thumbnailFile.name : 'Select image file...'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="retro, tutorial, guide"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Spaces Selection (User-Curated Spaces) */}
          <div className="form-group" style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Assign to Spaces
              </label>
              <button
                type="button"
                onClick={() => setShowNewSpaceForm(!showNewSpaceForm)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} /> {showNewSpaceForm ? 'Cancel New Space' : '+ Create New Space'}
              </button>
            </div>

            {/* Quick Space Creation Sub-Form */}
            {showNewSpaceForm && (
              <div style={{
                background: 'var(--bg-app)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newSpaceIcon}
                    onChange={(e) => setNewSpaceIcon(e.target.value)}
                    title="Emoji icon"
                    style={{
                      width: '44px',
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFF'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Space Name (e.g. Physics Lab, Guitar)"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleQuickCreateSpace}
                    disabled={isCreatingSpace || !newSpaceName.trim()}
                    className="btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                  >
                    {isCreatingSpace ? <RefreshCw size={14} className="spin" /> : 'Add'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Color:</span>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSpaceColor(c)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: newSpaceColor === c ? '2px solid #FFF' : '1px solid transparent',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* List of Spaces to check/uncheck */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              maxHeight: '130px',
              overflowY: 'auto',
              padding: '6px 2px'
            }}>
              {spaces.map(sp => {
                const isSelected = selectedSpaceIds.includes(sp.id);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => toggleSpaceSelection(sp.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-input)',
                      border: isSelected ? `1.5px solid ${sp.color || 'var(--accent-cyan)'}` : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.name}</span>
                    {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Videos appear exclusively inside assigned spaces and custom merged feeds.
            </p>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUploading || !videoFile || !title.trim()}
              style={{ minWidth: '140px', justifyContent: 'center' }}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Publish Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
