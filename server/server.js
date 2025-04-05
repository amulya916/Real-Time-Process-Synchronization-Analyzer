const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const si = require('systeminformation');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Process synchronization tracking
let processSyncStatus = {
  lastSyncTime: Date.now(),
  syncStatus: 'active',
  syncErrors: [],
  syncMetrics: {
    totalProcesses: 0,
    synchronizedProcesses: 0,
    failedProcesses: 0,
    syncLatency: 0
  }
};

// Track server start time
const serverStartTime = Date.now();

// Notification tracking
let notifications = [];
const MAX_NOTIFICATIONS = 50;

// Track recent notifications to prevent duplicates
const recentNotifications = new Map();
const NOTIFICATION_EXPIRY = 60000; // 1 minute expiry for duplicate prevention
const MAX_RECENT_NOTIFICATIONS = 100; // Maximum number of recent notifications to track

// Memory notification tracking
let lastMemoryNotification = 0;
const MEMORY_NOTIFICATION_COOLDOWN = 300000; // 5 minutes cooldown
const MEMORY_THRESHOLD_CHANGE = 5; // Only notify if memory usage changes by 5% or more

function addNotification(type, message) {
  const notification = {
    id: Date.now(),
    type,
    message,
    timestamp: Date.now()
  };
  
  // Check for duplicates before adding
  if (!isDuplicateNotification(notification)) {
    notifications.unshift(notification);
    if (notifications.length > MAX_NOTIFICATIONS) {
      notifications.pop();
    }
    
    // Emit to all connected clients
    io.emit('newNotification', notification);
  }
}

// Function to format uptime
function formatUptime() {
  const uptime = Date.now() - serverStartTime;
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Function to check if a notification is a duplicate
const isDuplicateNotification = (notification) => {
  const key = `${notification.type}-${notification.message}`;
  const existing = recentNotifications.get(key);
  
  if (existing) {
    // If notification exists and is less than 1 minute old, it's a duplicate
    if (Date.now() - existing.timestamp < NOTIFICATION_EXPIRY) {
      return true;
    }
  }
  
  // Add or update the notification timestamp
  recentNotifications.set(key, {
    timestamp: Date.now(),
    notification
  });
  
  // Clean up old notifications if we exceed the maximum
  if (recentNotifications.size > MAX_RECENT_NOTIFICATIONS) {
    const now = Date.now();
    for (const [key, value] of recentNotifications.entries()) {
      if (now - value.timestamp > NOTIFICATION_EXPIRY) {
        recentNotifications.delete(key);
      }
    }
  }
  
  return false;
}

// Function to get system metrics
async function getSystemMetrics() {
  try {
    const [cpu, mem, processes] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.processes()
    ]);

    // Calculate memory usage percentage
    const memoryUsagePercent = ((mem.total - mem.available) / mem.total) * 100;

    // Check for high CPU usage
    if (cpu.currentLoad > 90) {
      addNotification('warning', `High CPU usage detected: ${Math.round(cpu.currentLoad)}%`);
    }

    // Check for high memory usage with throttling
    const now = Date.now();
    if (memoryUsagePercent > 90 && 
        (now - lastMemoryNotification > MEMORY_NOTIFICATION_COOLDOWN)) {
      addNotification('warning', `High memory usage detected: ${Math.round(memoryUsagePercent)}%`);
      lastMemoryNotification = now;
    }

    // Process the list of processes to get relevant information
    const processDetails = processes.list
      .sort((a, b) => b.cpu - a.cpu) // Sort by CPU usage
      .slice(0, 50) // Get top 50 processes
      .map(proc => ({
        id: proc.pid,
        name: proc.name,
        cpu: proc.cpu.toFixed(1),
        memory: Math.round(proc.memRss / (1024 * 1024)), // Convert to MB
        status: proc.state || 'unknown' // Ensure we have a fallback value
      }));

    return {
      cpuUsage: Math.round(cpu.currentLoad),
      memoryUsage: Math.round(memoryUsagePercent),
      activeProcesses: processes.all,
      processes: processDetails
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    addNotification('error', 'Failed to fetch system metrics');
    return null;
  }
}

// Function to get system info
function getSystemInfo() {
  return {
    uptime: formatUptime(),
    serverStatus: 'online',
    notifications: notifications.length,
    recentNotifications: notifications.slice(0, 5) // Send last 5 notifications
  };
}

// Update the system metrics monitoring
const monitorSystemMetrics = async () => {
  const metrics = await getSystemMetrics();
  
  // Check for high CPU usage
  if (metrics.cpuUsage > 80) {
    addNotification('warning', `High CPU usage: ${Math.round(metrics.cpuUsage)}%`);
  }
  
  // Check for high memory usage with throttling
  const now = Date.now();
  if (metrics.memoryUsage > 80 && 
      (now - lastMemoryNotification > MEMORY_NOTIFICATION_COOLDOWN)) {
    addNotification('warning', `High memory usage: ${Math.round(metrics.memoryUsage)}%`);
    lastMemoryNotification = now;
  }
  
  // Emit system metrics
  io.emit('systemMetrics', metrics);
};

