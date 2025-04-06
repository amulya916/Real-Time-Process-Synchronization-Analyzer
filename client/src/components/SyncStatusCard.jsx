import React from 'react';

const SyncStatusCard = ({ status, lastSyncTime, onSyncRequest }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return 'All processes synchronized';
      case 'warning':
        return 'Some processes need attention';
      case 'error':
        return 'Synchronization issues detected';
      default:
        return 'Status unknown';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Synchronization Status</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600">Last synchronized:</p>
        <p className="text-lg font-medium">{formatTime(lastSyncTime)}</p>
      </div>

      <button
        onClick={onSyncRequest}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        Sync Now
      </button>
    </div>
  );
};

export default SyncStatusCard; 