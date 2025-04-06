import React from 'react';

const ProcessMetrics = ({ metrics }) => {
  // Ensure metrics is an object and has the required properties
  const safeMetrics = {
    totalProcesses: metrics?.totalProcesses || 0,
    synchronizedProcesses: metrics?.synchronizedProcesses || 0,
    failedProcesses: metrics?.failedProcesses || 0,
    syncLatency: metrics?.syncLatency || 0
  };

  const calculateSyncPercentage = () => {
    if (safeMetrics.totalProcesses === 0) {
      return 0;
    }
    return Math.round((safeMetrics.synchronizedProcesses / safeMetrics.totalProcesses) * 100);
  };

  const percentage = calculateSyncPercentage();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Process Metrics</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Synchronization Progress</span>
            <span className="text-gray-800 font-medium">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Total Processes</p>
            <p className="text-2xl font-bold text-gray-800">{safeMetrics.totalProcesses}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Synchronized</p>
            <p className="text-2xl font-bold text-green-600">{safeMetrics.synchronizedProcesses}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Failed</p>
            <p className="text-2xl font-bold text-red-600">{safeMetrics.failedProcesses}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-600 text-sm">Sync Latency</p>
            <p className="text-2xl font-bold text-gray-800">{safeMetrics.syncLatency}ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessMetrics; 