# Advanced Monitoring and Observability

Comprehensive guide to monitoring, logging, and observability in GRA Core Platform applications.

## Overview

This guide covers advanced monitoring techniques including:
- Application Performance Monitoring (APM)
- Distributed tracing
- Custom metrics and alerting
- Log aggregation and analysis
- Health checks and uptime monitoring
- Error tracking and debugging

## Application Performance Monitoring

### Custom APM Implementation

\`\`\`javascript
import { AsyncLocalStorage } from 'async_hooks'
import { performance } from 'perf_hooks'

class APMTracer {
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage()
    this.traces = new Map()
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      performance: new Map()
    }
  }
  
  // Start a new trace
  startTrace(name, metadata = {}) {
    const traceId = this.generateTraceId()
    const trace = {
      id: traceId,
      name,
      startTime: performance.now(),
      metadata,
      spans: [],
      status: 'active'
    }
    
    this.traces.set(traceId, trace)
    
    // Store in async context
    this.asyncLocalStorage.run({ traceId }, () => {})
    
    return traceId
  }
  
  // Add a span to current trace
  addSpan(name, operation, metadata = {}) {
    const context = this.asyncLocalStorage.getStore()
    if (!context?.traceId) return null
    
    const trace = this.traces.get(context.traceId)
    if (!trace) return null
    
    const spanId = this.generateSpanId()
    const span = {
      id: spanId,
      name,
      operation,
      startTime: performance.now(),
      metadata,
      status: 'active'
    }
    
    trace.spans.push(span)
    return spanId
  }
  
  // End a span
  endSpan(spanId, status = 'success', error = null) {
    const context = this.asyncLocalStorage.getStore()
    if (!context?.traceId) return
    
    const trace = this.traces.get(context.traceId)
    if (!trace) return
    
    const span = trace.spans.find(s => s.id === spanId)
    if (!span) return
    
    span.endTime = performance.now()
    span.duration = span.endTime - span.startTime
    span.status = status
    
    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      }
    }
    
    // Record metrics
    this.recordSpanMetrics(span)
  }
  
  // End a trace
  endTrace(traceId, status = 'success') {
    const trace = this.traces.get(traceId)
    if (!trace) return
    
    trace.endTime = performance.now()
    trace.duration = trace.endTime - trace.startTime
    trace.status = status
    
    // Record trace metrics
    this.recordTraceMetrics(trace)
    
    // Clean up old traces
    setTimeout(() => {
      this.traces.delete(traceId)
    }, 300000) // Keep for 5 minutes
  }
  
  recordSpanMetrics(span) {
    const key = `${span.operation}:${span.name}`
    
    if (!this.metrics.performance.has(key)) {
      this.metrics.performance.set(key, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0
      })
    }
    
    const metrics = this.metrics.performance.get(key)
    metrics.count++
    metrics.totalDuration += span.duration
    metrics.minDuration = Math.min(metrics.minDuration, span.duration)
    metrics.maxDuration = Math.max(metrics.maxDuration, span.duration)
    
    if (span.status === 'error') {
      metrics.errors++
    }
  }
  
  recordTraceMetrics(trace) {
    if (!this.metrics.requests.has(trace.name)) {
      this.metrics.requests.set(trace.name, {
        count: 0,
        totalDuration: 0,
        errors: 0
      })
    }
    
    const metrics = this.metrics.requests.get(trace.name)
    metrics.count++
    metrics.totalDuration += trace.duration
    
    if (trace.status === 'error') {
      metrics.errors++
    }
  }
  
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  getMetrics() {
    const result = {}
    
    // Convert performance metrics
    for (const [key, metrics] of this.metrics.performance) {
      result[key] = {
        ...metrics,
        avgDuration: metrics.totalDuration / metrics.count,
        errorRate: metrics.errors / metrics.count
      }
    }
    
    return result
  }
}

const apmTracer = new APMTracer()
\`\`\`

### Middleware Integration

\`\`\`javascript
// Express middleware for automatic tracing
function apmMiddleware(req, res, next) {
  const traceId = apmTracer.startTrace(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })
  
  req.traceId = traceId
  
  // Override res.json to capture response
  const originalJson = res.json
  res.json = function(data) {
    apmTracer.endTrace(traceId, res.statusCode >= 400 ? 'error' : 'success')
    return originalJson.call(this, data)
  }
  
  // Handle errors
  res.on('error', (error) => {
    apmTracer.endTrace(traceId, 'error')
  })
  
  next()
}

// Database operation tracing
class TracedDatabase {
  constructor(db) {
    this.db = db
  }
  
  async find(collection, query) {
    const spanId = apmTracer.addSpan('database', 'find', {
      collection,
      query: JSON.stringify(query)
    })
    
    try {
      const result = await this.db.collection(collection).find(query).toArray()
      apmTracer.endSpan(spanId, 'success')
      return result
    } catch (error) {
      apmTracer.endSpan(spanId, 'error', error)
      throw error
    }
  }
  
  async insert(collection, document) {
    const spanId = apmTracer.addSpan('database', 'insert', {
      collection,
      documentSize: JSON.stringify(document).length
    })
    
    try {
      const result = await this.db.collection(collection).insertOne(document)
      apmTracer.endSpan(spanId, 'success')
      return result
    } catch (error) {
      apmTracer.endSpan(spanId, 'error', error)
      throw error
    }
  }
}
\`\`\`

## Distributed Tracing

### OpenTelemetry Integration

\`\`\`javascript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

// Initialize OpenTelemetry
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'gra-core-platform',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()

// Custom tracing for business logic
import { trace, context } from '@opentelemetry/api'

class BusinessLogicTracer {
  constructor() {
    this.tracer = trace.getTracer('business-logic', '1.0.0')
  }
  
  async traceUserOperation(operationName, userId, operation) {
    return await this.tracer.startActiveSpan(operationName, async (span) => {
      try {
        // Add attributes
        span.setAttributes({
          'user.id': userId,
          'operation.type': operationName
        })
        
        const result = await operation()
        
        span.setStatus({ code: trace.SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error)
        span.setStatus({
          code: trace.SpanStatusCode.ERROR,
          message: error.message
        })
        throw error
      } finally {
        span.end()
      }
    })
  }
  
  // Decorator for automatic tracing
  trace(operationName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args) {
        return await this.tracer.startActiveSpan(
          `${target.constructor.name}.${propertyKey}`,
          async (span) => {
            try {
              span.setAttributes({
                'method.name': propertyKey,
                'class.name': target.constructor.name,
                'operation.name': operationName
              })
              
              const result = await originalMethod.apply(this, args)
              span.setStatus({ code: trace.SpanStatusCode.OK })
              return result
            } catch (error) {
              span.recordException(error)
              span.setStatus({
                code: trace.SpanStatusCode.ERROR,
                message: error.message
              })
              throw error
            } finally {
              span.end()
            }
          }
        )
      }
      
      return descriptor
    }
  }
}

const businessTracer = new BusinessLogicTracer()

// Usage example
class UserService {
  @businessTracer.trace('user-registration')
  async registerUser(userData) {
    // Business logic here
    const user = await this.createUser(userData)
    await this.sendWelcomeEmail(user.email)
    return user
  }
}
\`\`\`

## Custom Metrics and Alerting

### Metrics Collection

\`\`\`javascript
import client from 'prom-client'

class MetricsCollector {
  constructor() {
    // Create a Registry
    this.register = new client.Registry()
    
    // Add default metrics
    client.collectDefaultMetrics({ register: this.register })
    
    // Custom metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    })
    
    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    })
    
    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    })
    
    this.databaseQueryDuration = new client.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    })
    
    this.businessMetrics = new client.Counter({
      name: 'business_events_total',
      help: 'Total number of business events',
      labelNames: ['event_type', 'status']
    })
    
    // Register metrics
    this.register.registerMetric(this.httpRequestDuration)
    this.register.registerMetric(this.httpRequestTotal)
    this.register.registerMetric(this.activeConnections)
    this.register.registerMetric(this.databaseQueryDuration)
    this.register.registerMetric(this.businessMetrics)
  }
  
  recordHttpRequest(method, route, statusCode, duration) {
    this.httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration)
    
    this.httpRequestTotal
      .labels(method, route, statusCode)
      .inc()
  }
  
  recordDatabaseQuery(operation, collection, duration) {
    this.databaseQueryDuration
      .labels(operation, collection)
      .observe(duration)
  }
  
  recordBusinessEvent(eventType, status = 'success') {
    this.businessMetrics
      .labels(eventType, status)
      .inc()
  }
  
  setActiveConnections(count) {
    this.activeConnections.set(count)
  }
  
  getMetrics() {
    return this.register.metrics()
  }
}

const metricsCollector = new MetricsCollector()

// Middleware to collect HTTP metrics
function metricsMiddleware(req, res, next) {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    metricsCollector.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    )
  })
  
  next()
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.end(await metricsCollector.getMetrics())
})
\`\`\`

### Alerting System

\`\`\`javascript
class AlertingSystem {
  constructor() {
    this.rules = new Map()
    this.alertHistory = []
    this.webhooks = []
    this.checkInterval = 60000 // 1 minute
    
    this.startMonitoring()
  }
  
  addRule(name, condition, severity = 'warning', description = '') {
    this.rules.set(name, {
      name,
      condition,
      severity,
      description,
      lastTriggered: null,
      isActive: false
    })
  }
  
  addWebhook(url, headers = {}) {
    this.webhooks.push({ url, headers })
  }
  
  startMonitoring() {
    setInterval(async () => {
      await this.checkRules()
    }, this.checkInterval)
  }
  
  async checkRules() {
    const metrics = await this.getMetrics()
    
    for (const [name, rule] of this.rules) {
      try {
        const isTriggered = await rule.condition(metrics)
        
        if (isTriggered && !rule.isActive) {
          // Rule triggered
          rule.isActive = true
          rule.lastTriggered = new Date()
          await this.triggerAlert(rule)
        } else if (!isTriggered && rule.isActive) {
          // Rule resolved
          rule.isActive = false
          await this.resolveAlert(rule)
        }
      } catch (error) {
        console.error(`Error checking rule ${name}:`, error)
      }
    }
  }
  
  async triggerAlert(rule) {
    const alert = {
      id: this.generateAlertId(),
      rule: rule.name,
      severity: rule.severity,
      description: rule.description,
      timestamp: new Date(),
      status: 'triggered'
    }
    
    this.alertHistory.push(alert)
    
    // Send notifications
    await this.sendNotifications(alert)
    
    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`)
  }
  
  async resolveAlert(rule) {
    const alert = {
      id: this.generateAlertId(),
      rule: rule.name,
      severity: 'info',
      description: `${rule.description} - RESOLVED`,
      timestamp: new Date(),
      status: 'resolved'
    }
    
    this.alertHistory.push(alert)
    
    // Send resolution notifications
    await this.sendNotifications(alert)
    
    console.log(`✅ Alert resolved: ${rule.name}`)
  }
  
  async sendNotifications(alert) {
    const payload = {
      alert: alert.rule,
      severity: alert.severity,
      description: alert.description,
      timestamp: alert.timestamp,
      status: alert.status
    }
    
    const promises = this.webhooks.map(webhook => 
      this.sendWebhook(webhook, payload)
    )
    
    await Promise.allSettled(promises)
  }
  
  async sendWebhook(webhook, payload) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Webhook notification failed:', error)
    }
  }
  
  async getMetrics() {
    // Get metrics from various sources
    const httpMetrics = await this.getHttpMetrics()
    const dbMetrics = await this.getDatabaseMetrics()
    const systemMetrics = await this.getSystemMetrics()
    
    return {
      http: httpMetrics,
      database: dbMetrics,
      system: systemMetrics
    }
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Setup alerting rules
const alerting = new AlertingSystem()

// High error rate alert
alerting.addRule(
  'high_error_rate',
  async (metrics) => {
    const errorRate = metrics.http.errorRate || 0
    return errorRate > 0.05 // 5% error rate
  },
  'critical',
  'HTTP error rate is above 5%'
)

// High response time alert
alerting.addRule(
  'high_response_time',
  async (metrics) => {
    const avgResponseTime = metrics.http.avgResponseTime || 0
    return avgResponseTime > 2000 // 2 seconds
  },
  'warning',
  'Average HTTP response time is above 2 seconds'
)

// Database connection alert
alerting.addRule(
  'database_connection_issues',
  async (metrics) => {
    const dbErrorRate = metrics.database.errorRate || 0
    return dbErrorRate > 0.01 // 1% database error rate
  },
  'critical',
  'Database error rate is above 1%'
)

// Memory usage alert
alerting.addRule(
  'high_memory_usage',
  async (metrics) => {
    const memoryUsage = metrics.system.memoryUsage || 0
    return memoryUsage > 0.9 // 90% memory usage
  },
  'warning',
  'Memory usage is above 90%'
)

// Add webhook for Slack notifications
alerting.addWebhook('https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', {
  'Authorization': 'Bearer your-token'
})
\`\`\`

## Next Steps

- Learn about [GCP Monitoring Integration](../06_GCP%20Feature%20InDepth/gcp-monitoring.md)
- Explore [Real-time Analytics](../06_GCP%20Feature%20InDepth/real-time-analytics.md)
- Check out [Incident Response](../06_GCP%20Feature%20InDepth/incident-response.md)
