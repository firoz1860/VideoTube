# VidPlay — Full-Stack Video Streaming Platform

A YouTube-style video streaming platform built with **React + TypeScript** on the frontend and **Node.js + Express + MongoDB** on the backend. Supports video upload, streaming, comments, likes, subscriptions, collections, and full user account management.

---

## Features

- **Video streaming** — native HTML5 video player with poster thumbnails
- **Authentication** — email/password login + Google OAuth, JWT sessions with auto-refresh
- **Like / Dislike** — toggle likes with live count, per-session dislike tracking
- **Subscribe / Unsubscribe** — real-time subscriber count updates across the UI
- **Comments** — post, edit, delete, and like/dislike comments (controls only on own comments)
- **Share** — copy link + Twitter/X, Facebook, WhatsApp share buttons in a modal
- **Save to Collection** — save any video into named playlists / collections
- **Flag / Report** — report videos with categorised reasons
- **Collections** — create, edit, delete, and browse video collections with detail view
- **Watch History** — automatic tracking, per-video remove, and full clear
- **Liked Videos** — dedicated liked-video feed
- **Search** — full-text search across videos and channels
- **Channel pages** — videos, playlists, community tweets, subscribed channels tabs
- **Settings** — personal info, channel info, password change, dark/light/system theme
- **Responsive design** — mobile (≤ 640 px), tablet (641–1024 px), desktop (≥ 1025 px)
- **Skeleton loaders** — shimmer animations during every data fetch
- **Admin dashboard** — channel analytics overview

---

## Tech Stack

| Layer       | Technology                                                     |
|-------------|----------------------------------------------------------------|
| Frontend    | React 18, TypeScript 5, Vite 5                                 |
| Styling     | Tailwind CSS 3, PostCSS, custom CSS animations                 |
| Routing     | React Router DOM 6                                             |
| HTTP client | Native `fetch` API (credentials: include, auto token refresh)  |
| Icons       | Lucide React                                                   |
| Toasts      | React Hot Toast                                                |
| State       | React Context API — Auth, Data, Theme contexts                 |
| Backend     | Node.js 18+, Express 4, ES Modules                             |
| Database    | MongoDB 6+, Mongoose 8, mongoose-aggregate-paginate-v2         |
| Auth        | JWT (access + refresh tokens), bcrypt, Google Auth Library     |
| File upload | Multer + Cloudinary (video & image storage)                    |
| Dev tools   | Nodemon, Prettier, ESLint, typescript-eslint                   |

---

## Project Structure

