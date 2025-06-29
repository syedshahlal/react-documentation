import { notFound } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { TableOfContents } from "@/components/table-of-contents"
import { Badge } from "@/components/ui/badge"
import { Book, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

// This would typically come from your markdown files
const getDocContent = async (slug: string[]) => {
  const slugPath = slug.join("/")

  // Mock content - in a real app, you'd read from markdown files
  const mockContent = {
    "01_GRA_Core_Platform Introduction/introduction": {
      title: "Introduction to GRA Core Platform",
      content: `# Introduction to GRA Core Platform

Welcome to the GRA Core Platform documentation. This comprehensive guide will help you understand and implement our enterprise-grade platform.

## What is GRA Core Platform?

GRA Core Platform is a powerful, scalable solution designed for modern enterprises. It provides:

- **High Performance**: Built for scale with enterprise-grade performance
- **Security First**: Advanced security features and compliance standards
- **Developer Friendly**: Intuitive APIs and comprehensive documentation
- **Flexible Architecture**: Modular design that adapts to your needs

## Getting Started

To begin using GRA Core Platform, you'll need to:

1. Set up your development environment
2. Configure your API credentials
3. Install the required dependencies
4. Run your first example

## Key Features

### Authentication & Authorization
Secure authentication system with role-based access control.

### Real-time Data Processing
Process and analyze data in real-time with our streaming architecture.

### Scalable Infrastructure
Auto-scaling capabilities that grow with your business needs.

## Next Steps

Ready to dive deeper? Check out our [User Guide](/docs/02_User%20Guide/user-guide) or explore our [API Reference](/docs/03_API%20Reference/api-reference).`,
      lastUpdated: "2024-01-15",
    },
    "02_User Guide/user-guide": {
      title: "User Guide",
      content: `# User Guide

This comprehensive user guide will walk you through all aspects of using GRA Core Platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Operations](#basic-operations)
3. [Advanced Features](#advanced-features)
4. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A valid GRA Core Platform account
- API credentials configured

### Installation

\`\`\`bash
npm install @gra-core/platform
\`\`\`

### Basic Configuration

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: 'your-api-key',
  environment: 'production'
})
\`\`\`

## Basic Operations

### Creating Resources

Learn how to create and manage resources in the platform.

### Data Management

Understand how to efficiently manage your data with our APIs.

### Monitoring & Analytics

Set up monitoring and analytics for your applications.`,
      lastUpdated: "2024-01-14",
    },
    "03_API Reference/api-reference": {
      title: "API Reference",
      content: `# API Reference

Complete reference for all GRA Core Platform APIs.

## Authentication

All API requests require authentication using API keys.

### Headers

\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

## Endpoints

### Users API

#### GET /api/users

Retrieve a list of users.

**Parameters:**
- \`limit\` (optional): Number of users to return (default: 10)
- \`offset\` (optional): Number of users to skip (default: 0)

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
\`\`\`

#### POST /api/users

Create a new user.

**Request Body:**
\`\`\`json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
\`\`\`

### Data API

#### GET /api/data

Retrieve data from the platform.

#### POST /api/data

Submit new data to the platform.`,
      lastUpdated: "2024-01-13",
    },
    "04_Examples & Tutorials/basic-setup": {
      title: "Basic Setup Example",
      content: `# Basic Setup Example

This example shows you how to set up GRA Core Platform from scratch.

## Prerequisites

- Node.js 18+
- npm or yarn
- A GRA Core Platform account

## Step 1: Installation

\`\`\`bash
npm install @gra-core/platform
\`\`\`

## Step 2: Configuration

Create a \`.env\` file in your project root:

\`\`\`env
GRA_API_KEY=your_api_key_here
GRA_ENVIRONMENT=development
\`\`\`

## Step 3: Initialize the Client

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  environment: process.env.GRA_ENVIRONMENT
})
\`\`\`

## Step 4: Your First API Call

\`\`\`javascript
async function getUsers() {
  try {
    const users = await client.users.list()
    console.log('Users:', users)
  } catch (error) {
    console.error('Error:', error)
  }
}

getUsers()
\`\`\``,
      lastUpdated: "2024-01-12",
    },
    "04_Examples & Tutorials/user-authentication": {
      title: "User Authentication Example",
      content: `# User Authentication Example

Learn how to implement user authentication with GRA Core Platform.

## Overview

GRA Core Platform provides multiple authentication methods:

- API Key Authentication
- OAuth 2.0
- JWT Tokens
- Session-based Authentication

## API Key Authentication

The simplest method for server-to-server communication:

\`\`\`javascript
const client = new GRACore({
  apiKey: 'your-api-key',
  authMethod: 'api-key'
})
\`\`\`

## OAuth 2.0 Flow

For user-facing applications:

\`\`\`javascript
// Step 1: Redirect to authorization URL
const authUrl = client.auth.getAuthorizationUrl({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  scope: 'read write'
})

// Step 2: Handle callback
const tokens = await client.auth.exchangeCodeForTokens({
  code: 'authorization-code',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/callback'
})
\`\`\`

## JWT Token Validation

\`\`\`javascript
const isValid = await client.auth.validateToken(token)
if (isValid) {
  // Token is valid, proceed with request
} else {
  // Token is invalid, redirect to login
}
\`\`\``,
      lastUpdated: "2024-01-11",
    },
    "04_Examples & Tutorials/data-management": {
      title: "Data Management Example",
      content: `# Data Management Example

Learn how to manage data effectively with GRA Core Platform.

## Creating Data Sources

\`\`\`javascript
const dataSource = await client.dataSources.create({
  name: 'Customer Database',
  type: 'postgresql',
  connectionString: 'postgresql://user:pass@localhost:5432/db'
})
\`\`\`

## Querying Data

\`\`\`javascript
const results = await client.data.query({
  dataSourceId: dataSource.id,
  query: 'SELECT * FROM customers WHERE active = true',
  parameters: {}
})
\`\`\`

## Real-time Data Streaming

\`\`\`javascript
const stream = client.data.stream({
  dataSourceId: dataSource.id,
  query: 'SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 1 HOUR'
})

stream.on('data', (row) => {
  console.log('New order:', row)
})

stream.on('error', (error) => {
  console.error('Stream error:', error)
})
\`\`\`

## Data Transformation

\`\`\`javascript
const transformer = await client.transformers.create({
  name: 'Customer Data Cleaner',
  inputSchema: customerSchema,
  outputSchema: cleanCustomerSchema,
  transformations: [
    { field: 'email', operation: 'lowercase' },
    { field: 'phone', operation: 'normalize' }
  ]
})

const cleanedData = await client.data.transform({
  transformerId: transformer.id,
  data: rawCustomerData
})
\`\`\``,
      lastUpdated: "2024-01-10",
    },
    "05_Development Guide/security-best-practices": {
      title: "Security Best Practices",
      content: `# Security Best Practices

Essential security guidelines for GRA Core Platform development.

## API Key Management

### Do's
- Store API keys in environment variables
- Use different keys for different environments
- Rotate keys regularly
- Implement key expiration policies

### Don'ts
- Never commit API keys to version control
- Don't share keys via email or chat
- Avoid hardcoding keys in source code
- Don't use production keys in development

## Authentication Security

### Multi-Factor Authentication
Always enable MFA for admin accounts:

\`\`\`javascript
await client.auth.enableMFA({
  userId: 'user-id',
  method: 'totp' // or 'sms', 'email'
})
\`\`\`

### Session Management
Implement proper session handling:

\`\`\`javascript
// Set session timeout
const session = await client.sessions.create({
  userId: 'user-id',
  expiresIn: '1h',
  refreshable: true
})

// Validate session on each request
const isValid = await client.sessions.validate(sessionToken)
\`\`\`

## Data Encryption

### At Rest
All data is encrypted using AES-256:

\`\`\`javascript
const encryptedData = await client.encryption.encrypt({
  data: sensitiveData,
  algorithm: 'AES-256-GCM'
})
\`\`\`

### In Transit
Always use HTTPS and verify SSL certificates:

\`\`\`javascript
const client = new GRACore({
  apiKey: 'your-key',
  baseUrl: 'https://api.gracore.com', // Always HTTPS
  verifySsl: true
})
\`\`\`

## Access Control

### Role-Based Access Control (RBAC)

\`\`\`javascript
// Define roles
const adminRole = await client.roles.create({
  name: 'admin',
  permissions: ['read', 'write', 'delete', 'admin']
})

const userRole = await client.roles.create({
  name: 'user',
  permissions: ['read', 'write']
})

// Assign roles to users
await client.users.assignRole({
  userId: 'user-id',
  roleId: adminRole.id
})
\`\`\`

## Audit Logging

Enable comprehensive audit logging:

\`\`\`javascript
await client.audit.configure({
  enabled: true,
  events: ['login', 'logout', 'data_access', 'data_modification'],
  retention: '90d'
})
\`\`\``,
      lastUpdated: "2024-01-09",
    },
    "05_Development Guide/performance-optimization": {
      title: "Performance Optimization",
      content: `# Performance Optimization

Guidelines for optimizing GRA Core Platform performance.

## Query Optimization

### Use Indexes
Ensure your database queries use appropriate indexes:

\`\`\`sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_created_at ON orders(created_at);
\`\`\`

### Query Batching
Batch multiple queries to reduce network overhead:

\`\`\`javascript
const results = await client.data.batchQuery([
  { query: 'SELECT * FROM customers WHERE id = ?', params: [1] },
  { query: 'SELECT * FROM orders WHERE customer_id = ?', params: [1] },
  { query: 'SELECT * FROM products WHERE featured = true', params: [] }
])
\`\`\`

## Caching Strategies

### Redis Caching
Implement Redis caching for frequently accessed data:

\`\`\`javascript
const cache = client.cache.redis({
  host: 'localhost',
  port: 6379,
  ttl: 3600 // 1 hour
})

// Cache query results
const cacheKey = 'customers:active'
let customers = await cache.get(cacheKey)

if (!customers) {
  customers = await client.data.query({
    query: 'SELECT * FROM customers WHERE active = true'
  })
  await cache.set(cacheKey, customers)
}
\`\`\`

### Memory Caching
Use in-memory caching for small, frequently accessed data:

\`\`\`javascript
const memoryCache = new Map()

function getCachedData(key) {
  if (memoryCache.has(key)) {
    const { data, timestamp } = memoryCache.get(key)
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data
    }
    memoryCache.delete(key)
  }
  return null
}
\`\`\`

## Connection Pooling

Configure connection pools for database connections:

\`\`\`javascript
const client = new GRACore({
  apiKey: 'your-key',
  database: {
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    }
  }
})
\`\`\`

## Pagination

Implement efficient pagination for large datasets:

\`\`\`javascript
// Cursor-based pagination (recommended)
const results = await client.data.query({
  query: 'SELECT * FROM orders WHERE id > ? ORDER BY id LIMIT ?',
  params: [lastId, 100]
})

// Offset-based pagination (use sparingly)
const results = await client.data.query({
  query: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
  params: [20, page * 20]
})
\`\`\`

## Monitoring and Profiling

### Performance Metrics
Monitor key performance indicators:

\`\`\`javascript
const metrics = await client.monitoring.getMetrics({
  timeRange: '1h',
  metrics: ['response_time', 'throughput', 'error_rate']
})
\`\`\`

### Query Profiling
Profile slow queries:

\`\`\`javascript
const profile = await client.data.profile({
  query: 'SELECT * FROM large_table WHERE complex_condition = ?',
  params: ['value']
})

console.log('Execution time:', profile.executionTime)
console.log('Rows examined:', profile.rowsExamined)
\`\`\``,
      lastUpdated: "2024-01-08",
    },
    "05_Development Guide/advanced-monitoring": {
      title: "Advanced Monitoring",
      content: `# Advanced Monitoring

Comprehensive monitoring strategies for GRA Core Platform.

## Application Performance Monitoring (APM)

### Setup APM Agent
Configure the APM agent for detailed performance insights:

\`\`\`javascript
import { GRACore, APMAgent } from '@gra-core/platform'

const apm = new APMAgent({
  serviceName: 'my-gra-app',
  environment: process.env.NODE_ENV,
  sampleRate: 0.1 // Sample 10% of transactions
})

const client = new GRACore({
  apiKey: 'your-key',
  apm: apm
})
\`\`\`

### Custom Metrics
Track custom business metrics:

\`\`\`javascript
// Counter metric
apm.counter('orders.created').increment()

// Gauge metric
apm.gauge('active.connections').set(connectionCount)

// Histogram metric
apm.histogram('request.duration').record(responseTime)

// Timer metric
const timer = apm.timer('database.query')
const result = await client.data.query(sql)
timer.stop()
\`\`\`

## Health Checks

### Basic Health Check
Implement comprehensive health checks:

\`\`\`javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    // Database connectivity
    await client.data.query('SELECT 1')
    health.checks.database = { status: 'healthy' }
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message }
    health.status = 'unhealthy'
  }

  try {
    // External API connectivity
    await client.external.ping()
    health.checks.external_api = { status: 'healthy' }
  } catch (error) {
    health.checks.external_api = { status: 'unhealthy', error: error.message }
    health.status = 'degraded'
  }

  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})
\`\`\`

## Alerting

### Threshold-based Alerts
Set up alerts for critical metrics:

\`\`\`javascript
await client.monitoring.createAlert({
  name: 'High Error Rate',
  condition: {
    metric: 'error_rate',
    operator: 'greater_than',
    threshold: 0.05, // 5%
    duration: '5m'
  },
  notifications: [
    { type: 'email', recipients: ['admin@company.com'] },
    { type: 'slack', webhook: 'https://hooks.slack.com/...' }
  ]
})
\`\`\`

### Anomaly Detection
Use machine learning for anomaly detection:

\`\`\`javascript
await client.monitoring.createAnomalyDetector({
  name: 'Response Time Anomaly',
  metric: 'response_time',
  algorithm: 'isolation_forest',
  sensitivity: 'medium',
  notifications: [
    { type: 'pagerduty', integration_key: 'your-key' }
  ]
})
\`\`\`

## Distributed Tracing

### Trace Requests
Track requests across microservices:

\`\`\`javascript
import { trace } from '@gra-core/tracing'

async function processOrder(orderId) {
  const span = trace.startSpan('process_order')
  span.setTag('order.id', orderId)

  try {
    // Validate order
    const validationSpan = trace.startSpan('validate_order', { childOf: span })
    await validateOrder(orderId)
    validationSpan.finish()

    // Process payment
    const paymentSpan = trace.startSpan('process_payment', { childOf: span })
    await processPayment(orderId)
    paymentSpan.finish()

    // Update inventory
    const inventorySpan = trace.startSpan('update_inventory', { childOf: span })
    await updateInventory(orderId)
    inventorySpan.finish()

    span.setTag('result', 'success')
  } catch (error) {
    span.setTag('error', true)
    span.setTag('error.message', error.message)
    throw error
  } finally {
    span.finish()
  }
}
\`\`\`

## Log Aggregation

### Structured Logging
Use structured logging for better searchability:

\`\`\`javascript
import { logger } from '@gra-core/logging'

logger.info('Order processed', {
  orderId: '12345',
  customerId: '67890',
  amount: 99.99,
  currency: 'USD',
  processingTime: 1250,
  tags: ['ecommerce', 'payment']
})

logger.error('Payment failed', {
  orderId: '12345',
  error: error.message,
  errorCode: 'PAYMENT_DECLINED',
  paymentMethod: 'credit_card'
})
\`\`\`

### Log Correlation
Correlate logs across services using trace IDs:

\`\`\`javascript
const traceId = req.headers['x-trace-id'] || generateTraceId()

logger.info('Request started', {
  traceId,
  method: req.method,
  url: req.url,
  userAgent: req.headers['user-agent']
})
\`\`\``,
      lastUpdated: "2024-01-07",
    },
    "06_GCP Feature InDepth/cloud-functions": {
      title: "Google Cloud Functions Integration",
      content: `# Google Cloud Functions Integration

Deep dive into integrating GRA Core Platform with Google Cloud Functions.

## Overview

Google Cloud Functions provides serverless compute for GRA Core Platform, enabling:

- Event-driven processing
- Auto-scaling based on demand
- Pay-per-use pricing model
- Seamless integration with other GCP services

## Setting Up Cloud Functions

### Function Configuration
Configure your Cloud Function for optimal performance:

\`\`\`yaml
# function.yaml
name: gra-data-processor
runtime: nodejs18
entry_point: processData
memory: 512MB
timeout: 300s
environment_variables:
  GRA_API_KEY: your_api_key_here
  GCP_PROJECT_ID: your_project_id_here
trigger:
  event_type: providers/cloud.pubsub/eventTypes/topic.publish
  resource: projects/my-project/topics/gra-events
\`\`\`

### Function Implementation
Implement your Cloud Function with GRA Core integration:

\`\`\`javascript
const { GRACore } = require('@gra-core/platform')

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  projectId: process.env.GCP_PROJECT_ID
})

exports.processData = async (data, context) => {
  console.log('Function triggered:', context.eventId)
  
  try {
    // Decode Pub/Sub message
    const message = Buffer.from(data.data, 'base64').toString()
    const payload = JSON.parse(message)
    
    // Process data using GRA Core
    const result = await client.data.process({
      input: payload,
      processor: 'data-enrichment',
      options: {
        async: false,
        timeout: 30000
      }
    })
    
    // Store results
    await client.storage.save({
      bucket: 'processed-data',
      key: \`processed/\${context.eventId}.json\`,
      data: result
    })
    
    console.log('Processing completed:', result.id)
    return { success: true, resultId: result.id }
    
  } catch (error) {
    console.error('Processing failed:', error)
    
    // Send to dead letter queue
    await client.messaging.publish({
      topic: 'gra-dlq',
      message: {
        originalData: data,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    })
    
    throw error
  }
}
\`\`\`

## Event-Driven Architecture

### Pub/Sub Integration
Use Cloud Pub/Sub for event-driven processing:

\`\`\`javascript
// Publisher function
exports.publishEvent = async (req, res) => {
  const { PubSub } = require('@google-cloud/pubsub')
  const pubsub = new PubSub()
  
  const topic = pubsub.topic('gra-events')
  const message = {
    eventType: 'data.created',
    payload: req.body,
    timestamp: new Date().toISOString(),
    source: 'api-gateway'
  }
  
  try {
    const messageId = await topic.publish(Buffer.from(JSON.stringify(message)))
    res.json({ success: true, messageId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Subscriber function
exports.handleEvent = async (message, context) => {
  const eventData = JSON.parse(Buffer.from(message.data, 'base64').toString())
  
  switch (eventData.eventType) {
    case 'data.created':
      await handleDataCreated(eventData.payload)
      break
    case 'data.updated':
      await handleDataUpdated(eventData.payload)
      break
    case 'data.deleted':
      await handleDataDeleted(eventData.payload)
      break
    default:
      console.log('Unknown event type:', eventData.eventType)
  }
}
\`\`\`

### Cloud Storage Triggers
Process files uploaded to Cloud Storage:

\`\`\`javascript
exports.processUploadedFile = async (file, context) => {
  console.log('File uploaded:', file.name)
  
  // Only process specific file types
  if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
    console.log('Skipping non-data file:', file.name)
    return
  }
  
  try {
    // Download file content
    const { Storage } = require('@google-cloud/storage')
    const storage = new Storage()
    const bucket = storage.bucket(file.bucket)
    const fileObj = bucket.file(file.name)
    
    const [content] = await fileObj.download()
    
    // Process with GRA Core
    const result = await client.data.ingest({
      source: file.name,
      format: file.name.endsWith('.csv') ? 'csv' : 'json',
      data: content.toString(),
      options: {
        validate: true,
        transform: true,
        deduplicate: true
      }
    })
    
    // Move processed file to archive
    await fileObj.move(\`archive/\${file.name}\`)
    
    console.log('File processed successfully:', result.recordsProcessed)
    
  } catch (error) {
    console.error('File processing failed:', error)
    
    // Move failed file to error folder
    await fileObj.move(\`errors/\${file.name}\`)
    throw error
  }
}
\`\`\`

## Monitoring and Debugging

### Cloud Logging Integration
Implement structured logging for Cloud Functions:

\`\`\`javascript
const { Logging } = require('@google-cloud/logging')
const logging = new Logging()
const log = logging.log('gra-functions')

function logStructured(severity, message, metadata = {}) {
  const entry = log.entry({
    severity,
    resource: {
      type: 'cloud_function',
      labels: {
        function_name: process.env.FUNCTION_NAME,
        region: process.env.FUNCTION_REGION
      }
    }
  }, {
    message,
    ...metadata,
    timestamp: new Date().toISOString()
  })
  
  log.write(entry)
}

// Usage
logStructured('INFO', 'Processing started', {
  eventId: context.eventId,
  dataSize: data.length
})
\`\`\`

### Error Handling and Retries
Implement robust error handling:

\`\`\`javascript
exports.resilientProcessor = async (data, context) => {
  const maxRetries = 3
  let attempt = 0
  
  while (attempt < maxRetries) {
    try {
      const result = await processWithGRA(data)
      return result
    } catch (error) {
      attempt++
      
      if (attempt >= maxRetries) {
        logStructured('ERROR', 'Max retries exceeded', {
          error: error.message,
          attempts: attempt,
          eventId: context.eventId
        })
        throw error
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      logStructured('WARNING', 'Retrying after error', {
        error: error.message,
        attempt,
        nextRetryIn: delay
      })
    }
  }
}
\`\`\`

## Performance Optimization

### Cold Start Optimization
Minimize cold start times:

\`\`\`javascript
// Initialize outside the handler
const { GRACore } = require('@gra-core/platform')
const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  // Use connection pooling
  pool: {
    min: 1,
    max: 5
  }
})

// Pre-warm connections
client.data.ping().catch(console.error)

exports.optimizedHandler = async (data, context) => {
  // Handler logic here
  // Client is already initialized and warmed up
}
\`\`\`

### Memory and CPU Optimization
Configure resources based on workload:

\`\`\`javascript
// For CPU-intensive tasks
const cpuIntensiveConfig = {
  memory: '2GB',
  cpu: '1000m', // 1 vCPU
  timeout: '540s'
}

// For memory-intensive tasks
const memoryIntensiveConfig = {
  memory: '8GB',
  cpu: '2000m', // 2 vCPUs
  timeout: '540s'
}

// For I/O-intensive tasks
const ioIntensiveConfig = {
  memory: '512MB',
  cpu: '200m', // 0.2 vCPU
  timeout: '300s',
  concurrency: 100
}
\`\`\``,
      lastUpdated: "2024-01-06",
    },
    "06_GCP Feature InDepth/cloud-storage": {
      title: "Google Cloud Storage Integration",
      content: `# Google Cloud Storage Integration

Comprehensive guide to integrating GRA Core Platform with Google Cloud Storage.

## Overview

Google Cloud Storage provides scalable object storage for GRA Core Platform:

- Unlimited storage capacity
- Multiple storage classes for cost optimization
- Global accessibility with edge caching
- Strong consistency and durability
- Integration with other GCP services

## Storage Configuration

### Bucket Setup
Configure storage buckets for different use cases:

\`\`\`javascript
const { Storage } = require('@google-cloud/storage')
const { GRACore } = require('@gra-core/platform')

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE
})

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  storage: {
    provider: 'gcs',
    config: {
      projectId: process.env.GCP_PROJECT_ID,
      buckets: {
        raw: 'gra-raw-data',
        processed: 'gra-processed-data',
        archive: 'gra-archive-data',
        backup: 'gra-backup-data'
      }
    }
  }
})
\`\`\`

### Storage Classes
Choose appropriate storage classes:

\`\`\`javascript
// Create buckets with different storage classes
async function setupStorageBuckets() {
  const buckets = [
    {
      name: 'gra-hot-data',
      storageClass: 'STANDARD', // Frequently accessed data
      location: 'US-CENTRAL1'
    },
    {
      name: 'gra-warm-data',
      storageClass: 'NEARLINE', // Monthly access
      location: 'US-CENTRAL1'
    },
    {
      name: 'gra-cold-data',
      storageClass: 'COLDLINE', // Quarterly access
      location: 'US-CENTRAL1'
    },
    {
      name: 'gra-archive-data',
      storageClass: 'ARCHIVE', // Yearly access
      location: 'US-CENTRAL1'
    }
  ]

  for (const bucketConfig of buckets) {
    try {
      const [bucket] = await storage.createBucket(bucketConfig.name, {
        storageClass: bucketConfig.storageClass,
        location: bucketConfig.location,
        versioning: { enabled: true },
        lifecycle: {
          rule: [
            {
              action: { type: 'Delete' },
              condition: { age: 365 } // Delete after 1 year
            }
          ]
        }
      })
      console.log(\`Bucket \${bucket.name} created\`)
    } catch (error) {
      if (error.code === 409) {
        console.log(\`Bucket \${bucketConfig.name} already exists\`)
      } else {
        throw error
      }
    }
  }
}
\`\`\`

## Data Operations

### File Upload and Processing
Handle file uploads with GRA Core integration:

\`\`\`javascript
async function uploadAndProcess(filePath, metadata = {}) {
  const fileName = path.basename(filePath)
  const bucket = storage.bucket('gra-raw-data')
  const file = bucket.file(fileName)

  try {
    // Upload file with metadata
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          source: 'gra-platform'
        }
      }
    })

    console.log(\`File \${fileName} uploaded successfully\`)

    // Process with GRA Core
    const processingResult = await client.data.processFile({
      bucket: 'gra-raw-data',
      fileName: fileName,
      processor: 'auto-detect',
      options: {
        outputBucket: 'gra-processed-data',
        format: 'parquet',
        compression: 'snappy'
      }
    })

    return processingResult

  } catch (error) {
    console.error(\`Upload failed for \${fileName}:\`, error)
    throw error
  }
}
\`\`\`

### Batch Processing
Process multiple files efficiently:

\`\`\`javascript
async function batchProcessFiles(filePattern) {
  const bucket = storage.bucket('gra-raw-data')
  const [files] = await bucket.getFiles({
    prefix: filePattern,
    maxResults: 100
  })

  const processingPromises = files.map(async (file) => {
    try {
      const result = await client.data.processFile({
        bucket: file.bucket.name,
        fileName: file.name,
        processor: 'batch-processor',
        options: {
          outputBucket: 'gra-processed-data',
          deleteSource: false,
          notify: true
        }
      })

      // Move processed file to archive
      await file.move(\`archive/\${file.name}\`)
      
      return { file: file.name, status: 'success', result }
    } catch (error) {
      return { file: file.name, status: 'error', error: error.message }
    }
  })

  const results = await Promise.allSettled(processingPromises)
  
  const summary = {
    total: results.length,
    successful: results.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length,
    failed: results.filter(r => r.status === 'rejected' || r.value.status === 'error').length
  }

  console.log('Batch processing summary:', summary)
  return results
}
\`\`\`

## Data Lifecycle Management

### Automated Lifecycle Policies
Implement automated data lifecycle management:

\`\`\`javascript
async function setupLifecyclePolicies() {
  const buckets = [
    {
      name: 'gra-raw-data',
      rules: [
        {
          action: { type: 'SetStorageClass', storageClass: 'NEARLINE' },
          condition: { age: 30 } // Move to Nearline after 30 days
        },
        {
          action: { type: 'SetStorageClass', storageClass: 'COLDLINE' },
          condition: { age: 90 } // Move to Coldline after 90 days
        },
        {
          action: { type: 'Delete' },
          condition: { age: 365 } // Delete after 1 year
        }
      ]
    },
    {
      name: 'gra-processed-data',
      rules: [
        {
          action: { type: 'SetStorageClass', storageClass: 'NEARLINE' },
          condition: { age: 60 }
        },
        {
          action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' },
          condition: { age: 180 }
        }
      ]
    }
  ]

  for (const bucketConfig of buckets) {
    const bucket = storage.bucket(bucketConfig.name)
    await bucket.setMetadata({
      lifecycle: { rule: bucketConfig.rules }
    })
    console.log(\`Lifecycle policies set for \${bucketConfig.name}\`)
  }
}
\`\`\`

### Data Retention and Compliance
Implement compliance-aware data retention:

\`\`\`javascript
async function setRetentionPolicies() {
  const complianceBuckets = [
    {
      name: 'gra-financial-data',
      retentionPeriod: 7 * 365 * 24 * 60 * 60, // 7 years in seconds
      locked: true
    },
    {
      name: 'gra-audit-logs',
      retentionPeriod: 3 * 365 * 24 * 60 * 60, // 3 years in seconds
      locked: true
    }
  ]

  for (const config of complianceBuckets) {
    const bucket = storage.bucket(config.name)
    
    // Set retention policy
    await bucket.setRetentionPolicy({
      retentionPeriod: config.retentionPeriod
    })

    if (config.locked) {
      // Lock the retention policy (irreversible!)
      await bucket.lock()
    }

    console.log(\`Retention policy set for \${config.name}\`)
  }
}
\`\`\`

## Security and Access Control

### IAM and Access Control
Configure secure access to storage:

\`\`\`javascript
async function setupBucketSecurity() {
  const bucket = storage.bucket('gra-secure-data')

  // Set bucket-level IAM policy
  const [policy] = await bucket.iam.getPolicy()
  
  policy.bindings.push({
    role: 'roles/storage.objectViewer',
    members: ['serviceAccount:gra-reader@project.iam.gserviceaccount.com']
  })

  policy.bindings.push({
    role: 'roles/storage.objectCreator',
    members: ['serviceAccount:gra-writer@project.iam.gserviceaccount.com']
  })

  await bucket.iam.setPolicy(policy)

  // Enable uniform bucket-level access
  await bucket.setMetadata({
    iamConfiguration: {
      uniformBucketLevelAccess: {
        enabled: true
      }
    }
  })

  console.log('Security policies configured')
}
\`\`\`

### Encryption
Implement encryption for sensitive data:

\`\`\`javascript
async function uploadEncryptedFile(filePath, encryptionKey) {
  const bucket = storage.bucket('gra-encrypted-data')
  const fileName = path.basename(filePath)

  // Upload with customer-supplied encryption key
  await bucket.upload(filePath, {
    destination: fileName,
    encryptionKey: encryptionKey,
    metadata: {
      metadata: {
        encrypted: 'true',
        algorithm: 'AES256'
      }
    }
  })

  console.log(\`Encrypted file \${fileName} uploaded\`)
}

// Generate encryption key
const crypto = require('crypto')
const encryptionKey = crypto.randomBytes(32).toString('base64')
\`\`\`

## Monitoring and Analytics

### Storage Analytics
Monitor storage usage and performance:

\`\`\`javascript
async function getStorageAnalytics() {
  const buckets = await storage.getBuckets()
  const analytics = []

  for (const [bucket] of buckets) {
    const [metadata] = await bucket.getMetadata()
    const [files] = await bucket.getFiles({ maxResults: 1 })
    
    analytics.push({
      name: bucket.name,
      storageClass: metadata.storageClass,
      location: metadata.location,
      created: metadata.timeCreated,
      fileCount: files.length,
      versioning: metadata.versioning?.enabled || false
    })
  }

  return analytics
}
\`\`\`

### Cost Optimization
Monitor and optimize storage costs:

\`\`\`javascript
async function analyzeCosts() {
  const { Monitoring } = require('@google-cloud/monitoring')
  const monitoring = new Monitoring.MetricServiceClient()

  const request = {
    name: \`projects/\${process.env.GCP_PROJECT_ID}\`,
    filter: 'metric.type="storage.googleapis.com/storage/total_bytes"',
    interval: {
      endTime: { seconds: Date.now() / 1000 },
      startTime: { seconds: (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000 }
    }
  }

  const [timeSeries] = await monitoring.listTimeSeries(request)
  
  const costAnalysis = timeSeries.map(series => ({
    bucket: series.resource.labels.bucket_name,
    storageClass: series.resource.labels.storage_class,
    avgBytes: series.points.reduce((sum, point) => 
      sum + parseFloat(point.value.doubleValue), 0) / series.points.length,
    trend: series.points.length > 1 ? 
      (series.points[0].value.doubleValue - series.points[series.points.length - 1].value.doubleValue) : 0
  }))

  return costAnalysis
}
\`\`\``,
      lastUpdated: "2024-01-05",
    },
  }

  return mockContent[slugPath] || null
}

// Dynamic navigation order based on file structure
const getPageNavigation = async (currentSlug: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/docs-structure`)
    const navigation = await response.json()

    // Flatten navigation to get ordered list of pages
    const flattenNavigation = (items: any[], order: any[] = []) => {
      items.forEach((item) => {
        if (item.type === "file" && item.href) {
          const slug = item.href.replace("/docs/", "")
          order.push({
            slug,
            title: item.title.replace(/^\d+_\s*/, "").trim(),
            href: item.href,
          })
        }
        if (item.type === "folder" && item.items) {
          flattenNavigation(item.items, order)
        }
      })
      return order
    }

    const navigationOrder = flattenNavigation(navigation)
    const currentIndex = navigationOrder.findIndex((item) => item.slug === currentSlug)

    if (currentIndex === -1) return { previousPage: null, nextPage: null }

    const previousPage =
      currentIndex > 0
        ? {
            title: navigationOrder[currentIndex - 1].title,
            href: navigationOrder[currentIndex - 1].href,
          }
        : null

    const nextPage =
      currentIndex < navigationOrder.length - 1
        ? {
            title: navigationOrder[currentIndex + 1].title,
            href: navigationOrder[currentIndex + 1].href,
          }
        : null

    return { previousPage, nextPage }
  } catch (error) {
    console.error("Error fetching navigation:", error)
    return { previousPage: null, nextPage: null }
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = await getDocContent(slug)

  if (!doc) {
    notFound()
  }

  const currentSlug = slug.join("/")
  const { previousPage, nextPage } = await getPageNavigation(currentSlug)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Book className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">GRA Core Platform</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Documentation</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="flex items-center space-x-8">
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1">
              About
            </button>
            <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 pb-1">
              User Guide
            </button>
            <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 pb-1">
              Example
            </button>
            <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 pb-1">
              Create Doc
            </button>
            <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 pb-1">
              GCP BOW
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <Badge
              variant="secondary"
              className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs"
            >
              v5.7 stable
            </Badge>
            <button className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors">
              <span className="text-sm">🌙</span>
              <span>Dark</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Fixed Left Sidebar */}
        <div className="fixed left-0 top-16 bottom-0 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 ml-80 mr-80">
          <div className="max-w-none px-8 py-6">
            <Breadcrumb slug={slug} />

            <div className="mt-6">
              <DocContent title={doc.title} content={doc.content} lastUpdated={doc.lastUpdated} />

              <PageNavigation previousPage={previousPage} nextPage={nextPage} />
            </div>
          </div>
        </main>

        {/* Fixed Right Sidebar - Table of Contents */}
        <div className="fixed right-0 top-16 bottom-0 w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-6">
            <TableOfContents content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  return [
    { slug: ["01_GRA_Core_Platform Introduction", "introduction"] },
    { slug: ["02_User Guide", "user-guide"] },
    { slug: ["03_API Reference", "api-reference"] },
    { slug: ["04_Examples & Tutorials", "basic-setup"] },
    { slug: ["04_Examples & Tutorials", "user-authentication"] },
    { slug: ["04_Examples & Tutorials", "data-management"] },
    { slug: ["05_Development Guide", "security-best-practices"] },
    { slug: ["05_Development Guide", "performance-optimization"] },
    { slug: ["05_Development Guide", "advanced-monitoring"] },
    { slug: ["06_GCP Feature InDepth", "cloud-functions"] },
    { slug: ["06_GCP Feature InDepth", "cloud-storage"] },
  ]
}
