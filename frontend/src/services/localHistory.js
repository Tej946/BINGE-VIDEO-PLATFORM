// Local device storage for Watch History, Saved Videos, Playlists, Subscriptions & Settings
// Privacy First: All user state is strictly stored in local storage — never tracked or profiled.

const STORAGE_KEYS = {
  LOCAL_HISTORY: 'binge_local_watch_history',
  SAVED_VIDEOS: 'binge_saved_videos',
  PLAYLISTS: 'binge_user_playlists',
  SUBSCRIPTIONS: 'binge_subscriptions',
  LIKED_VIDEOS: 'binge_liked_videos',
  WATCH_PROGRESS: 'binge_watch_progress',
  SETTINGS: 'binge_user_settings',
  SELECTED_MERGED_SPACES: 'binge_merged_spaces'
};

export const localStore = {
  // Watch History
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(video) {
    const history = this.getHistory();
    const filtered = history.filter(item => item.id !== video.id);
    const updated = [{ ...video, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.LOCAL_HISTORY, JSON.stringify(updated));
    return updated;
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.WATCH_PROGRESS);
    return [];
  },

  // Saved / Watch Later
  getSavedVideos() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleSaveVideo(video) {
    const saved = this.getSavedVideos();
    const exists = saved.some(item => item.id === video.id);
    let updated;
    if (exists) {
      updated = saved.filter(item => item.id !== video.id);
    } else {
      updated = [{ ...video, savedAt: new Date().toISOString() }, ...saved];
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_VIDEOS, JSON.stringify(updated));
    return { isSaved: !exists, savedList: updated };
  },

  isSaved(videoId) {
    return this.getSavedVideos().some(item => item.id === videoId);
  },

  // Playlists
  getPlaylists() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (data) return JSON.parse(data);
      // Default starter playlist
      const defaultPlaylists = [
        {
          id: 'favorites',
          title: 'Favorites',
          description: 'My favorite platform videos',
          createdAt: new Date().toISOString(),
          videos: []
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(defaultPlaylists));
      return defaultPlaylists;
    } catch {
      return [];
    }
  },

  createPlaylist(title, description = '') {
    const playlists = this.getPlaylists();
    const newPlaylist = {
      id: `pl_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      videos: []
    };
    const updated = [newPlaylist, ...playlists];
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return updated;
  },

  addVideoToPlaylist(playlistId, video) {
    const playlists = this.getPlaylists();
    const updated = playlists.map(pl => {
      if (pl.id === playlistId) {
        if (pl.videos.some(v => v.id === video.id)) return pl;
        return {
          ...pl,
          videos: [...pl.videos, { ...video, addedAt: new Date().toISOString() }]
        };
      }
      return pl;
    });
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return updated;
  },

  removeVideoFromPlaylist(playlistId, videoId) {
    const playlists = this.getPlaylists();
    const updated = playlists.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          videos: pl.videos.filter(v => v.id !== videoId)
        };
      }
      return pl;
    });
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return updated;
  },

  deletePlaylist(playlistId) {
    const playlists = this.getPlaylists();
    const updated = playlists.filter(pl => pl.id !== playlistId);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return updated;
  },

  // Subscriptions (Channels/Creators)
  getSubscriptions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleSubscription(creatorName) {
    if (!creatorName) return this.getSubscriptions();
    const subs = this.getSubscriptions();
    const exists = subs.includes(creatorName);
    const updated = exists ? subs.filter(c => c !== creatorName) : [...subs, creatorName];
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(updated));
    return { isSubscribed: !exists, subscriptions: updated };
  },

  isSubscribed(creatorName) {
    if (!creatorName) return false;
    return this.getSubscriptions().includes(creatorName);
  },

  // Local Likes
  getLikes() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIKED_VIDEOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  toggleLike(videoId) {
    const likes = this.getLikes();
    const exists = likes.includes(videoId);
    const updated = exists ? likes.filter(id => id !== videoId) : [...likes, videoId];
    localStorage.setItem(STORAGE_KEYS.LIKED_VIDEOS, JSON.stringify(updated));
    return { isLiked: !exists, likes: updated };
  },

  isLiked(videoId) {
    return this.getLikes().includes(videoId);
  },

  // Watch Progress
  getProgress(videoId) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS);
      const map = data ? JSON.parse(data) : {};
      return map[videoId] || null;
    } catch {
      return null;
    }
  },

  setProgress(videoId, currentTime, duration) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS);
      const map = data ? JSON.parse(data) : {};
      map[videoId] = {
        currentTime: Math.floor(currentTime),
        duration: Math.floor(duration),
        percent: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.WATCH_PROGRESS, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  },

  // Merged Spaces Selection Persistence
  getMergedSpaces(defaultList = []) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SELECTED_MERGED_SPACES);
      return data ? JSON.parse(data) : defaultList;
    } catch {
      return defaultList;
    }
  },

  setMergedSpaces(slugs) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MERGED_SPACES, JSON.stringify(slugs));
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        recordHistory: true,
        autoplayNext: false,
        streamQuality: '480p',
        privacyShield: true
      };
    } catch {
      return {
        recordHistory: true,
        autoplayNext: false,
        streamQuality: '480p',
        privacyShield: true
      };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
};
