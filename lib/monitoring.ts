// Monitoring and logging utilities for KwizMe application

export interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: string
  metadata?: Record<string, any>
  timestamp?: Date
  userId?: string
  sessionId?: string
}

export interface HealthMetric {
  name: string
  value: number | string | boolean
  unit?: string
  timestamp?: Date
  tags?: Record<string, string>
}

export interface PerformanceMetric {
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}

/**
 * Enhanced logging with structured data for monitoring
 */
export class Logger {
  private context: string
  private userId?: string
  private sessionId?: string

  constructor(context: string, userId?: string, sessionId?: string) {
    this.context = context
    this.userId = userId
    this.sessionId = sessionId
  }

  private log(event: Omit<LogEvent, 'context' | 'userId' | 'sessionId' | 'timestamp'>) {
    const logEvent: LogEvent = {
      ...event,
      context: this.context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date()
    }

    // Console logging with structured data
    const logMessage = `[${logEvent.level.toUpperCase()}] [${logEvent.context}] ${logEvent.message}`

    switch (logEvent.level) {
      case 'error':
        console.error(logMessage, logEvent.metadata)
        break
      case 'warn':
        console.warn(logMessage, logEvent.metadata)
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, logEvent.metadata)
        }
        break
      default:
        console.log(logMessage, logEvent.metadata)
    }

    // In production, you could send this to external logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service (e.g., Logflare, Papertrail, etc.)
    }

    return logEvent
  }

  info(message: string, metadata?: Record<string, any>) {
    return this.log({ level: 'info', message, metadata })
  }

  warn(message: string, metadata?: Record<string, any>) {
    return this.log({ level: 'warn', message, metadata })
  }

  error(message: string, metadata?: Record<string, any>) {
    return this.log({ level: 'error', message, metadata })
  }

  debug(message: string, metadata?: Record<string, any>) {
    return this.log({ level: 'debug', message, metadata })
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private startTime: number
  private operation: string
  private metadata: Record<string, any>

  constructor(operation: string, metadata: Record<string, any> = {}) {
    this.operation = operation
    this.metadata = metadata
    this.startTime = performance.now()
  }

  end(success: boolean = true, additionalMetadata: Record<string, any> = {}): PerformanceMetric {
    const duration = performance.now() - this.startTime

    const metric: PerformanceMetric = {
      operation: this.operation,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      success,
      timestamp: new Date(),
      metadata: { ...this.metadata, ...additionalMetadata }
    }

    // Log performance metric
    const logger = new Logger('performance')
    logger.info(`Operation ${this.operation} completed`, {
      duration: metric.duration,
      success: metric.success,
      ...metric.metadata
    })

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (e.g., DataDog, New Relic, etc.)
    }

    return metric
  }
}

/**
 * System health metrics collector
 */
export class HealthCollector {
  static collectSystemMetrics(): HealthMetric[] {
    const metrics: HealthMetric[] = []

    try {
      // Memory usage
      const memUsage = process.memoryUsage()
      metrics.push({
        name: 'memory_heap_used',
        value: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        unit: 'MB',
        timestamp: new Date()
      })

      metrics.push({
        name: 'memory_heap_total',
        value: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        unit: 'MB',
        timestamp: new Date()
      })

      // Process uptime
      metrics.push({
        name: 'process_uptime',
        value: Math.round(process.uptime()),
        unit: 'seconds',
        timestamp: new Date()
      })

      // Environment
      metrics.push({
        name: 'node_environment',
        value: process.env.NODE_ENV || 'unknown',
        timestamp: new Date()
      })

    } catch (error) {
      console.error('Failed to collect system metrics:', error)
    }

    return metrics
  }

  static async collectDatabaseMetrics(): Promise<HealthMetric[]> {
    const metrics: HealthMetric[] = []

    try {
      // Test database connectivity
      const startTime = performance.now()
      const response = await fetch('/api/health/db')
      const responseTime = performance.now() - startTime

      metrics.push({
        name: 'database_response_time',
        value: Math.round(responseTime * 100) / 100,
        unit: 'ms',
        timestamp: new Date(),
        tags: { status: response.ok ? 'healthy' : 'unhealthy' }
      })

      metrics.push({
        name: 'database_status',
        value: response.ok,
        timestamp: new Date()
      })

    } catch (error) {
      metrics.push({
        name: 'database_status',
        value: false,
        timestamp: new Date(),
        tags: { error: 'connection_failed' }
      })
    }

    return metrics
  }
}

/**
 * Error tracking and incident management
 */
export class IncidentTracker {
  static async trackError(error: Error, context: string, metadata?: Record<string, any>) {
    const logger = new Logger('incident')

    const incident = {
      message: error.message,
      stack: error.stack,
      context,
      metadata,
      timestamp: new Date(),
      severity: 'error' as const
    }

    logger.error(`Incident tracked: ${error.message}`, incident)

    // In production, send Discord alert for critical errors via API route
    if (process.env.NODE_ENV === 'production') {
      try {
        const errorAlertResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify-error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorType: 'critical',
            title: `System Error: ${context}`,
            message: error.message,
            errorCode: metadata?.errorCode,
            context: context,
            stack: error.stack,
            userId: metadata?.userId,
            userEmail: metadata?.userEmail,
            sessionId: metadata?.sessionId
          })
        })

        if (errorAlertResponse.ok) {
          logger.info('Error alert sent successfully to Discord')
        } else {
          logger.warn('Error alert API call failed', { status: errorAlertResponse.status })
        }
      } catch (discordError) {
        logger.warn('Failed to send Discord incident alert', { discordError: discordError instanceof Error ? discordError.message : discordError });
      }

      // TODO: Send to other incident management systems (e.g., PagerDuty, OpsGenie, etc.)
    }

    return incident
  }

  static async trackWarning(message: string, context: string, metadata?: Record<string, any>) {
    const logger = new Logger('incident')

    const incident = {
      message,
      context,
      metadata,
      timestamp: new Date(),
      severity: 'warning' as const
    }

    logger.warn(`Warning tracked: ${message}`, incident)

    // In production, send Discord alert for warnings via API route
    if (process.env.NODE_ENV === 'production') {
      try {
        const warningAlertResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notify-error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorType: 'warning',
            title: `System Warning: ${context}`,
            message: message,
            errorCode: metadata?.errorCode,
            context: context,
            userId: metadata?.userId,
            sessionId: metadata?.sessionId
          })
        })

        if (warningAlertResponse.ok) {
          logger.info('Warning alert sent successfully to Discord')
        } else {
          logger.warn('Warning alert API call failed', { status: warningAlertResponse.status })
        }
      } catch (discordError) {
        logger.warn('Failed to send Discord warning alert', { discordError: discordError instanceof Error ? discordError.message : discordError });
      }
    }

    return incident
  }
}

/**
 * Utility function to measure API endpoint performance
 */
export function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const monitor = new PerformanceMonitor(operation, metadata)

  return fn()
    .then(result => {
      monitor.end(true)
      return result
    })
    .catch(error => {
      monitor.end(false, { error: error.message })
      throw error
    })
}

/**
 * Create a logger instance with context
 */
export function createLogger(context: string, userId?: string, sessionId?: string): Logger {
  return new Logger(context, userId, sessionId)
}

// Default exports for common use cases
export const systemLogger = new Logger('system')
export const apiLogger = new Logger('api')
export const dbLogger = new Logger('database')