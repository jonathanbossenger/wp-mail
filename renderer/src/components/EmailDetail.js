import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EmailDetail = ({ email, onClose }) => {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
        <p>Select an email to view details</p>
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

  const isHtml = (message) => {
    return /<[a-z][\s\S]*>/i.test(message);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 truncate flex-1">
          {email.subject || '(No Subject)'}
        </h2>
        <button
          onClick={onClose}
          className="ml-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
          title="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Email Details */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-medium text-gray-700">Date:</span>
              <span className="text-gray-900">{formatDate(email.timestamp)}</span>
            </div>
            
            {email.from && (
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-gray-700">From:</span>
                <span className="text-gray-900 break-all">{email.from}</span>
              </div>
            )}
            
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-medium text-gray-700">To:</span>
              <span className="text-gray-900 break-all">{email.to}</span>
            </div>
            
            {email.headers && (
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-gray-700">Headers:</span>
                <pre className="text-sm text-gray-900 whitespace-pre-wrap break-all font-mono bg-white p-2 rounded border border-gray-200">
                  {email.headers}
                </pre>
              </div>
            )}
            
            {email.attachments && email.attachments.length > 0 && (
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="font-medium text-gray-700">Attachments:</span>
                <div className="text-gray-900">
                  {email.attachments.map((attachment, index) => (
                    <div key={index} className="text-sm">{attachment}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Message:</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {isHtml(email.message) ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: email.message }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-gray-900">
                  {email.message}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;
