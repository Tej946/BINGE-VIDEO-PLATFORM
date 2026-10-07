# BINGE — Platform Architecture & Engineering Plan

## 1. Specification Analysis & Philosophy

**BINGE** is designed as a privacy-focused, ad-free video platform where users, not algorithms or advertisers, control what they watch.

### Key Architectural Tenets:
1. **User Sovereignty Over Content Discovery**:
   - Discovery happens strictly through explicit constructs: **Spaces**, **Search**, **Subscriptions**, **Playlists**, and **Saved Videos**.
   - No algorithmic feed or addictive engagement loops.
2. **First-Class "Spaces" Concept**:
   - Content is categorized and isolated into Spaces (e.g., Anime, Horror, Gaming, College, Japanese Learning).
   - Viewing is context-aware: when inside a Space, only content belonging to that Space appears.
   - **Merged / All View**: Users intentionally select multiple Spaces to view a unified composite feed—deterministic, not algorithmic.
3. **Privacy by Default**:
   - Zero hidden trackers, zero behavioral profiling.
   - Local watch history stays on the user's client device by default.
4. **Lean & Reliable Playback**:
   - Default resolution target is **480p** for fast loading, low bandwidth, and rock-solid playback.
5. **Decoupled Future Capabilities**:
   - Multilingual AI assistant and transcript video understanding are isolated modules that do not interfere with the core video playback engine.

---

## 2. Minimum Viable Product (MVP) Definition

The MVP encompasses **Phases 1 through 3**:
1. **Foundation (Phase 1)**: Modern BINGE aesthetic, responsive navigation, FastAPI backend, SQLite database connectivity, and health monitoring.
2. **Video Platform (Phase 2)**: Local video upload, 480p streaming pipeline, and custom BINGE video player.
3. **Spaces (Phase 3)**: Space creation, assignment, dedicated Space views, and Merged Multi-Space view selector.

---

## 3. Directory Layout

```
binge/
│
├── frontend/               # React client application
│   ├── public/             # Static icons, logos, manifests
│   ├── src/
│   │   ├── assets/         # CSS styles & design tokens
│   │   ├── components/     # Layout, Sidebar, Topbar, SpaceBadge, VideoCard
│   │   ├── pages/          # Home, SpaceView, Watch, Library, Settings
│   │   ├── services/       # API client & local storage services
│   │   └── App.jsx         # App router & global context
│   └── package.json
│
├── backend/                # Python FastAPI application
│   ├── app/
│   │   ├── api/v1/         # Versioned endpoints (health, spaces, videos, auth)
│   │   ├── core/           # Config, database engine, security
│   │   ├── models/         # SQLAlchemy models (Space, Video, User)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── services/       # Video streaming & storage logic
│   ├── requirements.txt
│   └── main.py
│
├── database/               # Local SQLite database file & schema migrations
├── uploads/                # Local storage for 480p videos & posters
├── docs/                   # Documentation & blueprints
├── .env.example
├── .gitignore
└── README.md
```
