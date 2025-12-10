# WP Mail

<img src="https://github.com/jonathanbossenger/wp-mail/blob/main/assets/icons/icon.png" width="48">

A desktop application for logging and viewing emails sent from [WordPress Studio](https://developer.wordpress.com/studio/) local sites. Built with Electron and React.

## Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Building Executables](#building-executables)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Technical Stack](#technical-stack)
- [License](#license)

## Features

- WordPress Studio Integration
  - Automatic detection of WordPress Studio installations
  - Validates wp-content/database/.ht.sqlite presence
  - Recent directories support for quick access
- Email Logging
  - Automatically installs mu-plugin to capture all wp_mail() calls
  - Logs emails to JSON files in wp-content/uploads/wp-mail-logs/
  - Real-time monitoring for new emails
- Email Viewing
  - List all logged emails with sender, recipient, subject, and timestamp
  - View full email details including headers and attachments
  - Support for both HTML and plain text email messages
  - Delete individual emails or clear all emails
- Clean, modern UI with real-time updates
- Cross-platform support (macOS, Windows, Linux)

## Screenshots

(Screenshots will be added after the app is tested)

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A [WordPress Studio](https://developer.wordpress.com/studio/) installation for testing ([GitHub](https://github.com/Automattic/studio/))

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/jonathanbossenger/wp-mail.git
cd wp-mail
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will:
- Generate application icons
- Start webpack in watch mode for the renderer process
- Launch Electron in development mode
- Enable hot reloading for React components

## Building Executables

The project uses Electron Forge for building platform-specific executables.

### Build for all platforms:
```bash
npm run make
```

This will create executables in the `out/make` directory for:
- macOS (.dmg)
- Windows (.exe)
- Linux (.deb, .rpm)

### Platform-specific builds:

For macOS:
```bash
npm run make -- --platform=darwin
```

For Windows:
```bash
npm run make -- --platform=win32
```

For Linux:
```bash
npm run make -- --platform=linux
```

## Usage

1. Launch the application
2. Select your WordPress Studio site directory
3. The app will automatically:
   - Validate the WordPress Studio installation
   - Install a mu-plugin to log emails
   - Start monitoring for new emails
4. Send test emails from your WordPress site (e.g., password reset, user registration)
5. View logged emails in the app:
   - Click on an email to view full details
   - Delete individual emails with the trash icon
   - Clear all emails with the "Clear All" button
6. When switching sites or closing the app, the mu-plugin remains installed for future use

## How It Works

### Email Logging Plugin

The app installs a mu-plugin (`wp-mail-logger.php`) in your WordPress Studio site's `wp-content/mu-plugins/` directory. This plugin:

- Hooks into WordPress's `wp_mail` action
- Captures all email data (to, from, subject, message, headers, attachments)
- Saves each email as a JSON file in `wp-content/uploads/wp-mail-logs/`
- Adds security protection with .htaccess

### Email Monitoring

The app uses file system watching (chokidar) to:
- Monitor the wp-mail-logs directory for changes
- Automatically update the UI when new emails are logged
- Provide real-time feedback without requiring manual refresh

### Data Storage

Each email is stored as a separate JSON file with:
- Unique ID
- Timestamp (both human-readable and unix timestamp)
- Sender and recipient information
- Subject and message body
- Headers and attachment information

## Technical Stack

- Electron - Desktop application framework
- React - UI framework
- Tailwind CSS - Styling and responsive design
- Chokidar - File system monitoring
- Heroicons - Icon library
- Sharp & PNG2Icons - Icon generation

## Development Scripts

- `npm start` - Start the application
- `npm run dev` - Start the application in development mode
- `npm run build` - Build the renderer process
- `npm run package` - Package the application without creating installers
- `npm run make` - Create platform-specific distributables
- `npm run generate-icons` - Generate application icons from SVG

## License

GPL-2.0-or-later
