const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

let mainWindow = null;
let watcher = null;
let isCleaningUp = false;
let store = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize electron store
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    defaults: {
      recentDirectories: []
    }
  });
};

// Function to add a directory to recent list
const addToRecentDirectories = (directory) => {
  if (!store) return [];
  const recentDirectories = store.get('recentDirectories', []);
  const filteredDirectories = recentDirectories.filter(dir => dir !== directory);
  filteredDirectories.unshift(directory);
  const updatedDirectories = filteredDirectories.slice(0, 5);
  store.set('recentDirectories', updatedDirectories);
  return updatedDirectories;
};

// Function to check if directory is a WordPress Studio installation
const isWordPressStudioDirectory = async (directory) => {
  try {
    // Check for wp-content/database/.ht.sqlite (WordPress Studio)
    const dbPath = path.join(directory, 'wp-content', 'database', '.ht.sqlite');
    await fs.promises.access(dbPath);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to install the mu-plugin for email logging
const installEmailLoggerPlugin = async (wpDirectory) => {
  try {
    const muPluginsDir = path.join(wpDirectory, 'wp-content', 'mu-plugins');
    
    // Create mu-plugins directory if it doesn't exist
    if (!fs.existsSync(muPluginsDir)) {
      await fs.promises.mkdir(muPluginsDir, { recursive: true });
    }

    const pluginPath = path.join(muPluginsDir, 'wp-mail-logger.php');
    
    // Don't overwrite if it already exists
    if (fs.existsSync(pluginPath)) {
      return true;
    }

    const pluginContent = `<?php
/**
 * Plugin Name: WP Mail Logger
 * Description: Logs all emails sent via wp_mail() for the WP Mail desktop app
 * Version: 1.0.0
 * Author: WP Mail App
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Create the log directory if it doesn't exist
function wp_mail_logger_init() {
    $upload_dir = wp_upload_dir();
    $log_dir = $upload_dir['basedir'] . '/wp-mail-logs';
    
    if ( ! file_exists( $log_dir ) ) {
        wp_mkdir_p( $log_dir );
    }
    
    // Add .htaccess to protect the logs
    $htaccess = $log_dir . '/.htaccess';
    if ( ! file_exists( $htaccess ) ) {
        file_put_contents( $htaccess, "Deny from all" );
    }
}
add_action( 'init', 'wp_mail_logger_init' );

// Hook into wp_mail to log emails
add_action( 'wp_mail', 'wp_mail_logger_log_email', 10, 1 );

function wp_mail_logger_log_email( $args ) {
    $upload_dir = wp_upload_dir();
    $log_dir = $upload_dir['basedir'] . '/wp-mail-logs';
    
    // Create email log entry
    $email_data = array(
        'id' => uniqid( 'email_', true ),
        'to' => is_array( $args['to'] ) ? implode( ', ', $args['to'] ) : $args['to'],
        'subject' => $args['subject'],
        'message' => $args['message'],
        'headers' => is_array( $args['headers'] ) ? implode( "\\n", $args['headers'] ) : $args['headers'],
        'attachments' => is_array( $args['attachments'] ) ? $args['attachments'] : array(),
        'timestamp' => current_time( 'mysql' ),
        'timestamp_unix' => time(),
    );
    
    // Extract from address if present in headers
    $from = '';
    if ( ! empty( $args['headers'] ) ) {
        $headers = is_array( $args['headers'] ) ? $args['headers'] : explode( "\\n", $args['headers'] );
        foreach ( $headers as $header ) {
            if ( stripos( $header, 'From:' ) === 0 ) {
                $from = trim( substr( $header, 5 ) );
                break;
            }
        }
    }
    $email_data['from'] = $from;
    
    // Save email to individual JSON file
    $filename = $log_dir . '/' . $email_data['id'] . '.json';
    file_put_contents( $filename, json_encode( $email_data, JSON_PRETTY_PRINT ) );
    
    return $args;
}
`;

    await fs.promises.writeFile(pluginPath, pluginContent);
    return true;
  } catch (error) {
    console.error('Error installing email logger plugin:', error);
    return false;
  }
};

// Function to remove the mu-plugin
const removeEmailLoggerPlugin = async (wpDirectory) => {
  try {
    const pluginPath = path.join(wpDirectory, 'wp-content', 'mu-plugins', 'wp-mail-logger.php');
    if (fs.existsSync(pluginPath)) {
      await fs.promises.unlink(pluginPath);
    }
    return true;
  } catch (error) {
    console.error('Error removing email logger plugin:', error);
    return false;
  }
};

// Function to get emails from log directory
const getEmails = async (wpDirectory) => {
  try {
    const uploadDir = path.join(wpDirectory, 'wp-content', 'uploads', 'wp-mail-logs');
    
    if (!fs.existsSync(uploadDir)) {
      return [];
    }

    const files = await fs.promises.readdir(uploadDir);
    const emailFiles = files.filter(file => file.endsWith('.json'));
    
    const emails = [];
    for (const file of emailFiles) {
      try {
        const content = await fs.promises.readFile(path.join(uploadDir, file), 'utf8');
        const email = JSON.parse(content);
        emails.push(email);
      } catch (error) {
        console.error(`Error reading email file ${file}:`, error);
      }
    }
    
    // Sort by timestamp (newest first)
    emails.sort((a, b) => {
      const timeA = a.timestamp_unix || 0;
      const timeB = b.timestamp_unix || 0;
      return timeB - timeA;
    });
    
    return emails;
  } catch (error) {
    console.error('Error getting emails:', error);
    return [];
  }
};

// Function to watch for new emails
const watchEmails = (wpDirectory) => {
  if (watcher) {
    watcher.close();
  }

  const uploadDir = path.join(wpDirectory, 'wp-content', 'uploads', 'wp-mail-logs');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  watcher = chokidar.watch(uploadDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('add', async () => {
    if (!isCleaningUp) {
      const emails = await getEmails(wpDirectory);
      mainWindow.webContents.send('emails-updated', emails);
    }
  });

  watcher.on('unlink', async () => {
    if (!isCleaningUp) {
      const emails = await getEmails(wpDirectory);
      mainWindow.webContents.send('emails-updated', emails);
    }
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'WP Mail',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const createMenu = () => {
  const template = [
    {
      label: 'WP Mail',
      submenu: [
        {
          label: 'About WP Mail',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 300,
              height: 340,
              title: 'About WP Mail',
              resizable: false,
              minimizable: false,
              maximizable: false,
              fullscreenable: false,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js'),
              }
            });
            aboutWindow.loadFile(path.join(__dirname, '..', 'renderer', 'about.html'));
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// IPC handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select WordPress Studio Site'
  });

  if (result.canceled) {
    return null;
  }

  const directory = result.filePaths[0];
  const isValid = await isWordPressStudioDirectory(directory);

  if (!isValid) {
    dialog.showErrorBox(
      'Invalid Directory',
      'The selected directory does not appear to be a WordPress Studio installation.\n\nPlease select a directory that contains wp-content/database/.ht.sqlite'
    );
    return null;
  }

  // Install the email logger plugin
  const pluginInstalled = await installEmailLoggerPlugin(directory);
  if (!pluginInstalled) {
    dialog.showErrorBox(
      'Plugin Installation Failed',
      'Failed to install the email logger plugin. Please check permissions.'
    );
    return null;
  }

  // Add to recent directories
  const recentDirectories = addToRecentDirectories(directory);

  // Start watching for emails
  watchEmails(directory);

  // Get initial emails
  const emails = await getEmails(directory);

  return {
    directory,
    emails,
    recentDirectories
  };
});

ipcMain.handle('select-recent-directory', async (event, directory) => {
  const isValid = await isWordPressStudioDirectory(directory);

  if (!isValid) {
    dialog.showErrorBox(
      'Invalid Directory',
      'The directory is no longer a valid WordPress Studio installation.'
    );
    return null;
  }

  // Install the email logger plugin
  await installEmailLoggerPlugin(directory);

  // Add to recent directories
  const recentDirectories = addToRecentDirectories(directory);

  // Start watching for emails
  watchEmails(directory);

  // Get initial emails
  const emails = await getEmails(directory);

  return {
    directory,
    emails,
    recentDirectories
  };
});

ipcMain.handle('get-emails', async (event, directory) => {
  return await getEmails(directory);
});

ipcMain.handle('delete-email', async (event, directory, emailId) => {
  try {
    const filePath = path.join(directory, 'wp-content', 'uploads', 'wp-mail-logs', `${emailId}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    return false;
  }
});

ipcMain.handle('clear-emails', async (event, directory) => {
  try {
    const uploadDir = path.join(directory, 'wp-content', 'uploads', 'wp-mail-logs');
    if (fs.existsSync(uploadDir)) {
      const files = await fs.promises.readdir(uploadDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.promises.unlink(path.join(uploadDir, file));
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error clearing emails:', error);
    return false;
  }
});

ipcMain.handle('get-recent-directories', async () => {
  if (!store) return [];
  return store.get('recentDirectories', []);
});

ipcMain.handle('quit-app', async () => {
  app.quit();
});

// App lifecycle
app.whenReady().then(async () => {
  await initStore();
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (watcher) {
    watcher.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isCleaningUp = true;
  if (watcher) {
    watcher.close();
  }
});
