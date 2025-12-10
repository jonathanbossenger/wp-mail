import React, { useState, useEffect } from 'react';
import RecentDirectories from './components/RecentDirectories';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import { FolderOpenIcon, TrashIcon } from '@heroicons/react/24/outline';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [error, setError] = useState(null);
  const [recentDirectories, setRecentDirectories] = useState([]);

  useEffect(() => {
    // Load recent directories on startup
    loadRecentDirectories();

    // Listen for email updates
    window.electronAPI.onEmailsUpdated((updatedEmails) => {
      setEmails(updatedEmails);
    });
  }, []);

  const loadRecentDirectories = async () => {
    const recent = await window.electronAPI.getRecentDirectories();
    setRecentDirectories(recent);
  };

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectDirectory();
      if (result) {
        setSelectedDirectory(result.directory);
        setEmails(result.emails);
        setRecentDirectories(result.recentDirectories);
        setSelectedEmail(null);
      }
    } catch (err) {
      setError('Failed to select directory: ' + err.message);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSelectRecentDirectory = async (directory) => {
    setIsSelecting(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectRecentDirectory(directory);
      if (result) {
        setSelectedDirectory(result.directory);
        setEmails(result.emails);
        setRecentDirectories(result.recentDirectories);
        setSelectedEmail(null);
      }
    } catch (err) {
      setError('Failed to select directory: ' + err.message);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    if (!selectedDirectory) return;

    const success = await window.electronAPI.deleteEmail(selectedDirectory, emailId);
    if (success) {
      const updatedEmails = emails.filter(e => e.id !== emailId);
      setEmails(updatedEmails);
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    }
  };

  const handleClearEmails = async () => {
    if (!selectedDirectory) return;

    if (window.confirm('Are you sure you want to delete all emails? This cannot be undone.')) {
      const success = await window.electronAPI.clearEmails(selectedDirectory);
      if (success) {
        setEmails([]);
        setSelectedEmail(null);
      }
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleCloseEmail = () => {
    setSelectedEmail(null);
  };

  if (!selectedDirectory) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <svg className="h-12 w-12 text-indigo-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">WP Mail</h1>
            <p className="text-gray-600">View emails sent from WordPress Studio sites</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSelectDirectory}
            disabled={isSelecting}
            className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            <FolderOpenIcon className="h-5 w-5 mr-2" />
            {isSelecting ? 'Selecting...' : 'Select WordPress Studio Site'}
          </button>

          <RecentDirectories 
            directories={recentDirectories}
            onSelect={handleSelectRecentDirectory}
          />

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Select a WordPress Studio site directory to begin viewing emails</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z"/>
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WP Mail</h1>
                <p className="text-xs text-gray-500 truncate max-w-md" title={selectedDirectory}>
                  {selectedDirectory}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearEmails}
              disabled={emails.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              <TrashIcon className="h-4 w-4" />
              Clear All
            </button>
            <button
              onClick={() => setSelectedDirectory(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Change Site
            </button>
          </div>
        </div>
        <div className="px-6 pb-3">
          <div className="text-sm text-gray-600">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'} logged
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <EmailList
            emails={emails}
            selectedEmail={selectedEmail}
            onSelectEmail={handleSelectEmail}
            onDeleteEmail={handleDeleteEmail}
          />
        </div>

        {/* Email Detail */}
        <EmailDetail
          email={selectedEmail}
          onClose={handleCloseEmail}
        />
      </div>
    </div>
  );
}

export default App;
