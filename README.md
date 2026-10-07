# Video Platform

A scalable, full-stack video hosting and streaming platform.

---

## 📁 Project Structure

```
video-platform/
│
├── frontend/          # Client-side user interface (Web application)
├── backend/           # API server, authentication, and video processing service
├── database/          # Database schemas, migrations, and seed scripts
├── uploads/           # Storage directory for video files and thumbnails
├── docs/              # System architecture, API specs, and technical documentation
├── .env.example       # Environment variable template
├── .gitignore         # Workspace-level Git ignore rules
└── README.md          # Project overview and setup instructions
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) / Python 3.10+ (depending on backend choice)
- [FFmpeg](https://ffmpeg.org/) (for video processing, thumbnail extraction, and transcoding)
- Relational (PostgreSQL / SQLite) or Document (MongoDB) database

### 1. Environment Setup

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Update the configuration values in `.env` to match your local setup (database credentials, ports, upload limits).

---

## 📂 Subdirectories Overview

- **`frontend/`**: Contains the client application (UI, video player, upload interface, creator studio).
- **`backend/`**: Handles REST/GraphQL endpoints, authentication, video upload pipelines, and streaming.
- **`database/`**: Contains initial SQL/NoSQL schema definitions and migration scripts.
- **`uploads/`**: Local repository for storing uploaded raw videos and generated poster thumbnails.
- **`docs/`**: Detailed project documentation including architecture diagrams and API specs.

---

## 📄 License

This project is licensed under the MIT License.
