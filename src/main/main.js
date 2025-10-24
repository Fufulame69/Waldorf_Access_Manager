const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/waldorf_logo.png'),
    title: 'Hotel Access Matrix Manager'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Uncomment to open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle confirmation dialog requests
ipcMain.handle('show-confirm-dialog', async (event, message) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 1, // Default to 'No'
    title: 'Confirm Deletion',
    message: message
  });
  
  return result.response === 0; // Return true if 'Yes' was clicked
});

// Handle alert dialog requests
ipcMain.handle('show-alert-dialog', async (event, message) => {
  await dialog.showMessageBox(mainWindow, {
    type: 'info',
    buttons: ['OK'],
    title: 'Information',
    message: message
  });
});

// File operations for data management
const DATA_FILE_PATH = path.join(__dirname, '../../data.json');

// Read data from JSON file
async function readDataFile() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    // If file doesn't exist or is corrupted, return default structure
    return {
      metadata: {
        version: "1.0.0",
        lastModified: new Date().toISOString(),
        description: "Hotel Access Matrix Management Data"
      },
      departments: [],
      categories: [],
      systems: [],
      accessMatrix: {}
    };
  }
}

// Write data to JSON file
async function writeDataFile(data) {
  try {
    // Update metadata
    data.metadata.lastModified = new Date().toISOString();
    
    // Write file with proper formatting
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing data file:', error);
    return { success: false, error: error.message };
  }
}

// IPC handlers for file operations
ipcMain.handle('load-data', async () => {
  return await readDataFile();
});

ipcMain.handle('save-data', async (event, data) => {
  return await writeDataFile(data);
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});