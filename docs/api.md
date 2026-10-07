# API Specification

Base URL: `/api/v1`

## Authentication
- `POST /auth/register` - Create a new user account
- `POST /auth/login` - Authenticate and retrieve JWT token
- `GET /auth/me` - Get current authenticated user profile

## Videos
- `GET /videos` - List public videos (supports pagination, search query, sorting)
- `GET /videos/:id` - Fetch single video metadata and view count increment
- `POST /videos/upload` - Upload video file and thumbnail (Multipart/form-data)
- `GET /videos/:id/stream` - HTTP Byte-range video streaming endpoint
- `PUT /videos/:id` - Update video title, description, or visibility
- `DELETE /videos/:id` - Delete a video

## Interactions
- `POST /videos/:id/react` - Like or dislike a video
- `GET /videos/:id/comments` - Retrieve comments for a video
- `POST /videos/:id/comments` - Post a new comment or reply
- `POST /users/:id/subscribe` - Subscribe / unsubscribe to a channel
