# 🚀 Quick Start Guide

Get the CodeChallenge Platform frontend up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Backend server running (see backend README)

## Step-by-Step Setup

### 1. Install Dependencies

\`\`\`bash
cd frontend
npm install
\`\`\`

Or with pnpm (faster):

\`\`\`bash
pnpm install
\`\`\`

### 2. Verify Backend is Running

Make sure your backend server is running on `http://localhost:3001`:

\`\`\`bash
curl http://localhost:3001/health
# Should return: {"status":"ok","database":"connected"}
\`\`\`

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will open at `http://localhost:5173`

### 4. Create an Account

1. Navigate to `http://localhost:5173`
2. Click "Get Started Free"
3. Fill in your details:
   - Username: your_username
   - Email: you@example.com
   - Password: password123
4. Click "Create Account"

### 5. Start Coding!

1. Select a language (Python or C)
2. Choose a category
3. Pick a challenge
4. Write your solution
5. Click "Run Tests"

## Common Issues & Solutions

### Issue: "Network Error" when logging in

**Solution:** Backend is not running or not accessible.

\`\`\`bash
# Check if backend is running
curl http://localhost:3001/health

# If not, start the backend
cd backend
npm run dev
\`\`\`

### Issue: Monaco Editor not loading

**Solution:** Clear cache and restart dev server.

\`\`\`bash
# Stop the server (Ctrl+C)
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
\`\`\`

### Issue: Tailwind styles not applying

**Solution:** Rebuild the project.

\`\`\`bash
# Stop server, delete dist
rm -rf dist
npm run dev
\`\`\`

### Issue: CORS errors

**Solution:** Ensure backend has CORS enabled for `http://localhost:5173`.

Backend should have:
\`\`\`javascript
app.use(cors({
  origin: 'http://localhost:5173'
}));
\`\`\`

## Testing the Full Flow

### 1. Test Authentication
- ✅ Register new user
- ✅ Login with credentials
- ✅ See username in header
- ✅ Logout and redirect to home

### 2. Test Task Flow
- ✅ Navigate to languages
- ✅ Select Python or C
- ✅ View categories
- ✅ Select a category
- ✅ See list of tasks
- ✅ Open a task

### 3. Test Code Execution
- ✅ Write code in editor
- ✅ Click "Run Tests"
- ✅ See test results
- ✅ Pass all tests

### 4. Test GitHub Integration
- ✅ Enter GitHub username
- ✅ Click "Test" button
- ✅ See results from repo

## Default Test Account

If your backend is seeded with test data, you can use:

**Email:** test@example.com  
**Password:** password123

## Available Scripts

\`\`\`bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
\`\`\`

## Default Ports

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

## Next Steps

1. ✅ Complete your first challenge
2. ✅ Try different difficulty levels
3. ✅ Explore both Python and C
4. ✅ Test with your GitHub repos
5. ✅ Track your progress

## Need Help?

- Check the full [README.md](./README.md)
- Review the [backend documentation](../README.md)
- Check browser console for errors
- Verify network tab in DevTools

## Development Tips

### Hot Reload
The dev server supports hot module replacement (HMR). Changes to your code will automatically refresh the browser.

### TypeScript Errors
If you see TypeScript errors, your IDE might need to restart:
- VS Code: Reload window (Cmd/Ctrl + Shift + P → "Reload Window")
- Check `tsconfig.json` for any issues

### Debugging
- Use React DevTools extension
- Check console for errors
- Use Network tab to inspect API calls
- Set breakpoints in browser DevTools

---

**Happy Coding! 💻✨**

