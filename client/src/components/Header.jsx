import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaServer, FaClock, FaExclamationCircle } from 'react-icons/fa'
import { motion } from 'framer-motion'
import io from 'socket.io-client'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [systemInfo, setSystemInfo] = useState({
    uptime: '0:00:00',
    serverStatus: 'offline'
  })
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let socket = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectDelay = 1000

    const connectSocket = () => {
      socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectDelay,
        timeout: 5000,
        transports: ['websocket', 'polling']
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
        setSystemInfo(prev => ({
          ...prev,
          serverStatus: 'online'
        }))
        reconnectAttempts = 0
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        setIsConnected(false)
        setSystemInfo(prev => ({
          ...prev,
          serverStatus: 'offline'
        }))
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setIsConnected(false)
        setSystemInfo(prev => ({
          ...prev,
          serverStatus: 'offline'
        }))
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt:', attemptNumber)
        reconnectAttempts = attemptNumber
      })

      socket.on('reconnect_failed', () => {
        console.log('Reconnection failed')
        setIsConnected(false)
        setSystemInfo(prev => ({
          ...prev,
          serverStatus: 'offline'
        }))
      })
      
      socket.on('systemInfo', (data) => {
        if (data) {
          setSystemInfo(prev => ({
            ...prev,
            uptime: data.uptime || '0:00:00',
            serverStatus: 'online'
          }))
        }
      })

      // Request initial system info
      socket.emit('requestSystemInfo')
    }

    connectSocket()

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const isActive = (path) => {
    return location.pathname === path;
  };

  const ServerStatusIndicator = () => (
    <div className={`flex items-center space-x-2 ${isScrolled ? 'text-[#64748B]' : 'text-white'}`}>
      <FaServer className="text-lg" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">Server Status</span>
        <div className="flex items-center space-x-1">
          <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Online' : 'Offline'}
          </span>
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center text-red-500"
            >
              <FaExclamationCircle className="text-xs mr-1" />
              <span className="text-xs">No connection</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-lg' 
          : 'bg-[#F97316]'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isScrolled ? 'bg-[#F97316]' : 'bg-white'
                }`}
              >
                <span className={`text-xl font-bold ${isScrolled ? 'text-white' : 'text-[#F97316]'}`}>
                  PM
                </span>
              </motion.div>
              <span className={`text-xl font-bold ${isScrolled ? 'text-[#1E293B]' : 'text-white'}`}>
                Process Monitor
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/logs"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/logs')
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Logs
              </Link>
              <Link
                to="/help"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/help')
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Help
              </Link>
            </nav>
          </div>

          {/* System Info */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Server Status */}
            <ServerStatusIndicator />

            {/* Uptime */}
            <div className={`flex items-center space-x-2 ${isScrolled ? 'text-[#64748B]' : 'text-white'}`}>
              <FaClock className="text-lg" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-xs">{systemInfo.uptime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header
