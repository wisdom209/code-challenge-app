# CodeChallenge Platform - Frontend

A modern, terminal-inspired code learning platform built with React, TypeScript, and Tailwind CSS.

## 🎨 Design Philosophy

This frontend features a **"Terminal Brutalism"** aesthetic:
- Dark theme with high contrast neon accents
- Monospace fonts for code and technical elements
- Clean, functional layouts inspired by terminal interfaces
- Smooth animations and micro-interactions
- Responsive design for all screen sizes

## 🚀 Features

### Phase 3 Implementation ✅

1. **✅ React Frontend with TypeScript** - Modern React 18 with full TypeScript support
2. **✅ User Authentication** - Login and registration pages with JWT token handling
3. **✅ Lesson Pages** - Markdown rendering with syntax highlighting for educational content
4. **✅ Language & Category Selection** - Navigate through Python and C challenges
5. **✅ Task Pages** - Complete coding environment with Monaco Editor
6. **✅ Backend Integration** - Full REST API integration for all features

### Additional Features

- **Monaco Editor Integration** - Professional code editor with syntax highlighting
- **Real-time Code Execution** - Run tests and see results immediately
- **GitHub Integration** - Test solutions from your GitHub repositories
- **Progress Tracking** - Monitor your learning journey
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Theme** - Eye-friendly terminal-inspired design

## 📦 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Monaco Editor** - Code editor (VS Code's editor)
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Framer Motion** - Animations (optional)

## 🛠️ Installation

### Prerequisites

- Node.js 18+ and npm/pnpm
- Backend server running on `http://localhost:3001`

### Setup

1. **Install dependencies:**
   \`\`\`bash
   cd frontend
   npm install
   # or
   pnpm install
   \`\`\`

2. **Configure environment (if needed):**
   
   The frontend is pre-configured to proxy API requests to `http://localhost:3001`. If your backend runs on a different port, update `vite.config.ts`:
   
   \`\`\`typescript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:YOUR_PORT',
         changeOrigin: true,
       },
     },
   }
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   # or
   pnpm dev
   \`\`\`

4. **Open browser:**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

\`\`\`
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Navigation header
│   │   │   └── Layout.tsx          # Main layout wrapper
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Login form
│   │   │   └── RegisterForm.tsx    # Registration form
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx        # Individual task card
│   │   │   ├── TaskList.tsx        # List of tasks
│   │   │   └── CodeEditor.tsx      # Monaco code editor
│   │   └── shared/
│   │       ├── Button.tsx          # Reusable button
│   │       └── LoadingSpinner.tsx  # Loading indicator
│   ├── pages/
│   │   ├── Home.tsx                # Landing page
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Registration page
│   │   ├── LanguageSelection.tsx   # Choose language
│   │   ├── CategorySelection.tsx   # Choose category
│   │   ├── CategoryTasks.tsx       # Tasks for category
│   │   ├── TaskDetails.tsx         # Task with code editor
│   │   └── LessonPage.tsx          # Educational content
│   ├── services/
│   │   └── api.ts                  # API client
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── context/
│   │   └── AuthContext.tsx         # Auth state management
│   ├── utils/
│   │   └── constants.ts            # App constants
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
\`\`\`

## 🎯 Key Pages & Features

### 1. Home Page (`/`)
- Hero section with call-to-action
- Feature highlights
- Works for both authenticated and guest users

### 2. Authentication (`/login`, `/register`)
- Clean, focused forms
- Error handling
- Automatic redirect on success

### 3. Language Selection (`/languages`)
- Choose between Python and C
- Visual cards with descriptions
- Statistics display

### 4. Category Selection (`/languages/:language/categories`)
- Browse categories for selected language
- See task counts per category
- Quick navigation

### 5. Category Tasks (`/languages/:language/:category`)
- View all tasks in a category
- Filter by difficulty
- Task cards with metadata

### 6. Task Details (`/task/:id`)
- Full-featured code editor (Monaco)
- Task description and requirements
- Run tests with instant feedback
- GitHub repository integration
- Test results display

### 7. Lesson Page (`/lesson/:language/:category`)
- Markdown content with syntax highlighting
- Code examples
- Educational content

## 🔌 API Integration

All backend endpoints are integrated:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:language` - Get tasks by language
- `GET /api/tasks/:language/:category` - Get tasks by category
- `GET /api/tasks/:id` - Get specific task

### Code Execution
- `POST /api/execute` - Execute code
- `POST /api/execute/test` - Run tests for a task
- `POST /api/execute/test-from-repo` - Test from GitHub repo

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

\`\`\`javascript
colors: {
  dark: { ... },      // Background colors
  neon: { ... },      // Accent colors
}
\`\`\`

### Fonts

Change fonts in `tailwind.config.js` and `index.html`:

\`\`\`javascript
fontFamily: {
  mono: ['Your Mono Font', ...],
  display: ['Your Display Font', ...],
}
\`\`\`

## 🚀 Production Build

1. **Build the application:**
   \`\`\`bash
   npm run build
   # or
   pnpm build
   \`\`\`

2. **Preview production build:**
   \`\`\`bash
   npm run preview
   # or
   pnpm preview
   \`\`\`

3. **Deploy:**
   The `dist/` folder contains the production-ready static files. Deploy to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

## 🔒 Authentication Flow

1. User registers or logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all API requests via Axios interceptor
5. Automatic redirect on 401 responses
6. Protected routes check authentication status

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on `http://localhost:3001`
- Check CORS settings on backend
- Verify proxy configuration in `vite.config.ts`

### Monaco Editor Not Loading
- Check network tab for CDN issues
- Ensure `@monaco-editor/react` is installed

### Styles Not Applying
- Run `npm run dev` to rebuild Tailwind
- Clear browser cache
- Check for CSS conflicts

## 📝 Future Enhancements

- [ ] Real-time collaboration
- [ ] Leaderboard system
- [ ] Achievement badges
- [ ] Code review system
- [ ] AI-powered hints
- [ ] More language support (JavaScript, Rust, Go)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Code snippets library

## 🤝 Contributing

This is a learning platform. Feel free to:
- Add new challenges
- Improve UI/UX
- Fix bugs
- Add features
- Write documentation

## 📄 License

MIT License - feel free to use this project for learning and development.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS

