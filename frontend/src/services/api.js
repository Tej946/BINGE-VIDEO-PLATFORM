const API_BASE = '/api/v1';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend not reached, running in standalone mode:", err);
    return {
      status: "offline",
      platform: "BINGE",
      version: "0.1.0",
      default_quality: "480p",
      privacy_mode: "Strict (Zero-Tracking)"
    };
  }
}

export async function fetchSpaces() {
  try {
    const res = await fetch(`${API_BASE}/spaces`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using fallback spaces:", err);
    // Generic user spaces fallback (no hard-coded categories)
    return [
      { id: 1, slug: "cinema-essays", name: "Cinema & Visuals", icon: "🎬", color: "#00E5FF", description: "Cinematography, visual analysis, and video essays.", video_count: 2 },
      { id: 2, slug: "deep-dives", name: "Deep Dives", icon: "📚", color: "#8B5CF6", description: "In-depth explorations and educational breakdowns.", video_count: 3 },
      { id: 3, slug: "dev-craft", name: "Engineering & Craft", icon: "💻", color: "#10B981", description: "Code architecture, minimal software, and design.", video_count: 2 },
      { id: 4, slug: "night-chill", name: "Night Chill", icon: "🌙", color: "#F59E0B", description: "Calm sessions, reviews, and thoughtful retrospectives.", video_count: 1 }
    ];
  }
}

export async function createSpace(spaceData) {
  const res = await fetch(`${API_BASE}/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spaceData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create space' }));
    throw new Error(err.detail || "Failed to create space");
  }
  return await res.json();
}

export async function updateSpace(spaceIdOrSlug, updateData) {
  const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(spaceIdOrSlug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update space' }));
    throw new Error(err.detail || "Failed to update space");
  }
  return await res.json();
}

export async function deleteSpace(spaceIdOrSlug) {
  const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(spaceIdOrSlug)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete space' }));
    throw new Error(err.detail || "Failed to delete space");
  }
  return await res.json();
}

export async function fetchSpaceVideos(spaceIdOrSlug) {
  try {
    const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(spaceIdOrSlug)}/videos`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not fetch videos for space '${spaceIdOrSlug}':`, err);
    return [];
  }
}

export async function addVideoToSpace(spaceIdOrSlug, payload) {
  const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(spaceIdOrSlug)}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add video to space' }));
    throw new Error(err.detail || "Failed to add video to space");
  }
  return await res.json();
}

export async function removeVideoFromSpace(spaceIdOrSlug, videoId) {
  const res = await fetch(`${API_BASE}/spaces/${encodeURIComponent(spaceIdOrSlug)}/videos/${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to remove video from space' }));
    throw new Error(err.detail || "Failed to remove video from space");
  }
  return await res.json();
}

export async function syncVideoSpaces(payload) {
  const res = await fetch(`${API_BASE}/spaces/sync-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update video spaces' }));
    throw new Error(err.detail || "Failed to update video spaces");
  }
  return await res.json();
}

export async function fetchVideos(spaceSlugs = []) {
  try {
    let url = `${API_BASE}/videos`;
    if (spaceSlugs && spaceSlugs.length > 0) {
      url += `?spaces=${encodeURIComponent(spaceSlugs.join(','))}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using fallback video list:", err);
    return [];
  }
}

export async function uploadVideo(formData) {
  const res = await fetch(`${API_BASE}/videos/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload video' }));
    throw new Error(err.detail || 'Failed to upload video');
  }
  return await res.json();
}

export async function searchCatalog(query = '', options = {}) {
  const { spaces = [], sortBy = 'relevance', limit = 24, offset = 0, source = null } = options;
  try {
    const params = new URLSearchParams();
    if (query && query.trim()) params.append('q', query.trim());
    if (spaces && spaces.length > 0) params.append('spaces', spaces.join(','));
    if (sortBy) params.append('sort_by', sortBy);
    if (limit) params.append('limit', String(limit));
    if (offset) params.append('offset', String(offset));
    if (source) params.append('source', source);

    const res = await fetch(`${API_BASE}/catalog/search?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Catalog search request failed:", err);
    return {
      items: [],
      total: 0,
      query,
      sources_searched: [],
      spaces_filtered: spaces,
      sort_by: sortBy,
      catalog_status: "error",
      error: err.message
    };
  }
}

export function getVideoStreamUrl(videoId) {
  return `${API_BASE}/videos/${videoId}/stream`;
}

export async function fetchVideoById(videoId) {
  try {
    const idStr = String(videoId);
    const url = idStr.startsWith('ext_')
      ? `${API_BASE}/catalog/video/${encodeURIComponent(idStr)}`
      : `${API_BASE}/videos/${idStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch video details from API:", err);
    return null;
  }
}

/**
 * Deterministic Related Videos Discovery:
 * Purely based on transparent attributes (Same Creator, Same Space, Shared Tags).
 * NO black-box behavioral tracking or personalization algorithms.
 */
export function getDeterministicRelatedVideos(currentVideo, allVideos = [], limit = 6) {
  if (!currentVideo || !Array.isArray(allVideos)) return [];

  const currentSlugs = new Set((currentVideo.spaces || []).map(s => s.slug));
  const currentTags = (currentVideo.tags || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);

  return allVideos
    .filter(v => v.id !== currentVideo.id)
    .map(v => {
      let score = 0;
      // Creator match
      if (v.creator_name && currentVideo.creator_name && v.creator_name.toLowerCase() === currentVideo.creator_name.toLowerCase()) {
        score += 10;
      }
      // Space match
      const sharedSpaces = (v.spaces || []).filter(s => currentSlugs.has(s.slug)).length;
      score += sharedSpaces * 5;
      // Tag match
      const vTags = (v.tags || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      const sharedTags = vTags.filter(t => currentTags.includes(t)).length;
      score += sharedTags * 2;

      return { video: v, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.video)
    .slice(0, limit);
}
