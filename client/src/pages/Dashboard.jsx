import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import SyncStatusCard from '../components/SyncStatusCard';
import ProcessMetrics from '../components/ProcessMetrics';
import SyncTimeline from '../components/SyncTimeline';
import NotificationsPanel from '../components/NotificationsPanel';

const Dashboard = () => {
  const [socket, setSocket] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    lastSyncTime: Date.now(),
    syncStatus: 'active',
    syncErrors: [],
    syncMetrics: {
      totalProcesses: 0,
      synchronizedProcesses: 0,
      failedProcesses: 0,
      syncLatency: 0
    }
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('processSyncStatus', (status) => {
      console.log('Received process sync status:', status);
      setSyncStatus(status);
    });

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSyncRequest = () => {
    if (socket) {
      socket.emit('requestProcessSync');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Process Synchronization Dashboard</h1>
        <p className="text-gray-600">Real-time monitoring of system processes and synchronization status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <SyncStatusCard 
          status={syncStatus.syncStatus}
          lastSyncTime={syncStatus.lastSyncTime}
          onSyncRequest={handleSyncRequest}
        />
        <ProcessMetrics metrics={syncStatus.syncMetrics} />
        <NotificationsPanel notifications={notifications} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SyncTimeline syncStatus={syncStatus} />
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Synchronization Details</h2>
          {syncStatus.syncErrors.length > 0 ? (
            <div className="space-y-2">
              {syncStatus.syncErrors.map((error, index) => (
                <div key={index} className="text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600">All processes are synchronized</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 