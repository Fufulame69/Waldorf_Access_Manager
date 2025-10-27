const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { getDatabase, saveDatabase } = require('./firebase-service');

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

// IPC handlers for Firebase operations
ipcMain.handle('load-data', async () => {
  return await getDatabase();
});

ipcMain.handle('save-data', async (event, data) => {
  return await saveDatabase(data);
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