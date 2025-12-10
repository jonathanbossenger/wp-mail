import React from 'react';
import { EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline';

const EmailList = ({ emails, selectedEmail, onSelectEmail, onDeleteEmail }) => {
  if (!emails || emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <EnvelopeIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No emails logged yet</p>
          <p className="text-sm mt-2">Emails sent from your WordPress site will appear here</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };

  const truncate = (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {emails.map((email, index) => (
        <div
          key={email.id}
          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
          }`}
          onClick={() => onSelectEmail(email)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500">{formatDate(email.timestamp)}</span>
              </div>
              <div className="font-medium text-gray-900 mb-1">{email.subject || '(No Subject)'}</div>
              <div className="text-sm text-gray-600">To: {truncate(email.to, 40)}</div>
              {email.from && (
                <div className="text-sm text-gray-500">From: {truncate(email.from, 40)}</div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this email?')) {
                  onDeleteEmail(email.id);
                }
              }}
              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete email"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmailList;
