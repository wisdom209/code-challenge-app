# 📦 Complete Setup Guide - CodeChallenge Frontend

This guide will walk you through setting up the entire frontend from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Structure](#project-structure)
4. [Configuration](#configuration)
5. [Running the App](#running-the-app)
6. [Building for Production](#building-for-production)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **pnpm** - Package manager
- **Git** - Version control

### Backend Requirements

The frontend requires the backend API to be running. Ensure:
- Backend server is running on `http://localhost:3001`
- MongoDB is connected
- At least one user account exists (or ability to register)

## Installation

### Step 1: Navigate to Frontend Directory

\`\`\`bash
cd frontend
\`\`\`

### Step 2: Install Dependencies

Using npm:
\`\`\`bash
npm install
\`\`\`

Or using pnpm (recommended - faster):
\`\`\`bash
pnpm install
\`\`\`

This will install all required packages:
- React & React DOM
- TypeScript
- Tailwind CSS
- React Router
- Monaco Editor
- Axios
- And more...

### Step 3: Verify Installation

Check that all dependencies were installed:
\`\`\`bash
npm list --depth=0
\`\`\`

## Project Structure

\`\`\`
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── auth/       # Login/Register forms
│   │   ├── layout/     # Header, Layout components
│   │   ├── shared/     # Button, LoadingSpinner, etc.
│   │   └── tasks/      # Task-related components
│   ├── pages/          # Route pages
│   ├── services/       # API service
│   ├── context/        # React Context (Auth)
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Helper functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML entry
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind config
\`\`\`

## Configuration

### 1. Environment Variables (Optional)

Create a \`.env\` file in the frontend root:

\`\`\`env
VITE_API_URL=http://localhost:3001
\`\`\`

> **Note:** The API URL is already configured in \`vite.config.ts\` via proxy, so this is optional.

### 2. Vite Configuration

The \`vite.config.ts\` is pre-configured with:
- React plugin
- Path aliases (@/ → src/)
- API proxy to backend

If your backend runs on a different port, update:

\`\`\`typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:YOUR_PORT', // Change here
        changeOrigin: true,
      },
    },
  },
})
\`\`\`

### 3. Tailwind Configuration

The design system is configured in \`tailwind.config.js\`:

\`\`\`javascript
theme: {
  extend: {
    colors: {
      dark: { ... },   // Dark theme colors
      neon: { ... },   // Accent colors
    },
    fontFamily: {
      mono: ['JetBrains Mono', ...],
      display: ['Space Grotesk', ...],
    },
  },
}
\`\`\`

## Running the App

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

This will:
1. Start Vite dev server on `http://localhost:5173`
2. Enable hot module replacement (HMR)
3. Proxy API requests to backend
4. Open browser automatically

### Verify Backend Connection

Open browser DevTools (F12) and check:
1. Network tab for API requests
2. Console for any errors
3. Application tab for localStorage (after login)

### Test the Flow

1. **Register/Login**
   - Navigate to `/register`
   - Create account or login
   - Verify redirect to `/languages`

2. **Browse Challenges**
   - Select a language (Python or C)
   - Browse categories
   - Open a task

3. **Code & Test**
   - Write code in Monaco Editor
   - Click "Run Tests"
   - View results

## Building for Production

### Step 1: Build

\`\`\`bash
npm run build
\`\`\`

This creates an optimized production build in \`dist/\`:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Source maps (for debugging)

### Step 2: Preview Build

Test the production build locally:

\`\`\`bash
npm run preview
\`\`\`

Opens at `http://localhost:4173`

### Step 3: Analyze Bundle Size

Check what's included:

\`\`\`bash
npm run build -- --mode production
\`\`\`

Look for large dependencies and optimize if needed.

## Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Deploy:**
   \`\`\`bash
   vercel
   \`\`\`

3. **Configure:**
   - Framework: Vite
   - Build command: \`npm run build\`
   - Output directory: \`dist\`

### Option 2: Netlify

1. **Install Netlify CLI:**
   \`\`\`bash
   npm install -g netlify-cli
   \`\`\`

2. **Deploy:**
   \`\`\`bash
   netlify deploy --prod
   \`\`\`

3. **Build settings:**
   - Build command: \`npm run build\`
   - Publish directory: \`dist\`

### Option 3: AWS S3 + CloudFront

1. **Build:**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Upload to S3:**
   \`\`\`bash
   aws s3 sync dist/ s3://your-bucket-name
   \`\`\`

3. **Configure CloudFront:**
   - Set origin to S3 bucket
   - Enable HTTPS
   - Configure error pages

### Option 4: Docker

Create \`Dockerfile\`:

\`\`\`dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

Build and run:
\`\`\`bash
docker build -t codechallenge-frontend .
docker run -p 80:80 codechallenge-frontend
\`\`\`

## Troubleshooting

### Issue 1: Dependencies Won't Install

**Solution:**
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
\`\`\`

### Issue 2: "Cannot find module '@/...'"

**Solution:** TypeScript path aliases issue.

Check \`tsconfig.json\`:
\`\`\`json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
\`\`\`

Check \`vite.config.ts\`:
\`\`\`typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
\`\`\`

### Issue 3: Monaco Editor Not Loading

**Symptoms:** Blank editor or "Loading..." forever

**Solutions:**
1. Check network tab for 404s
2. Clear cache: \`Ctrl+Shift+R\`
3. Reinstall Monaco:
   \`\`\`bash
   npm uninstall @monaco-editor/react
   npm install @monaco-editor/react
   \`\`\`

### Issue 4: API Requests Failing

**Check:**
1. Backend is running: \`curl http://localhost:3001/health\`
2. CORS is configured on backend
3. Proxy is working (check Network tab)
4. Token is stored in localStorage

**Debug:**
\`\`\`javascript
// In browser console
localStorage.getItem('token')
localStorage.getItem('user')
\`\`\`

### Issue 5: Tailwind Styles Not Applying

**Solutions:**
1. Ensure PostCSS is configured
2. Check \`tailwind.config.js\` content paths
3. Restart dev server
4. Clear browser cache

### Issue 6: TypeScript Errors

**Common fixes:**
\`\`\`bash
# Regenerate lock file
rm package-lock.json
npm install

# Restart TypeScript server (VS Code)
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
\`\`\`

### Issue 7: Port 5173 Already in Use

**Solution:**
\`\`\`bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
\`\`\`

## Performance Optimization

### 1. Code Splitting

Already configured via Vite. Check bundle:
\`\`\`bash
npm run build
\`\`\`

### 2. Lazy Loading

Implement for routes:
\`\`\`typescript
const TaskDetails = lazy(() => import('./pages/TaskDetails'));
\`\`\`

### 3. Image Optimization

- Use WebP format
- Lazy load images
- Compress before upload

### 4. Bundle Analysis

Install analyzer:
\`\`\`bash
npm install -D rollup-plugin-visualizer
\`\`\`

Add to \`vite.config.ts\`:
\`\`\`typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer(),
]
\`\`\`

## Security Checklist

- ✅ All API requests use HTTPS in production
- ✅ JWT tokens stored in localStorage (consider httpOnly cookies)
- ✅ No sensitive data in client-side code
- ✅ Content Security Policy configured
- ✅ Dependencies regularly updated

## Monitoring

### Add Analytics

Google Analytics 4:
\`\`\`typescript
// In main.tsx or App.tsx
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
\`\`\`

### Error Tracking

Sentry:
\`\`\`bash
npm install @sentry/react
\`\`\`

\`\`\`typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "your-dsn",
});
\`\`\`

## Development Workflow

1. **Create Feature Branch**
   \`\`\`bash
   git checkout -b feature/new-feature
   \`\`\`

2. **Make Changes**
   - Edit components
   - Test in browser
   - Check console for errors

3. **Test**
   - Manual testing
   - TypeScript checks: \`npm run build\`
   - Lint: \`npm run lint\`

4. **Commit & Push**
   \`\`\`bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   \`\`\`

## Useful Commands

\`\`\`bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# Maintenance
npm outdated             # Check for updates
npm update               # Update dependencies
npm audit                # Security audit
npm audit fix            # Fix vulnerabilities
\`\`\`

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)

## Support

If you encounter issues:
1. Check this guide
2. Review browser console
3. Check Network tab in DevTools
4. Verify backend is running
5. Clear cache and restart

---

**Ready to code! 🚀**

