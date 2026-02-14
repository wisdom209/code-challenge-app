# 🏗️ Frontend Architecture

## Component Hierarchy

\`\`\`
App (AuthProvider)
│
├── Router
│   ├── Layout (Header + Main + Background)
│   │   │
│   │   ├── Public Routes
│   │   │   ├── Home
│   │   │   ├── Login
│   │   │   │   └── LoginForm
│   │   │   └── Register
│   │   │       └── RegisterForm
│   │   │
│   │   └── Protected Routes (ProtectedRoute wrapper)
│   │       ├── LanguageSelection
│   │       ├── CategorySelection
│   │       ├── CategoryTasks
│   │       │   └── TaskList
│   │       │       └── TaskCard (multiple)
│   │       ├── TaskDetails
│   │       │   └── CodeEditor (Monaco)
│   │       └── LessonPage
│   │           └── ReactMarkdown
\`\`\`

## Data Flow

\`\`\`
User Action → Component → API Service → Backend
                ↓
            Update State
                ↓
            Re-render UI
\`\`\`

### Example: Running Tests

\`\`\`
1. User clicks "Run Tests" button
   └── TaskDetails.tsx

2. handleRunTests() called
   └── Calls apiService.runTests()

3. API Service makes POST request
   └── axios.post('/api/execute/test', { taskId, code, language })

4. Backend processes request
   └── Runs code in Docker
   └── Returns results

5. Frontend receives response
   └── Updates result state
   └── Switches to "results" tab
   └── Displays output

6. UI updates
   └── Shows ✅ or ❌
   └── Displays stdout/stderr
   └── Shows execution time
\`\`\`

## State Management

### Global State (Context)
\`\`\`
AuthContext
├── user: User | null
├── token: string | null
├── isAuthenticated: boolean
├── isLoading: boolean
├── login()
├── register()
└── logout()
\`\`\`

### Local State (useState)
- Form inputs
- Loading states
- Error messages
- UI state (tabs, modals, etc.)

## API Integration Flow

\`\`\`
┌─────────────┐
│   Frontend  │
│ (Localhost) │
│    :5173    │
└──────┬──────┘
       │
       │ HTTP Requests
       │ (/api/*)
       │
       ↓
┌──────────────┐
│ Vite Proxy   │  ← Configured in vite.config.ts
└──────┬───────┘
       │
       │ Forwards to
       │
       ↓
┌──────────────┐
│   Backend    │
│ (Express.js) │
│    :3001     │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   MongoDB    │
│   Database   │
└──────────────┘
\`\`\`

## Authentication Flow

\`\`\`
┌─────────┐
│  User   │
└────┬────┘
     │
     ├─ Register/Login
     │
     ↓
┌────────────────┐
│ LoginForm /    │
│ RegisterForm   │
└────┬───────────┘
     │
     ├─ Submit credentials
     │
     ↓
┌────────────────┐
│  API Service   │
│  (Axios)       │
└────┬───────────┘
     │
     ├─ POST /api/auth/login
     │
     ↓
┌────────────────┐
│   Backend      │
│   Validates    │
└────┬───────────┘
     │
     ├─ Returns JWT + User
     │
     ↓
┌────────────────┐
│  AuthContext   │
│  - Save token  │
│  - Save user   │
│  - localStorage│
└────┬───────────┘
     │
     ├─ Update state
     │
     ↓
┌────────────────┐
│  Navigate to   │
│   /languages   │
└────────────────┘
\`\`\`

## Protected Route Logic

\`\`\`
Request /task/123
        │
        ↓
    ProtectedRoute
        │
        ├─ Check isAuthenticated
        │
        ├─ If YES → Render TaskDetails
        │
        └─ If NO  → Navigate to /login
\`\`\`

## Monaco Editor Integration

\`\`\`
┌─────────────────┐
│  CodeEditor     │
│  Component      │
└────┬────────────┘
     │
     ├─ Imports @monaco-editor/react
     │
     ↓
┌─────────────────┐
│  Monaco CDN     │
│  (Loaded async) │
└────┬────────────┘
     │
     ├─ Language: python/c
     │
     ↓
┌─────────────────┐
│  Editor Ready   │
│  - Syntax HL    │
│  - Auto-complete│
│  - Line numbers │
└─────────────────┘
\`\`\`

## File Structure by Feature

### Authentication
\`\`\`
src/
├── context/
│   └── AuthContext.tsx       (Global auth state)
├── components/auth/
│   ├── LoginForm.tsx         (Login UI)
│   └── RegisterForm.tsx      (Register UI)
├── pages/
│   ├── Login.tsx            (Login page)
│   └── Register.tsx         (Register page)
└── services/
    └── api.ts               (Auth API calls)
\`\`\`

### Task System
\`\`\`
src/
├── components/tasks/
│   ├── TaskCard.tsx         (Task preview)
│   ├── TaskList.tsx         (Grid of tasks)
│   └── CodeEditor.tsx       (Monaco editor)
├── pages/
│   ├── LanguageSelection.tsx
│   ├── CategorySelection.tsx
│   ├── CategoryTasks.tsx
│   └── TaskDetails.tsx      (Main coding page)
└── services/
    └── api.ts               (Task API calls)
\`\`\`

### Shared Components
\`\`\`
src/
└── components/
    ├── layout/
    │   ├── Header.tsx       (Navigation)
    │   └── Layout.tsx       (Wrapper)
    └── shared/
        ├── Button.tsx       (Reusable button)
        └── LoadingSpinner.tsx
\`\`\`

## Routing Structure

\`\`\`
/ (Home)
├── /login
├── /register
└── /languages (Protected)
    ├── /languages/:language/categories (Protected)
    │   └── /languages/:language/:category (Protected)
    │       └── /task/:id (Protected)
    └── /lesson/:language/:category (Protected)
\`\`\`

## Build Process

\`\`\`
Source Code (TypeScript + React + Tailwind)
        │
        ↓
    npm run dev (Development)
        │
        ├─ Vite starts dev server
        ├─ Hot Module Replacement
        ├─ TypeScript compilation
        ├─ Tailwind processing
        └─ Proxy API requests
        │
        ↓
    Browser at localhost:5173

OR

    npm run build (Production)
        │
        ├─ TypeScript → JavaScript
        ├─ Tailwind → CSS
        ├─ Bundle optimization
        ├─ Code splitting
        └─ Asset optimization
        │
        ↓
    dist/ folder (Static files)
        │
        ├─ index.html
        ├─ assets/
        │   ├─ index-[hash].js
        │   ├─ index-[hash].css
        │   └─ [vendor]-[hash].js
        └─ ... other files
\`\`\`

## Performance Optimization

### Code Splitting
\`\`\`
main.tsx
    │
    ├─ App.tsx (immediate)
    ├─ Router (immediate)
    └─ Pages (lazy loaded)
        ├─ Home (on demand)
        ├─ Login (on demand)
        ├─ TaskDetails (on demand)
        └─ ... other pages
\`\`\`

### Asset Loading
\`\`\`
Initial Load
    ├─ Critical CSS (Tailwind base)
    ├─ React core
    └─ Router

On Demand
    ├─ Monaco Editor (when CodeEditor mounts)
    ├─ Page-specific components
    └─ Additional libraries
\`\`\`

## Error Handling Flow

\`\`\`
API Request
    │
    ├─ Success (200)
    │   └─ Update state with data
    │
    ├─ Auth Error (401)
    │   ├─ Clear localStorage
    │   └─ Redirect to /login
    │
    └─ Other Error (400, 500, etc.)
        ├─ Set error state
        └─ Display error message to user
\`\`\`

## Styling Architecture

\`\`\`
Global Styles (index.css)
    ├─ Tailwind directives
    ├─ Custom utilities
    └─ Base resets

Component Styles
    ├─ Tailwind utility classes
    ├─ Conditional classes
    └─ Inline styles (rare)

Theme (tailwind.config.js)
    ├─ Colors
    ├─ Fonts
    ├─ Spacing
    └─ Animations
\`\`\`

## Development Workflow

\`\`\`
1. Edit source file
        │
        ↓
2. Vite detects change
        │
        ↓
3. Hot Module Replacement
        │
        ├─ Update only changed module
        └─ Preserve component state
        │
        ↓
4. Browser updates instantly
        │
        ↓
5. No page reload needed!
\`\`\`

## Production Deployment

\`\`\`
Local Development
        │
        ├─ npm run build
        │
        ↓
    dist/ folder
        │
        ├─ Deploy to hosting
        │
        ↓
    Choose Platform:
        │
        ├─ Vercel → Auto-deploy from Git
        ├─ Netlify → Drag & drop or Git
        ├─ AWS S3 → Manual upload
        └─ Docker → Container deployment
        │
        ↓
    Live Application!
\`\`\`

---

This architecture provides:
✅ Clear separation of concerns
✅ Scalable component structure
✅ Efficient data flow
✅ Optimized performance
✅ Easy to maintain and extend

