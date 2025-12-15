# Campus Compass - Frontend

Frontend UI for Campus Compass - an offline-first indoor navigation system for university campuses.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/) or install using:
  ```bash
  # Using winget (Windows)
  winget install OpenJS.NodeJS.LTS
  
  # Using chocolatey (Windows)
  choco install nodejs-lts
  
  # Using homebrew (Mac)
  brew install node
  ```

- **npm** (comes with Node.js) or **yarn** or **pnpm**

### Installation

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will install all required packages (takes about 1-2 minutes).

### Starting the Development Server

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open your browser and navigate to: **http://localhost:8080/**
   - The server will automatically reload when you make code changes

3. **Stop the server:**
   - Press `Ctrl + C` in the terminal

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

## 🔧 Troubleshooting

### Issue: `npm` command not found

**Problem:** Node.js is not installed or not in your PATH.

**Solution:**
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Restart your terminal/IDE after installation
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```
4. If still not working, refresh PATH in PowerShell:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

### Issue: Port 8080 is already in use

**Problem:** Another application is using port 8080.

**Solutions:**
1. Stop the other application using port 8080
2. Or change the port in `vite.config.ts`:
   ```typescript
   server: {
     port: 3000, // Change to any available port
   }
   ```

### Issue: CSS errors or styles not loading

**Problem:** CSS import order issue.

**Solution:** Ensure `@import` statements come before `@tailwind` directives in `src/index.css`.

### Issue: Module not found errors

**Problem:** Dependencies not installed or corrupted.

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Shared components (SearchBar, etc.)
│   │   ├── layout/          # Layout components (PageLayout, BottomNav)
│   │   └── ui/              # UI primitives (shadcn/ui components)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   │   ├── SplashScreen.tsx
│   │   ├── WelcomePage.tsx
│   │   ├── HomePage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── DetailsPage.tsx
│   │   ├── NavigationModePage.tsx
│   │   ├── Navigation2DPage.tsx
│   │   ├── NavigationARPage.tsx
│   │   ├── ArrivedPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── package.json             # Dependencies and scripts
```

## 🛠️ Tech Stack

- **React** 18.3+ - UI library
- **TypeScript** - Type safety
- **Vite** 5.4+ - Build tool and dev server
- **Tailwind CSS** 3.4+ - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **React Router** 6.30+ - Client-side routing
- **Lucide React** - Icon library
- **TanStack Query** - Data fetching and caching

## 📱 Features

- 🗺️ **Indoor Maps** - 2D and AR navigation modes
- 🔍 **Universal Search** - Search faculty, rooms, buildings, departments
- 🤖 **AI Assistant** - Chat interface for campus queries
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🎨 **Modern UI** - Beautiful animations and smooth interactions
- 🚀 **Fast Performance** - Optimized with Vite

## 🎯 Development Workflow

1. **Make changes** to files in `src/`
2. **Save the file** - Vite will automatically reload
3. **Check the browser** - Changes appear instantly (HMR)
4. **Test functionality** - Navigate through the app
5. **Check console** - For any errors or warnings

## 🌐 Network Access

The dev server also provides network URLs so you can access the app from other devices on your network:
- Local: http://localhost:8080/
- Network: http://[your-ip]:8080/

This is useful for testing on mobile devices connected to the same Wi-Fi.

## 📝 Notes

- The development server runs on **port 8080** by default
- Hot Module Replacement (HMR) is enabled for instant updates
- Source maps are enabled for debugging
- TypeScript errors will appear in the terminal and browser console

## 🐛 Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `Cannot find module` | Run `npm install` |
| `Port already in use` | Change port in `vite.config.ts` or kill the process using port 8080 |
| `Syntax error` | Check TypeScript/ESLint errors in terminal |
| `Styles not applying` | Ensure Tailwind is properly configured in `tailwind.config.ts` |

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Need help?** Check the troubleshooting section above or review the project's main README.md file.
