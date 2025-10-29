const electron = require('electron');
const { app, BrowserWindow, dialog, ipcMain } = electron;
const path = require('path');
const { getDatabase, saveDatabase } = require('./firebase-service');
const authService = require('./auth-service');
const TemplateService = require('./template-service');

let mainWindow;
let loginWindow;
const templateService = new TemplateService();

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
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

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/waldorf_logo.png'),
    title: 'Login'
  });

  loginWindow.loadFile(path.join(__dirname, '../renderer/login.html'));

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

ipcMain.handle('login', async (event, username, password) => {
    const result = await authService.login(username, password);
    if (result.success) {
        createMainWindow();
        loginWindow.close();
    }
    return result;
});

ipcMain.handle('get-current-user', () => {
    return authService.getCurrentUser();
});

ipcMain.handle('add-user', async (event, userData) => {
    const user = authService.getCurrentUser();
    if (user && user.role === 'admin') {
        return await authService.addUser(userData);
    }
    return { success: false, error: 'Unauthorized' };
});

ipcMain.handle('update-user', async (event, userData) => {
    const user = authService.getCurrentUser();
    if (user && user.role === 'admin') {
        return await authService.updateUser(userData);
    }
    return { success: false, error: 'Unauthorized' };
});

ipcMain.handle('save-data', async (event, data) => {
    const user = authService.getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'editor')) {
        return await saveDatabase(data);
    }
    return { success: false, error: 'Unauthorized' };
});

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

// IPC handler for generating forms
ipcMain.handle('generate-form', async (event, userData, options = {}) => {
  try {
    // Get the current data from Firebase
    const data = await getDatabase();
    
    // Default to PDF generation unless explicitly disabled
    const generateOptions = { ...options, generatePDF: options.generatePDF !== false };
    
    // Generate the form
    const formResults = await templateService.generateForm(data, userData, './generated-forms', generateOptions);
    
    return {
      success: true,
      formResults: formResults,
      solicitudFilename: path.basename(formResults.solicitud),
      checklistFilename: path.basename(formResults.checklist)
    };
  } catch (error) {
    console.error('Error generating form:', error);
    return {
      success: false,
      error: error.message
    };
  }
});


// IPC handler for opening generated files
ipcMain.handle('open-generated-file', async (event, filename) => {
  try {
    const filePath = path.join(process.cwd(), 'generated-forms', filename);
    
    // Open the file with the default application
    const { shell } = require('electron');
    await shell.openPath(filePath);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for opening employee folder
ipcMain.handle('open-employee-folder', async (event, employeeName) => {
  try {
    const sanitizedName = (employeeName || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const folderPath = path.join(process.cwd(), 'generated-forms', sanitizedName);
    
    // Open the folder with the default file manager
    const { shell } = require('electron');
    await shell.openPath(folderPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening employee folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for cleaning up leftover HTML files
ipcMain.handle('cleanup-leftover-files', async (event, options = {}) => {
  try {
    await templateService.cleanupLeftoverFiles('./generated-forms', options);
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up leftover files:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for cleaning up old files
ipcMain.handle('cleanup-old-files', async (event, options = {}) => {
  try {
    await templateService.cleanupOldFiles('./generated-forms', options);
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

app.on('ready', createLoginWindow);

app.on('window-all-closed', async () => {
  // Close the PDF converter service before quitting
  await templateService.close();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Ensure PDF converter service is closed
  await templateService.close();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});