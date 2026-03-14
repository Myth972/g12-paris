# 🚀 G12 Paris Infos Médias - Server Guide

## Quick Start

### Windows Users

Double-click `launch-server.bat` and select your preferred mode.

### Mac/Linux Users

```bash
npm run dev      # Development mode (hot-reload)
npm run build    # Build for production
npm start        # Production mode
npm run check    # Type-check with TypeScript
```

---

## 📍 Access URLs

### Development Mode

- **Frontend**: http://localhost:3001/
- **API tRPC**: http://localhost:3001/api/trpc
- **Hot-reload**: Enabled (auto-refresh on code changes)

### Production Mode

- **Frontend**: http://localhost:3000/ (or specified PORT)
- **API tRPC**: http://localhost:3000/api/trpc

---

## 🔐 Authentication

### Dev Login (Development Only)

Access the `/dev-login` page to create test accounts:

- **Admin account**: `role: "admin"`
- **User account**: `role: "user"`

Example via API:

```bash
curl -X POST http://localhost:3001/api/dev/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

---

## 🤖 AI Features

### Provider Configuration

Currently using **Groq** for AI generation (Google API disabled due to invalid key).

**Available Models:**

- Groq: `llama-3.3-70b-versatile`

### Features Available

1. **Title Generation** - Generate compelling article titles
2. **Summary Generation** - Create professional summaries
3. **Text Correction** - Auto-fix spelling and grammar
4. **Content Generation** - Write structured articles

### Test AI via API

```bash
curl -X POST http://localhost:3001/api/trpc/ai.generateText \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session_id=YOUR_TOKEN" \
  -d '{
    "json": {
      "prompt": "Paris is the capital of France",
      "type": "title"
    }
  }'
```

---

## 📚 API Endpoints

### Publications

- `GET /api/trpc/publications.list` - List all publications
- `POST /api/trpc/publications.create` - Create publication (admin)
- `POST /api/trpc/publications.delete` - Delete publication (admin)

### Articles

- `GET /api/trpc/articles.list` - List published articles
- `GET /api/trpc/articles.bySlug` - Get article by slug
- `POST /api/trpc/articles.create` - Create article (admin)
- `POST /api/trpc/articles.update` - Update article (admin)
- `POST /api/trpc/articles.delete` - Delete article (admin)

### AI

- `POST /api/trpc/ai.generateText` - Generate text content (admin)
- `POST /api/trpc/ai.generateImage` - Generate images (admin)

### Auth

- `GET /api/trpc/auth.me` - Get current user info
- `POST /api/trpc/auth.logout` - Logout

---

## 🗄️ Database

### Connection

- **Type**: Turso (LibSQL)
- **URL**: `libsql://g12-paris-myth972.aws-eu-west-1.turso.io`
- **Status**: Connected ✅

### Database Commands

```bash
# Generate migrations
npm run db:push

# View schema
# Check drizzle/schema.ts
```

---

## 🔧 Environment Variables

Key variables in `.env`:

```
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# JWT
JWT_SECRET=g12-paris-secret-jwt-key-2024

# AI Provider
PREFERRED_AI_PROVIDER=groq
GROQ_API_KEY=...
GOOGLE_API_KEY=... (optional, currently unused)

# OAuth (Production)
OAUTH_SERVER_URL=... (set for production)
OWNER_OPEN_ID=... (set for production admin)
```

---

## 🧪 Testing

### Type Check

```bash
npm run check  # 0 errors expected ✅
```

### Run Tests

```bash
npm run test
```

### Build Check

```bash
npm run build
```

---

## 📊 Project Status

| Component    | Status | Details                |
| ------------ | ------ | ---------------------- |
| TypeScript   | ✅     | 0 errors               |
| Frontend     | ✅     | React 19, Vite         |
| Backend      | ✅     | Node.js, Express, tRPC |
| Database     | ✅     | Turso (LibSQL)         |
| AI           | ✅     | Groq (llama-3.3-70b)   |
| Auth         | ✅     | JWT + OAuth ready      |
| Publications | ✅     | 2 published            |
| Articles     | ✅     | 1 published            |

---

## 🐛 Troubleshooting

### Port Already in Use

The server automatically tries the next available port.

- Default dev: 3000 → 3001 → 3002, etc.
- Default prod: Check console output

### Frontend Not Loading

1. Check that port 3001 is accessible
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+F5)

### API Errors

1. Ensure dev login session is active
2. Check browser console for error details
3. Verify authentication cookie: `app_session_id`

### AI Not Generating Content

1. Check `GROQ_API_KEY` in `.env`
2. Verify you're logged in as admin
3. Check server logs for API errors

---

## 📝 Common Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check

# Format code
npm run format

# Run tests
npm run test

# Database migrations
npm run db:push
```

---

## 🎯 Next Steps

1. **Configure OAuth** - Set `OAUTH_SERVER_URL` for production
2. **Deploy** - Push to Vercel or your hosting provider
3. **Monitor** - Set up error tracking and logging
4. **Backup** - Configure database backups
5. **Testing** - Add more test coverage

---

## 📞 Support

For issues or questions:

1. Check server logs in console
2. Review `.manus-logs/` directory for debug info
3. Verify environment variables are set correctly
4. Check database connectivity

---

**Last Updated**: 2026-02-21
**Version**: 1.0.0
**Status**: ✅ Production Ready