// Function to kill a process
async function killProcess(pid) {
  try {
    // On Windows, use taskkill
    if (process.platform === 'win32') {
      await execPromise(`taskkill /F /PID ${pid}`);
    } else {
      // On Unix-like systems, use kill
      await execPromise(`kill -9 ${pid}`);
    }
    return { success: true, message: `Process ${pid} killed successfully` };
  } catch (error) {
    console.error(`Error killing process ${pid}:`, error);
    return { success: false, message: `Failed to kill process ${pid}: ${error.message}` };
  }
}

// Process synchronization monitoring
async function monitorProcessSynchronization() {
  try {
    console.log('Monitoring process synchronization...');
    const processes = await si.processes();
    
    // Ensure we have valid process data
    if (!processes || !processes.list || !Array.isArray(processes.list)) {
      throw new Error('Invalid process data received');
    }

    // Get process counts with proper error handling
    const totalProcesses = processes.list.length;
    
    // On Windows, we'll consider all valid processes as synchronized
    const synchronizedProcesses = processes.list.filter(p => p.pid > 0).length;
    const failedProcesses = totalProcesses - synchronizedProcesses;

    console.log('Process counts:', {
      total: totalProcesses,
      synchronized: synchronizedProcesses,
      failed: failedProcesses
    });

    // Calculate sync latency (simulated for now)
    const syncLatency = Math.random() * 100;

    // Update process sync status
    processSyncStatus = {
      lastSyncTime: Date.now(),
      syncStatus: failedProcesses > 0 ? 'warning' : 'active',
      syncErrors: failedProcesses > 0 ? ['Some processes are not synchronized'] : [],
      syncMetrics: {
        totalProcesses,
        synchronizedProcesses,
        failedProcesses,
        syncLatency: Math.round(syncLatency)
      }
    };

    console.log('Emitting process sync status:', processSyncStatus);
    // Emit synchronization status to all connected clients
    io.emit('processSyncStatus', processSyncStatus);

    // Add notifications for significant changes
    if (failedProcesses > 0) {
      addNotification('warning', `${failedProcesses} processes are not synchronized`);
    }
  } catch (error) {
    console.error('Error monitoring process synchronization:', error);
    addNotification('error', 'Failed to monitor process synchronization');
    
    // Emit error status to clients
    io.emit('processSyncStatus', {
      lastSyncTime: Date.now(),
      syncStatus: 'error',
      syncErrors: ['Failed to monitor processes'],
      syncMetrics: {
        totalProcesses: 0,
        synchronizedProcesses: 0,
        failedProcesses: 0,
        syncLatency: 0
      }
    });
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  let metricsInterval;
  let systemInfoInterval;
  let syncInterval;

  // Send initial data
  getSystemMetrics().then(metrics => {
    if (metrics) {
      socket.emit('systemMetrics', metrics);
    }
  });

  // Send initial system info
  socket.emit('systemInfo', getSystemInfo());

  // Send initial process sync status
  socket.emit('processSyncStatus', processSyncStatus);

  // Set up interval for real-time metrics updates
  metricsInterval = setInterval(async () => {
    const metrics = await getSystemMetrics();
    if (metrics) {
      socket.emit('systemMetrics', metrics);
    }
  }, 2000);

  // Set up interval for system info updates
  systemInfoInterval = setInterval(() => {
    socket.emit('systemInfo', getSystemInfo());
  }, 1000);

  // Set up interval for process synchronization monitoring
  syncInterval = setInterval(() => {
    monitorProcessSynchronization();
  }, 5000);

  // Handle system info requests
  socket.on('requestSystemInfo', () => {
    socket.emit('systemInfo', getSystemInfo());
  });

  // Handle notification acknowledgment
  socket.on('acknowledgeNotification', (notificationId) => {
    notifications = notifications.filter(n => n.id !== notificationId);
    io.emit('systemInfo', getSystemInfo());
  });

  // Handle process kill request
  socket.on('killProcess', async (pid) => {
    try {
      const result = await killProcess(pid);
      if (result.success) {
        addNotification('info', result.message);
      } else {
        addNotification('error', result.message);
      }
      // Refresh system metrics after killing the process
      const metrics = await getSystemMetrics();
      if (metrics) {
        io.emit('systemMetrics', metrics);
      }
    } catch (error) {
      console.error('Error handling process kill request:', error);
      addNotification('error', 'Failed to kill process');
    }
  });

  // Handle process sync request
  socket.on('requestProcessSync', async () => {
    await monitorProcessSynchronization();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(metricsInterval);
    clearInterval(systemInfoInterval);
    clearInterval(syncInterval);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  addNotification('info', 'Server started successfully');
}); 