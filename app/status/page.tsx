'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Database, Server, Shield } from 'lucide-react'

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime?: number
  environment?: string
  version?: string
  memory?: {
    used: number
    total: number
    external: number
  }
  responseTime?: number
  warnings?: string[]
}

interface DBHealthData {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  database: {
    status: string
    responseTime: number
    recordCount?: string | number
    error?: string
  }
  auth: {
    status: string
    error?: string
  }
  supabase: {
    url: string
    key: string
  }
  error?: string
}

export default function SystemStatusPage() {
  const [systemHealth, setSystemHealth] = useState<HealthData | null>(null)
  const [dbHealth, setDbHealth] = useState<DBHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchHealthData = async () => {
    try {
      setLoading(true)

      // Fetch both health endpoints in parallel
      const [systemResponse, dbResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/db')
      ])

      const systemData = await systemResponse.json()
      const dbData = await dbResponse.json()

      setSystemHealth(systemData)
      setDbHealth(dbData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'configured':
        return 'text-green-600 dark:text-green-400'
      case 'degraded':
      case 'error':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'unhealthy':
      case 'missing':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'configured':
        return <CheckCircle className="w-5 h-5" />
      case 'degraded':
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'unhealthy':
      case 'missing':
        return <XCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const overallStatus = systemHealth?.status === 'healthy' && dbHealth?.status === 'healthy'
    ? 'All Systems Operational'
    : systemHealth?.status === 'degraded' || dbHealth?.status === 'unhealthy'
    ? 'System Issues Detected'
    : 'System Offline'

  const overallStatusColor = systemHealth?.status === 'healthy' && dbHealth?.status === 'healthy'
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            QuizMe System Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time system health and performance monitoring
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={overallStatusColor}>
                {getStatusIcon(systemHealth?.status === 'healthy' && dbHealth?.status === 'healthy' ? 'healthy' : 'unhealthy')}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {overallStatus}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={fetchHealthData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Server className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
            </div>

            {systemHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <div className={`flex items-center space-x-2 ${getStatusColor(systemHealth.status)}`}>
                    {getStatusIcon(systemHealth.status)}
                    <span className="capitalize font-medium">{systemHealth.status}</span>
                  </div>
                </div>

                {systemHealth.uptime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="font-mono">{formatUptime(systemHealth.uptime)}</span>
                  </div>
                )}

                {systemHealth.responseTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="font-mono">{systemHealth.responseTime}ms</span>
                  </div>
                )}

                {systemHealth.memory && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                    <span className="font-mono">{systemHealth.memory.used}MB / {systemHealth.memory.total}MB</span>
                  </div>
                )}

                {systemHealth.environment && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Environment</span>
                    <span className="font-mono capitalize">{systemHealth.environment}</span>
                  </div>
                )}

                {systemHealth.warnings && systemHealth.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Warnings:</h4>
                    {systemHealth.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Database Health */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database Health</h3>
            </div>

            {dbHealth ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Database</span>
                  <div className={`flex items-center space-x-2 ${getStatusColor(dbHealth.database.status)}`}>
                    {getStatusIcon(dbHealth.database.status)}
                    <span className="capitalize font-medium">{dbHealth.database.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Auth Service</span>
                  <div className={`flex items-center space-x-2 ${getStatusColor(dbHealth.auth.status)}`}>
                    {getStatusIcon(dbHealth.auth.status)}
                    <span className="capitalize font-medium">{dbHealth.auth.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Response Time</span>
                  <span className="font-mono">{dbHealth.database.responseTime}ms</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Configuration</span>
                  <div className={`flex items-center space-x-2 ${getStatusColor(dbHealth.supabase.url === 'configured' && dbHealth.supabase.key === 'configured' ? 'configured' : 'missing')}`}>
                    {getStatusIcon(dbHealth.supabase.url === 'configured' && dbHealth.supabase.key === 'configured' ? 'configured' : 'missing')}
                    <span className="font-medium">
                      {dbHealth.supabase.url === 'configured' && dbHealth.supabase.key === 'configured' ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>

                {(dbHealth.database.error || dbHealth.auth.error) && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                    {dbHealth.database.error && (
                      <p className="text-sm text-red-700 dark:text-red-300">Database: {dbHealth.database.error}</p>
                    )}
                    {dbHealth.auth.error && (
                      <p className="text-sm text-red-700 dark:text-red-300">Auth: {dbHealth.auth.error}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Status</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Web Application</p>
              <p className="text-xs text-green-600">Operational</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">API Services</p>
              <p className="text-xs text-green-600">Operational</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">File Processing</p>
              <p className="text-xs text-green-600">Operational</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">AI Generation</p>
              <p className="text-xs text-green-600">Operational</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Status page automatically refreshes every 30 seconds
          </p>
          <p className="text-xs mt-1">
            For support, please contact the development team
          </p>
        </div>
      </div>
    </div>
  )
}