# Backend Application

This directory contains the API server, database interface, and media streaming/processing engine.

## Core Responsibilities
- **Authentication & User Management**: Registration, Login, JWT verification, and user profiles.
- **Video Management**: Metadata CRUD (titles, descriptions, tags, categories).
- **Upload & Media Pipeline**: Multipart chunked upload, thumbnail generation, and FFmpeg transcoding (HLS/DASH or MP4 formats).
- **Streaming Service**: Chunked HTTP byte-range streaming (`Accept-Ranges: bytes`).
- **Social Features**: Likes, comments, subscriptions, views counting, and playlists.

## Recommended Structure
```
backend/
├── src/
│   ├── config/       # Environment variables & service configs
│   ├── controllers/  # Request handlers
│   ├── middlewares/  # Authentication, rate limit, upload middleware
│   ├── models/       # Database models / ORM entities
│   ├── routes/       # API route definitions
│   ├── services/     # Business logic & FFmpeg processing
│   └── utils/        # Helper functions
└── server.js / main.py
```
