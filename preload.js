const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getEmails: (directory) => ipcRenderer.invoke('get-emails', directory),
  deleteEmail: (directory, emailId) => ipcRenderer.invoke('delete-email', directory, emailId),
  clearEmails: (directory) => ipcRenderer.invoke('clear-emails', directory),
  onEmailsUpdated: (callback) => ipcRenderer.on('emails-updated', (event, emails) => callback(emails)),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
  openExternal: (url) => shell.openExternal(url)
});