```
video-frontend/
├── README.md
│
├── frontend/                          # React + TypeScript SPA
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── channel/
│   │   │   │   ├── ChannelHeader.tsx
│   │   │   │   └── ChannelTabs.tsx
│   │   │   ├── comment/
│   │   │   │   └── CommentItem.tsx    # Like · edit · delete · reply
│   │   │   ├── common/
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Logo.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx         # App shell
│   │   │   │   ├── Navbar.tsx         # Top bar with search + user menu
│   │   │   │   └── Sidebar.tsx        # Collapsible icon sidebar
│   │   │   ├── modals/
│   │   │   │   ├── DeleteVideoModal.tsx
│   │   │   │   ├── EditVideoModal.tsx
│   │   │   │   ├── UploadVideoModal.tsx
│   │   │   │   ├── UploadingVideoModal.tsx
│   │   │   │   └── UploadSuccessModal.tsx
│   │   │   └── video/
│   │   │       ├── VideoCard.tsx      # Grid card with hover play + subscribe
│   │   │       └── VideoListItem.tsx  # List view item
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Auth state, login, register, logout
│   │   │   ├── DataContext.tsx        # Videos, likes, history, subscriptions,
│   │   │   │                          #   collections, comment likes
│   │   │   ├── ThemeContext.tsx       # Dark / Light / System theme
│   │   │   └── api.service.ts         # Typed user / profile API wrappers
│   │   │
│   │   ├── hooks/
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Central fetch helper + all API calls
│   │   │   └── mappers.ts             # Backend ↔ frontend DTO mapping
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/        AdminDashboard.tsx
│   │   │   ├── auth/         Login.tsx  ·  Register.tsx
│   │   │   ├── channel/      ChannelVideoList · ChannelPlaylist · ChannelTweets …
│   │   │   ├── collections/  Collections.tsx   # CRUD + detail view
│   │   │   ├── history/      History.tsx
│   │   │   ├── home/         Home.tsx          # Skeleton grid
│   │   │   ├── legal/        Privacy.tsx  ·  Terms.tsx
│   │   │   ├── liked/        LikedVideos.tsx
│   │   │   ├── my-content/   MyContent.tsx
│   │   │   ├── not-found/    NotFound.tsx
│   │   │   ├── search/       SearchResults.tsx
│   │   │   ├── settings/     EditPersonalInfo · EditChannelInfo · ChangePassword
│   │   │   ├── subscribers/  Subscribers.tsx
│   │   │   ├── support/      Support.tsx
│   │   │   ├── video-detail/ VideoDetail.tsx   # Player + all interactions
│   │   │   └── video-listing/ VideoListingCard · VideoListingList
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               # Video, User, Comment, Collection, Tweet
│   │   │
│   │   ├── utils/
│   │   │   └── formatter.ts           # formatNumber, formatTimeAgo, formatDuration
│   │   │
│   │   ├── App.tsx                    # Route definitions + auth guards
│   │   ├── main.tsx                   # React entry point
│   │   └── index.css                  # Tailwind + design tokens + animations
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── package.json
│
└── backend/                           # Node.js + Express REST API
    ├── src/
    │   ├── controllers/
    │   │   ├── comment.controller.js  # CRUD + soft delete
    │   │   ├── dashboard.controller.js
    │   │   ├── like.controller.js     # Toggle like (video / comment / tweet)
    │   │   ├── playlist.controller.js # Playlist CRUD + video add/remove
    │   │   ├── subscription.controller.js
    │   │   ├── tweet.controller.js
    │   │   ├── user.controller.js     # Auth, profile, avatar, cover
    │   │   └── video.controller.js    # Upload, update, delete, paginate
    │   │
    │   ├── models/
    │   │   ├── comment.model.js
    │   │   ├── like.model.js
    │   │   ├── playlist.model.js
    │   │   ├── subscription.model.js
    │   │   ├── tweet.model.js
    │   │   ├── user.model.js
    │   │   └── video.model.js
    │   │
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── comment.routes.js
    │   │   ├── dashboard.routes.js
    │   │   ├── like.routes.js
    │   │   ├── playlist.routes.js
    │   │   ├── subscription.routes.js
    │   │   ├── tweet.routes.js
    │   │   ├── user.routes.js
    │   │   └── video.routes.js
    │   │
    │   ├── middlewares/
    │   │   ├── auth.middleware.js     # JWT verification
    │   │   └── multer.middleware.js   # Multipart file upload
    │   │
    │   ├── utils/
    │   │   ├── ApiError.js
    │   │   ├── ApiResponse.js
    │   │   ├── asyncHandler.js
    │   │   ├── cloudinary.js          # Upload / delete from Cloudinary
    │   │   └── serializers.js
    │   │
    │   ├── db/
    │   │   └── index.js               # MongoDB connection
    │   │
    │   ├── app.js                     # Express app + CORS + middleware
    │   ├── constants.js
    │   └── index.js                   # Server entry point
    │
    └── package.json
```

---

## Prerequisites

| Tool       | Version     | Notes                          |
|-----------|-------------|--------------------------------|
| Node.js    | ≥ 18.x      | LTS recommended                |
| npm        | ≥ 9.x       | bundled with Node 18           |
| MongoDB    | ≥ 6.x       | local install or MongoDB Atlas |
| Cloudinary | Free tier   | for video + image storage      |
| Git        | any         |                                |

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd video-frontend
```

### 2. Backend — install & configure

```bash
cd backend
npm install
```

Create **`backend/.env`**:

```env
# Server
PORT=8080
NODE_ENV=development

# MongoDB — local or Atlas
MONGODB_URI=mongodb://localhost:27017/vidplay

# JWT tokens
ACCESS_TOKEN_SECRET=replace_with_long_random_string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace_with_another_long_random_string
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional — for "Sign in with Google")
GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Frontend — install & configure

```bash
cd ../frontend
npm install
```

Create **`frontend/.env`**:

```env
VITE_API_URL=http://localhost:8080/api/v1

# Google OAuth (optional — same client ID as backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Running the Project

Open **two terminals** and run both servers simultaneously.

### Terminal 1 — Backend (Express + MongoDB)

```bash
cd backend
npm run dev
# ➜ API server running at http://localhost:8080
# ➜ Health check: http://localhost:8080/api/v1/healthcheck
```

### Terminal 2 — Frontend (Vite dev server)

```bash
cd frontend
npm run dev
# ➜ App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Production Build

```bash
# Build the frontend (output → frontend/dist/)
cd frontend
npm run build

# Preview the production build locally
npm run preview

# Type-check without emitting files
npx tsc --noEmit
```

