Project media folder structure:

- `frontend/public/project-media/images`
- `frontend/public/project-media/photos`
- `frontend/public/project-media/videos`

Use this folder for static assets you want to ship with the frontend project itself.

Examples:

- `frontend/public/project-media/images/logo.png`
- `frontend/public/project-media/photos/banner.jpg`
- `frontend/public/project-media/videos/demo.mp4`

In React, reference them like:

- `/project-media/images/logo.png`
- `/project-media/photos/banner.jpg`
- `/project-media/videos/demo.mp4`

Runtime user uploads are stored separately by the backend under:

- `backend/public/uploads/avatars`
- `backend/public/uploads/covers`
- `backend/public/uploads/thumbnails`
- `backend/public/uploads/videos`

Cloudinary setup:

1. Open Cloudinary Dashboard.
2. Copy `Cloud name`, `API Key`, and `API Secret`.
3. Put them in `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. Restart backend with `npm run dev`.
5. If Cloudinary fails, this project now falls back to local storage in `backend/public/uploads`.

Notes:

- Video uploads use `videos/`
- Video thumbnails use `thumbnails/`
- Avatar uploads use `avatars/`
- Cover uploads use `covers/`
