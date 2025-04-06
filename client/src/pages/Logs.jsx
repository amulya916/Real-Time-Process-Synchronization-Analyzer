import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const Logs = () => {
  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('processSyncStatus', (status) => {
      const newLog = {
        timestamp: new Date(status.lastSyncTime),
        status: status.syncStatus,
        metrics: status.syncMetrics,
        errors: status.syncErrors
      };
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = searchTerm === '' || 
      log.errors.some(error => error.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Process Synchronization Logs</h1>
        <p className="text-gray-600">Detailed logs of process synchronization events</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search logs..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setFilter('warning')}
          >
            Warning
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === 'error' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setFilter('error')}
          >
            Error
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metrics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Total: {log.metrics.totalProcesses}</div>
                      <div>Synced: {log.metrics.synchronizedProcesses}</div>
                      <div>Failed: {log.metrics.failedProcesses}</div>
                      <div>Latency: {log.metrics.syncLatency}ms</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.errors.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {log.errors.map((error, i) => (
                          <li key={i} className="text-red-600">{error}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-green-600">No errors</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs; 