The `dist/` folder can be served by any static host (Vercel, Netlify, Nginx, etc.).  
The backend can be deployed to any Node.js host (Railway, Render, VPS, etc.).

---

## Lint & Format

```bash
cd frontend

# ESLint
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## API Reference (key endpoints)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/users/register` | — | Register with name, email, password (+ optional avatar) |
| `POST` | `/api/v1/users/login` | — | Email or username + password login |
| `POST` | `/api/v1/users/google-auth` | — | Google OAuth login |
| `GET`  | `/api/v1/users/current-user` | ✓ | Get current authenticated user |
| `POST` | `/api/v1/users/logout` | ✓ | Invalidate session |
| `POST` | `/api/v1/users/refresh-token` | — | Exchange refresh token for new access token |
| `PATCH`| `/api/v1/users/update-detail` | ✓ | Update name / email |
| `PATCH`| `/api/v1/users/avatar` | ✓ | Change avatar image |
| `PATCH`| `/api/v1/users/update-cover` | ✓ | Change cover image |
| `POST` | `/api/v1/users/change-password` | ✓ | Change password |
| `GET`  | `/api/v1/videos` | — | Paginated video list |
| `GET`  | `/api/v1/videos/:id` | — | Single video details |
| `POST` | `/api/v1/videos` | ✓ | Upload video (multipart) |
| `PATCH`| `/api/v1/videos/:id` | ✓ | Update title / description / thumbnail |
| `DELETE`|`/api/v1/videos/:id` | ✓ | Delete video |
| `POST` | `/api/v1/likes/toggle/v/:videoId` | ✓ | Toggle video like |
| `POST` | `/api/v1/likes/toggle/c/:commentId` | ✓ | Toggle comment like |
| `GET`  | `/api/v1/likes/videos` | ✓ | Get liked videos |
| `POST` | `/api/v1/subscriptions/:channelId` | ✓ | Toggle subscription |
| `GET`  | `/api/v1/subscriptions/user/:userId` | — | Get subscribed channels |
| `GET`  | `/api/v1/comments/video/:videoId` | — | Paginated comments |
| `POST` | `/api/v1/comments/video/:videoId` | ✓ | Post comment |
| `PATCH`| `/api/v1/comments/:commentId` | ✓ | Edit own comment |
| `DELETE`|`/api/v1/comments/:commentId` | ✓ | Delete own comment |
| `GET`  | `/api/v1/playlists/user/:userId` | — | User's playlists / collections |
| `POST` | `/api/v1/playlists` | ✓ | Create collection |
| `PATCH`| `/api/v1/playlists/:id` | ✓ | Rename / re-describe collection |
| `DELETE`|`/api/v1/playlists/:id` | ✓ | Delete collection |
| `POST` | `/api/v1/playlists/:id/videos/:videoId` | ✓ | Add video to collection |
| `DELETE`|`/api/v1/playlists/:id/videos/:videoId` | ✓ | Remove video from collection |
| `GET`  | `/api/v1/users/history` | ✓ | Watch history |
| `POST` | `/api/v1/users/history/:videoId` | ✓ | Add to watch history |
| `DELETE`|`/api/v1/users/history` | ✓ | Clear all history |

---

## Responsive Breakpoints

| Device  | Viewport   | Grid       | Sidebar behaviour     |
|---------|-----------|------------|-----------------------|
| Mobile  | < 640 px  | 1 column   | Hidden — hamburger menu opens a drawer |
| Tablet  | 640–1024 px | 2 columns | Icon-only sidebar (hover to expand labels) |
| Desktop | > 1024 px | 3–4 columns | Icon-only sidebar (hover to expand) |

---

## Environment Variables Quick Reference

### `backend/.env`

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | No | `8080` |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/vidplay` |
| `ACCESS_TOKEN_SECRET` | **Yes** | 64-char random string |
| `ACCESS_TOKEN_EXPIRY` | **Yes** | `1d` |
| `REFRESH_TOKEN_SECRET` | **Yes** | 64-char random string |
| `REFRESH_TOKEN_EXPIRY` | **Yes** | `10d` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | `my-cloud` |
| `CLOUDINARY_API_KEY` | **Yes** | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **Yes** | `abc123...` |
| `GOOGLE_CLIENT_ID` | No | `xxx.apps.googleusercontent.com` |

### `frontend/.env`

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | **Yes** | `http://localhost:8080/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | No | `xxx.apps.googleusercontent.com` |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following conventional commits: `git commit -m "feat: add my feature"`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request against `main`

---

## License

MIT — free to use for personal and commercial projects.
