# ClawScreenwriter

AI-powered screenwriting assistant built with React, TypeScript, and Vite.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Backend API**: Railway deployment for AI features
- **AI Integration**: OpenClaw API for screenplay generation

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_API_URL` - Backend API URL (default: https://clawscreenwriter-production.up.railway.app/api)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The frontend can be deployed to any static hosting service (Vercel, Netlify, Railway, etc.).

Make sure to set the environment variables in your deployment platform.

## API Integration

The frontend connects to:
- **Supabase** for authentication and database
- **Railway Backend** for AI screenplay generation via `/api/openclaw/generate`

## Features

- User authentication (email/password)
- Script management (create, edit, delete)
- Story development steps (logline, synopsis, outline, etc.)
- Fountain-formatted screenplay editor
- AI-powered writing assistance
- Export to PDF, Fountain, FDX, TXT
