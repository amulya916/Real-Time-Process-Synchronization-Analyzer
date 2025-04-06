import React, { useState, useEffect } from 'react';

const SyncTimeline = ({ syncStatus }) => {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    setTimeline(prev => [
      {
        time: new Date(syncStatus.lastSyncTime),
        status: syncStatus.syncStatus,
        metrics: syncStatus.syncMetrics
      },
      ...prev.slice(0, 9) // Keep last 10 entries
    ]);
  }, [syncStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Synchronization Timeline</h2>
      
      <div className="space-y-4">
        {timeline.map((entry, index) => (
          <div key={index} className="flex items-start">
            <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(entry.status)}`}></div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between">
                <span className="text-gray-800 font-medium">
                  {entry.time.toLocaleTimeString()}
                </span>
                <span className="text-sm text-gray-500">
                  {entry.metrics.synchronizedProcesses}/{entry.metrics.totalProcesses} synchronized
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                <p>Latency: {entry.metrics.syncLatency}ms</p>
                {entry.metrics.failedProcesses > 0 && (
                  <p className="text-red-600">
                    {entry.metrics.failedProcesses} processes failed
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyncTimeline; 