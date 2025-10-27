# Waldorf Access Manager

An Electron application for managing hotel access permissions and matrix.

## Project Structure

```
Waldorf_Access_Manager/
├── assets/                    # Static assets (images, icons)
│   └── waldorf_logo.png
├── src/                       # Source code
│   ├── config/               # Configuration files
│   │   └── .env            # Environment variables (Firebase credentials)
│   ├── data/                # Data files
│   │   └── data.json       # Sample/backup data
│   ├── main/                # Electron main process
│   │   ├── main.js         # Main entry point
│   │   ├── preload.js      # Preload script for security
│   │   └── firebase-service.js # Firebase integration
│   └── renderer/           # Renderer process (UI)
│       ├── assets/         # Renderer-specific assets
│       ├── css/           # Stylesheets
│       │   └── styles.css # Main application styles
│       ├── js/            # Client-side JavaScript
│       │   └── app.js    # Application logic
│       └── index.html     # Main HTML file
├── package.json            # Node.js dependencies and scripts
├── package-lock.json       # Locked dependency versions
└── .gitignore            # Git ignore rules
```

## Features

- Department and position management
- System categorization and access control
- Firebase integration for data persistence
- Modern, responsive UI with Waldorf Astoria branding

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Update `src/config/.env` with your Firebase credentials
   - Copy `src/data/data.json` structure to your Firebase database

3. Run the application:
   ```bash
   npm start
   ```

## Development

- Run in development mode: `npm run dev`
- Build for distribution: `npm run build`

## Security Notes

- Environment variables are stored in `src/config/.env` (not tracked by Git)
- The preload script provides secure IPC communication between main and renderer processes
- Node integration is disabled in the renderer for security

## Data Structure

The application manages:
- Departments with positions
- System categories and individual systems
- Access matrix defining which positions can access which systems