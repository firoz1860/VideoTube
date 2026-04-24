# Backend

Express + MongoDB API for the video platform.

## Setup

```bash
npm install
copy .env.example .env
```

## Scripts

- `npm run dev`
- `npm start`

## Base URL

`http://localhost:8080/api/v1`

## Important routes

- `GET /healthcheck`
- `POST /users/register`
- `POST /users/login`
- `POST /users/logout`
- `GET /users/current-user`
- `PATCH /users/update-detail`
- `POST /users/change-password`
