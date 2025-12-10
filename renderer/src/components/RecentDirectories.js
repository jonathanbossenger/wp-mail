import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';

const RecentDirectories = ({ directories, onSelect }) => {
  if (!directories || directories.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Sites:</h3>
      <div className="space-y-2">
        {directories.map((dir, index) => (
          <button
            key={index}
            onClick={() => onSelect(dir)}
            className="w-full flex items-center px-4 py-2 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-indigo-500 transition-colors duration-200"
          >
            <FolderIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            <span className="truncate">{dir}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentDirectories;
