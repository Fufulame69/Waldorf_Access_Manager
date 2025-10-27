const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Method to show a confirmation dialog
  showConfirmDialog: (message) => ipcRenderer.invoke('show-confirm-dialog', message),
  
  // Method to show an alert dialog
  showAlertDialog: (message) => ipcRenderer.invoke('show-alert-dialog', message),
  
  // Firebase operations for data management
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  
  // Form generation operations
  generateForm: (userData, options) => ipcRenderer.invoke('generate-form', userData, options),
  getGeneratedForms: () => ipcRenderer.invoke('get-generated-forms'),
  openGeneratedFile: (filename) => ipcRenderer.invoke('open-generated-file', filename)
});