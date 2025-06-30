import { notFound } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { DocContent } from "@/components/doc-content"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageNavigation } from "@/components/page-navigation"
import { TableOfContents } from "@/components/table-of-contents"
import { Header } from "@/components/header"
import { getNavigation } from "@/lib/docs-structure"
import { mockContent } from "@/lib/mock-content" // Declare the mockContent variable

// Tries to load content for the given slug
const getDocContent = async (slug: string[]) => {
  const slugPath = slug.join("/")
  return (
    {
      introduction: mockContent.introduction,
      "user-guide": mockContent["user-guide"],
      "api-reference": mockContent["api-reference"],
      examples: mockContent.examples,
      development: mockContent.development,
      architecture: mockContent.architecture,
      "01_GRA_Core_Platform Introduction/introduction": mockContent.introduction,
      "02_User Guide/user-guide": mockContent["user-guide"],
      "02_User Guide/Local_setup/getting-started": {
        title: "Getting Started with Local Setup",
        content: `# Getting Started with Local Setup

This guide will walk you through setting up your local development environment for the GRA Core Platform.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- Git
- A code editor (VS Code recommended)
- Docker (optional, for containerized development)

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/gra-core/platform.git
cd platform
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment Variables

Create a \`.env.local\` file in the root directory:

\`\`\`
API_KEY=your_api_key_here
ENVIRONMENT=development
DEBUG=true
\`\`\`

### 4. Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

Your local development server should now be running at http://localhost:3000.

## Troubleshooting

### Common Issues

- **Port conflicts**: If port 3000 is already in use, you can specify a different port:
  \`\`\`bash
  npm run dev -- -p 3001
  \`\`\`

- **Missing dependencies**: If you encounter errors about missing dependencies, try:
  \`\`\`bash
  npm clean-install
  \`\`\`

## Next Steps

Now that you have your local environment set up, check out the [User Authentication](/docs/04_Examples%20%26%20Tutorials/user-authentication) guide to implement authentication in your application.`,
        lastUpdated: "2024-02-01",
      },
      "03_API Reference/api-reference": mockContent["api-reference"],
      "04_Examples & Tutorials/basic-setup": {
        title: "Basic Setup",
        content: `# Basic Setup

This guide covers the fundamental setup process for integrating the GRA Core Platform into your application.

## Installation

First, install the GRA Core Platform package:

\`\`\`bash
npm install @gra-core/platform
\`\`\`

## Basic Configuration

Create a client instance with your API key:

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  environment: 'production' // or 'development', 'staging'
})
\`\`\`

## Initializing the Platform

Initialize the platform in your application entry point:

\`\`\`javascript
// app.js or index.js
import { initializeGRA } from '@gra-core/platform'

initializeGRA({
  projectId: 'your-project-id',
  region: 'us-central1',
  logging: true
})
\`\`\`

## Verifying the Setup

Test your setup with a simple API call:

\`\`\`javascript
async function testConnection() {
  try {
    const status = await client.system.status()
    console.log('Connection successful:', status)
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

testConnection()
\`\`\`

## Next Steps

Now that you have completed the basic setup, you can:

1. Set up [User Authentication](/docs/04_Examples%20%26%20Tutorials/user-authentication)
2. Learn about [Data Management](/docs/04_Examples%20%26%20Tutorials/data-management)
3. Explore the [API Reference](/docs/03_API%20Reference/api-reference)`,
        lastUpdated: "2024-01-20",
      },
      "04_Examples & Tutorials/user-authentication": {
        title: "User Authentication",
        content: `# User Authentication

This guide explains how to implement user authentication in your application using the GRA Core Platform.

## Authentication Methods

The platform supports multiple authentication methods:

- API Key Authentication
- OAuth 2.0
- JWT Tokens
- Multi-factor Authentication (MFA)

## Setting Up API Key Authentication

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY
})

// Authenticate a request
const response = await client.auth.authenticate({
  type: 'api-key',
  key: userProvidedApiKey
})

if (response.authenticated) {
  // Proceed with authenticated operations
}
\`\`\`

## Implementing OAuth 2.0

\`\`\`javascript
// Configure OAuth provider
client.auth.configureOAuth({
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://your-app.com/oauth/callback'
})

// Generate authorization URL
const authUrl = client.auth.getAuthorizationUrl({
  scope: ['profile', 'email']
})

// Redirect user to authUrl

// Handle the callback
async function handleOAuthCallback(code) {
  const tokens = await client.auth.exchangeCodeForTokens(code)
  
  // Store tokens securely
  // ...
  
  // Get user info
  const userInfo = await client.auth.getUserInfo(tokens.accessToken)
}
\`\`\`

## JWT Authentication

\`\`\`javascript
// Verify a JWT token
const verificationResult = await client.auth.verifyToken(jwtToken)

if (verificationResult.valid) {
  const userData = verificationResult.payload
  // Proceed with authenticated user
}
\`\`\`

## Multi-factor Authentication

\`\`\`javascript
// Enable MFA for a user
await client.auth.enableMFA({
  userId: 'user-123',
  method: 'sms', // or 'totp', 'email'
  phoneNumber: '+1234567890' // if method is 'sms'
})

// Verify MFA code
const mfaResult = await client.auth.verifyMFACode({
  userId: 'user-123',
  code: '123456'
})
\`\`\`

## Best Practices

1. **Never store API keys in client-side code**
2. **Use environment variables for sensitive credentials**
3. **Implement proper token refresh mechanisms**
4. **Set appropriate token expiration times**
5. **Use HTTPS for all authentication requests**

## Security Considerations

For additional security measures, refer to our [Security Best Practices](/docs/05_Development%20Guide/security-best-practices) guide.`,
        lastUpdated: "2024-01-18",
      },
      "04_Examples & Tutorials/data-management": {
        title: "Data Management",
        content: `# Data Management

This guide covers data management techniques and best practices using the GRA Core Platform.

## Data Models

Define your data models using the platform's schema definition language:

\`\`\`javascript
import { defineModel } from '@gra-core/platform'

const UserModel = defineModel({
  name: 'User',
  fields: {
    id: { type: 'string', primary: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true, unique: true },
    role: { type: 'string', enum: ['admin', 'user', 'guest'], default: 'user' },
    createdAt: { type: 'timestamp', default: 'now()' }
  },
  indexes: [
    { fields: ['email'] },
    { fields: ['role', 'createdAt'] }
  ]
})
\`\`\`

## CRUD Operations

### Create

\`\`\`javascript
const newUser = await client.data.create('User', {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
})
\`\`\`

### Read

\`\`\`javascript
// Get by ID
const user = await client.data.get('User', 'user-123')

// Query with filters
const adminUsers = await client.data.query('User', {
  where: {
    role: 'admin'
  },
  limit: 10,
  offset: 0,
  orderBy: {
    createdAt: 'desc'
  }
})
\`\`\`

### Update

\`\`\`javascript
const updatedUser = await client.data.update('User', 'user-123', {
  name: 'John Smith',
  role: 'user'
})
\`\`\`

### Delete

\`\`\`javascript
await client.data.delete('User', 'user-123')
\`\`\`

## Transactions

\`\`\`javascript
await client.data.transaction(async (tx) => {
  // Create a new order
  const order = await tx.create('Order', {
    userId: 'user-123',
    total: 99.99,
    status: 'pending'
  })
  
  // Update inventory
  await tx.update('Product', 'product-456', {
    stock: { decrement: 1 }
  })
  
  // If any operation fails, the entire transaction is rolled back
})
\`\`\`

## Data Validation

\`\`\`javascript
import { validator } from '@gra-core/platform'

const userValidator = validator.object({
  name: validator.string().min(2).max(100).required(),
  email: validator.string().email().required(),
  age: validator.number().min(18).optional()
})

// Validate data before creating
const validationResult = userValidator.validate({
  name: 'Jo', // Too short
  email: 'invalid-email'
})

if (validationResult.error) {
  console.error('Validation failed:', validationResult.error)
} else {
  // Proceed with creating the user
}
\`\`\`

## Data Migration

For information on data migration strategies, refer to our [Performance Optimization](/docs/05_Development%20Guide/performance-optimization) guide.`,
        lastUpdated: "2024-01-15",
      },
      "05_Development Guide/security-best-practices": {
        title: "Security Best Practices",
        content: `# Security Best Practices

This guide outlines security best practices for applications built with the GRA Core Platform.

## Authentication & Authorization

### Secure Authentication

- Use OAuth 2.0 or JWT for authentication when possible
- Implement proper token validation and expiration
- Store tokens securely using HTTP-only cookies or secure storage
- Implement CSRF protection for cookie-based authentication

### Role-Based Access Control

\`\`\`javascript
import { defineRoles, definePermissions } from '@gra-core/platform'

// Define permissions
const permissions = definePermissions([
  'user:read',
  'user:write',
  'user:delete',
  'report:read',
  'report:write',
  'admin:access'
])

// Define roles with permissions
const roles = defineRoles({
  admin: [
    permissions.all() // All permissions
  ],
  manager: [
    permissions.user.all(),
    permissions.report.all()
  ],
  user: [
    permissions.user.read,
    permissions.report.read
  ]
})

// Check permissions in your application
if (await client.auth.hasPermission(userId, 'report:write')) {
  // Allow the operation
}
\`\`\`

## Data Security

### Encryption

- Use TLS/SSL for all data in transit
- Encrypt sensitive data at rest
- Use the platform's built-in encryption utilities

\`\`\`javascript
import { encryption } from '@gra-core/platform'

// Encrypt sensitive data
const encryptedData = await encryption.encrypt('sensitive data', encryptionKey)

// Decrypt when needed
const decryptedData = await encryption.decrypt(encryptedData, encryptionKey)
\`\`\`

### Input Validation

- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Sanitize data before displaying to prevent XSS attacks

\`\`\`javascript
import { sanitize } from '@gra-core/platform/security'

// Sanitize user input
const sanitizedHtml = sanitize.html(userProvidedHtml)
\`\`\`

## API Security

### Rate Limiting

\`\`\`javascript
import { rateLimit } from '@gra-core/platform/security'

// Apply rate limiting to your API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
})

// Apply to your API routes
app.use('/api/', limiter)
\`\`\`

### API Keys Management

- Rotate API keys regularly
- Use different API keys for different environments
- Implement key revocation mechanisms

## Compliance & Auditing

### Audit Logging

\`\`\`javascript
import { audit } from '@gra-core/platform'

// Log security events
audit.log({
  action: 'user.login',
  userId: 'user-123',
  status: 'success',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
})

// Query audit logs
const loginAttempts = await audit.query({
  action: 'user.login',
  userId: 'user-123',
  timeRange: {
    start: new Date('2023-01-01'),
    end: new Date()
  }
})
\`\`\`

### Compliance Frameworks

The GRA Core Platform supports compliance with:

- GDPR
- HIPAA
- SOC 2
- PCI DSS

For specific compliance requirements, refer to our [Advanced Monitoring](/docs/05_Development%20Guide/advanced-monitoring) guide.`,
        lastUpdated: "2024-01-10",
      },
      "05_Development Guide/performance-optimization": {
        title: "Performance Optimization",
        content: `# Performance Optimization

This guide provides strategies for optimizing the performance of applications built with the GRA Core Platform.

## Database Optimization

### Indexing Strategies

\`\`\`javascript
import { defineModel } from '@gra-core/platform'

const ProductModel = defineModel({
  name: 'Product',
  fields: {
    id: { type: 'string', primary: true },
    name: { type: 'string', required: true },
    category: { type: 'string', required: true },
    price: { type: 'number', required: true },
    stock: { type: 'number', default: 0 },
    createdAt: { type: 'timestamp', default: 'now()' }
  },
  // Define optimal indexes based on query patterns
  indexes: [
    { fields: ['category'] },
    { fields: ['price'] },
    { fields: ['category', 'price'] }, // Compound index for filtering by both
    { fields: ['createdAt'] }
  ]
})
\`\`\`

### Query Optimization

- Use selective queries instead of retrieving all fields
- Implement pagination for large result sets
- Use appropriate filtering to reduce result size

\`\`\`javascript
// Optimized query with field selection and pagination
const products = await client.data.query('Product', {
  select: ['id', 'name', 'price'], // Only select needed fields
  where: {
    category: 'electronics',
    price: { gt: 100 }
  },
  limit: 20,
  offset: 0,
  orderBy: {
    price: 'desc'
  }
})
\`\`\`

## Caching Strategies

### Response Caching

\`\`\`javascript
import { cache } from '@gra-core/platform'

// Cache expensive operation results
async function getProductDetails(productId) {
  const cacheKey = \`product:\${productId}\`
  
  // Try to get from cache first
  const cachedData = await cache.get(cacheKey)
  if (cachedData) return cachedData
  
  // If not in cache, fetch from database
  const product = await client.data.get('Product', productId)
  
  // Store in cache for 10 minutes
  await cache.set(cacheKey, product, 600)
  
  return product
}
\`\`\`

### Distributed Caching

\`\`\`javascript
// Configure distributed cache with Redis
cache.configure({
  type: 'redis',
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
})
\`\`\`

## API Performance

### Batch Operations

\`\`\`javascript
// Instead of multiple individual operations
const batchResults = await client.data.batch([
  { operation: 'create', model: 'Product', data: { name: 'Product 1', price: 99.99 } },
  { operation: 'update', model: 'Product', id: 'prod-123', data: { stock: 50 } },
  { operation: 'delete', model: 'Product', id: 'prod-456' }
])
\`\`\`

### Compression

\`\`\`javascript
import { compression } from '@gra-core/platform'

// Enable compression for API responses
app.use(compression())
\`\`\`

## Scaling Strategies

### Horizontal Scaling

- Deploy multiple instances behind a load balancer
- Use stateless design patterns
- Implement proper session management

### Vertical Scaling

- Optimize resource allocation
- Monitor memory and CPU usage
- Implement efficient background processing

\`\`\`javascript
import { queue } from '@gra-core/platform'

// Process heavy tasks in the background
await queue.add('processOrder', {
  orderId: 'order-123',
  userId: 'user-456'
}, {
  priority: 'high',
  attempts: 3
})
\`\`\`

## Monitoring & Profiling

For detailed information on monitoring application performance, refer to our [Advanced Monitoring](/docs/05_Development%20Guide/advanced-monitoring) guide.`,
        lastUpdated: "2024-01-08",
      },
      "05_Development Guide/advanced-monitoring": {
        title: "Advanced Monitoring",
        content: `# Advanced Monitoring

This guide covers advanced monitoring techniques for applications built with the GRA Core Platform.

## Monitoring Setup

### Configuring Monitoring

\`\`\`javascript
import { monitoring } from '@gra-core/platform'

// Initialize monitoring
monitoring.initialize({
  serviceName: 'my-application',
  environment: process.env.NODE_ENV,
  version: '1.0.0',
  // Optional integrations
  integrations: {
    prometheus: true,
    datadog: {
      apiKey: process.env.DATADOG_API_KEY
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY
    }
  }
})
\`\`\`

## Performance Metrics

### Custom Metrics

\`\`\`javascript
// Counter metric
const requestCounter = monitoring.metrics.createCounter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status']
})

// Increment counter
requestCounter.inc({ method: 'GET', endpoint: '/api/products', status: 200 })

// Gauge metric
const activeUsers = monitoring.metrics.createGauge({
  name: 'active_users',
  help: 'Number of currently active users'
})

// Set gauge value
activeUsers.set(42)

// Histogram metric
const responseTime = monitoring.metrics.createHistogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
})

// Record duration
const end = responseTime.startTimer({ method: 'GET', endpoint: '/api/products' })
// ... process request
end() // Automatically calculates duration
\`\`\`

## Distributed Tracing

\`\`\`javascript
import { tracing } from '@gra-core/platform'

// Initialize tracing
tracing.initialize({
  serviceName: 'my-application',
  samplingRate: 0.1 // Sample 10% of requests
})

// Create a new trace
async function processOrder(orderId) {
  const span = tracing.startSpan('process-order')
  span.setAttributes({
    'order.id': orderId
  })
  
  try {
    // Process the order
    const order = await client.data.get('Order', orderId)
    
    // Create child span for a sub-operation
    const paymentSpan = tracing.startSpan('process-payment', { parent: span })
    try {
      await processPayment(order.paymentId)
    } finally {
      paymentSpan.end()
    }
    
    return order
  } catch (error) {
    span.recordException(error)
    throw error
  } finally {
    span.end()
  }
}
\`\`\`

## Log Management

\`\`\`javascript
import { logging } from '@gra-core/platform'

// Configure logging
logging.configure({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'json',
  destination: 'stdout', // or 'file', or a custom transport
  correlationIdKey: 'trace_id' // Link logs to traces
})

// Use the logger
const logger = logging.getLogger('orders-service')

logger.info('Processing order', { orderId: 'order-123' })
logger.error('Payment failed', { 
  orderId: 'order-123', 
  error: 'Insufficient funds',
  userId: 'user-456'
})

// Structured logging with context
const orderContext = logger.createContext({ orderId: 'order-123' })
orderContext.info('Order received')
orderContext.info('Processing payment')
orderContext.info('Order completed')
\`\`\`

## Alerting & Notifications

\`\`\`javascript
import { alerts } from '@gra-core/platform'

// Configure alerting
alerts.configure({
  channels: {
    email: {
      recipients: ['team@example.com']
    },
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#alerts'
    },
    pagerDuty: {
      integrationKey: process.env.PAGERDUTY_KEY
    }
  }
})

// Define alert rules
alerts.defineRule({
  name: 'high-error-rate',
  condition: {
    metric: 'http_error_rate',
    threshold: 0.05, // 5% error rate
    window: '5m',
    operator: '>'
  },
  severity: 'critical',
  channels: ['slack', 'pagerDuty'],
  message: 'High error rate detected in the application'
})

// Manually trigger an alert
alerts.trigger('custom-alert', {
  message: 'Database connection failed',
  severity: 'critical',
  metadata: {
    service: 'database',
    error: 'Connection timeout'
  },
  channels: ['email', 'slack']
})
\`\`\`

## Dashboard & Visualization

The GRA Core Platform provides built-in dashboards for visualizing metrics, traces, and logs. You can also integrate with:

- Grafana
- Kibana
- Datadog
- New Relic

For more information on performance optimization, refer to our [Performance Optimization](/docs/05_Development%20Guide/performance-optimization) guide.`,
        lastUpdated: "2024-01-05",
      },
      "06_GCP Feature InDepth/cloud-functions": {
        title: "Cloud Functions",
        content: `# Cloud Functions

This guide provides an in-depth look at using Google Cloud Functions with the GRA Core Platform.

## Overview

Google Cloud Functions is a serverless execution environment for building and connecting cloud services. With the GRA Core Platform, you can easily create, deploy, and manage Cloud Functions as part of your application architecture.

## Getting Started

### Prerequisites

1. Google Cloud Platform account with billing enabled
2. Google Cloud SDK installed
3. GRA Core Platform API key
4. Node.js 14+ or Python 3.7+

### Installation

\`\`\`bash
npm install @gra-core/platform @google-cloud/functions-framework
\`\`\`

## Creating Your First Cloud Function

### HTTP Function

\`\`\`javascript
// index.js
const { cloudFunctions } = require('@gra-core/platform');

exports.helloWorld = cloudFunctions.http((req, res) => {
  const name = req.query.name || 'World';
  res.send(\`Hello \${name}!\`);
});
\`\`\`

### Event-Triggered Function

\`\`\`javascript
// index.js
const { cloudFunctions } = require('@gra-core/platform');

exports.processNewUser = cloudFunctions.firestore.onWrite('users/{userId}', async (change, context) => {
  // Get the user data
  const userData = change.after.exists ? change.after.data() : null;
  const userId = context.params.userId;
  
  if (!userData) {
    console.log(\`User \${userId} was deleted\`);
    return;
  }
  
  if (!change.before.exists) {
    console.log(\`New user created: \${userId}\`);
    // Process new user
    await sendWelcomeEmail(userData.email);
  } else {
    console.log(\`User updated: \${userId}\`);
    // Process user update
  }
});

async function sendWelcomeEmail(email) {
  // Implementation details
}
\`\`\`

## Deployment

### Using GRA CLI

\`\`\`bash
gra-cli deploy function helloWorld --runtime nodejs14 --trigger-http
\`\`\`

### Using Google Cloud SDK

\`\`\`bash
gcloud functions deploy helloWorld \\
  --runtime nodejs14 \\
  --trigger-http \\
  --allow-unauthenticated
\`\`\`

## Advanced Features

### Authentication & Authorization

\`\`\`javascript
const { cloudFunctions, auth } = require('@gra-core/platform');

exports.secureFunction = cloudFunctions.http(async (req, res) => {
  try {
    // Verify authentication token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      res.status(401).send('Unauthorized');
      return;
    }
    
    const decodedToken = await auth.verifyToken(token);
    
    // Check permissions
    if (!await auth.hasPermission(decodedToken.uid, 'function:access')) {
      res.status(403).send('Forbidden');
      return;
    }
    
    // Process authenticated request
    res.send(\`Hello \${decodedToken.name}!\`);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).send('Authentication failed');
  }
});
\`\`\`

### Environment Variables

\`\`\`javascript
const { cloudFunctions } = require('@gra-core/platform');

exports.configuredFunction = cloudFunctions.http((req, res) => {
  const apiKey = process.env.API_KEY;
  const environment = process.env.ENVIRONMENT;
  
  res.send(\`Running in \${environment} environment\`);
});
\`\`\`

### Error Handling

\`\`\`javascript
const { cloudFunctions } = require('@gra-core/platform');

exports.robustFunction = cloudFunctions.http(async (req, res) => {
  try {
    // Function logic
    const result = await processData(req.body);
    res.send(result);
  } catch (error) {
    console.error('Function error:', error);
    
    // Structured error response
    res.status(500).send({
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
    
    // Log to monitoring system
    await cloudFunctions.monitoring.logError(error, {
      severity: 'ERROR',
      context: {
        function: 'robustFunction',
        requestId: req.headers['x-request-id']
      }
    });
  }
});
\`\`\`

## Integration with GRA Core Platform

### Data Access

\`\`\`javascript
const { cloudFunctions, data } = require('@gra-core/platform');

exports.getUserData = cloudFunctions.http(async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    res.status(400).send('Missing userId parameter');
    return;
  }
  
  try {
    const user = await data.get('User', userId);
    
    if (!user) {
      res.status(404).send('User not found');
      return;
    }
    
    res.send(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Internal server error');
  }
});
\`\`\`

### Event Publishing

\`\`\`javascript
const { cloudFunctions, events } = require('@gra-core/platform');

exports.processOrder = cloudFunctions.http(async (req, res) => {
  const { orderId, items, customer } = req.body;
  
  try {
    // Process the order
    const order = await createOrder(orderId, items, customer);
    
    // Publish event
    await events.publish('order.created', {
      orderId: order.id,
      customerId: customer.id,
      totalAmount: order.totalAmount,
      timestamp: new Date().toISOString()
    });
    
    res.send({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).send('Failed to process order');
  }
});
\`\`\`

## Monitoring & Logging

For detailed information on monitoring Cloud Functions, refer to our [Advanced Monitoring](/docs/05_Development%20Guide/advanced-monitoring) guide.

## Best Practices

1. **Keep functions focused** - Each function should do one thing well
2. **Optimize cold start times** - Minimize dependencies and initialization code
3. **Handle errors gracefully** - Implement proper error handling and logging
4. **Set appropriate timeouts** - Configure timeouts based on function requirements
5. **Use environment variables** for configuration
6. **Implement proper authentication** for secure functions
7. **Monitor function performance** and errors

## Related Resources

- [Cloud Storage](/docs/06_GCP%20Feature%20InDepth/cloud-storage) - Learn how to use Cloud Storage with your functions
- [Security Best Practices](/docs/05_Development%20Guide/security-best-practices) - Security considerations for serverless functions`,
        lastUpdated: "2024-01-03",
      },
      "06_GCP Feature InDepth/cloud-storage": {
        title: "Cloud Storage",
        content: `# Cloud Storage

This guide provides an in-depth look at using Google Cloud Storage with the GRA Core Platform.

## Overview

Google Cloud Storage is a RESTful online file storage web service for storing and accessing data on Google Cloud Platform infrastructure. The GRA Core Platform provides seamless integration with Cloud Storage for managing files and assets in your applications.

## Getting Started

### Prerequisites

1. Google Cloud Platform account with billing enabled
2. Google Cloud Storage bucket created
3. Service account with appropriate permissions
4. GRA Core Platform API key

### Installation

\`\`\`bash
npm install @gra-core/platform @google-cloud/storage
\`\`\`

## Basic Usage

### Initializing the Storage Client

\`\`\`javascript
const { storage } = require('@gra-core/platform');

// Initialize with default credentials
const cloudStorage = storage.initialize({
  projectId: 'your-gcp-project-id',
  keyFilename: '/path/to/service-account-key.json' // Optional
});

// Access a bucket
const bucket = cloudStorage.bucket('your-bucket-name');
\`\`\`

### Uploading Files

\`\`\`javascript
async function uploadFile(filePath, destination) {
  try {
    const [file] = await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'application/octet-stream', // Set appropriate content type
        metadata: {
          uploadedBy: 'gra-platform',
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log(\`File \${filePath} uploaded to \${file.name}\`);
    return file;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Usage
uploadFile('/local/path/to/file.pdf', 'documents/file.pdf')
  .then(file => console.log('Upload complete'))
  .catch(err => console.error('Upload failed:', err));
\`\`\`

### Downloading Files

\`\`\`javascript
async function downloadFile(fileName, destinationPath) {
  try {
    const options = {
      destination: destinationPath
    };
    
    await bucket.file(fileName).download(options);
    console.log(\`File \${fileName} downloaded to \${destinationPath}\`);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Usage
downloadFile('documents/file.pdf', '/local/path/to/downloaded-file.pdf')
  .then(() => console.log('Download complete'))
  .catch(err => console.error('Download failed:', err));
\`\`\`

### Listing Files

\`\`\`javascript
async function listFiles(prefix) {
  try {
    const options = {
      prefix: prefix || '',
      delimiter: '/'
    };
    
    const [files] = await bucket.getFiles(options);
    
    console.log('Files:');
    files.forEach(file => {
      console.log(file.name);
    });
    
    return files;
  } catch (error) {
    console.error('List error:', error);
    throw error;
  }
}

// Usage
listFiles('documents/')
  .then(files => console.log(\`Found \${files.length} files\`))
  .catch(err => console.error('Listing failed:', err));
\`\`\`

## Advanced Features

### Generating Signed URLs

\`\`\`javascript
async function generateSignedUrl(fileName, expirationMinutes = 15) {
  try {
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000
    };
    
    const [url] = await bucket.file(fileName).getSignedUrl(options);
    console.log(\`Generated signed URL for \${fileName}: \${url}\`);
    return url;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw error;
  }
}

// Usage
generateSignedUrl('documents/confidential.pdf', 30)
  .then(url => console.log('URL:', url))
  .catch(err => console.error('Failed to generate URL:', err));
\`\`\`

### Setting File Metadata

\`\`\`javascript
async function setFileMetadata(fileName, metadata) {
  try {
    const file = bucket.file(fileName);
    await file.setMetadata({ metadata });
    console.log(\`Metadata set for \${fileName}\`);
  } catch (error) {
    console.error('Metadata error:', error);
    throw error;
  }
}

// Usage
setFileMetadata('documents/file.pdf', {
  owner: 'john.doe',
  department: 'finance',
  confidential: 'true'
})
  .then(() => console.log('Metadata updated'))
  .catch(err => console.error('Failed to update metadata:', err));
\`\`\`

### Managing File Access Control

\`\`\`javascript
async function makeFilePublic(fileName) {
  try {
    await bucket.file(fileName).makePublic();
    console.log(\`\${fileName} is now public\`);
  } catch (error) {
    console.error('Access control error:', error);
    throw error;
  }
}

async function makeFilePrivate(fileName) {
  try {
    await bucket.file(fileName).makePrivate();
    console.log(\`\${fileName} is now private\`);
  } catch (error) {
    console.error('Access control error:', error);
    throw error;
  }
}

// Usage
makeFilePublic('public/logo.png')
  .then(() => console.log('File is public'))
  .catch(err => console.error('Failed to make file public:', err));
\`\`\`

## Integration with GRA Core Platform

### File Management API

\`\`\`javascript
const { files } = require('@gra-core/platform');

// Register a storage provider
files.registerProvider('gcp', {
  type: 'google-cloud-storage',
  config: {
    projectId: 'your-gcp-project-id',
    keyFilename: '/path/to/service-account-key.json',
    bucket: 'your-bucket-name'
  }
});

// Upload a file
async function uploadUserDocument(userId, fileBuffer, fileName) {
  try {
    const file = await files.upload('gcp', {
      path: \`users/\${userId}/documents/\${fileName}\`,
      content: fileBuffer,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Register the file in the platform's file registry
    await files.register({
      providerId: 'gcp',
      path: file.path,
      name: fileName,
      size: file.size,
      mimeType: file.contentType,
      ownerId: userId,
      visibility: 'private'
    });
    
    return file;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}
\`\`\`

### Event-Driven Processing

\`\`\`javascript
const { events, cloudFunctions } = require('@gra-core/platform');

// Listen for new file uploads
exports.processNewFile = cloudFunctions.storage.onFinalize('your-bucket-name', async (file) => {
  console.log(\`New file uploaded: \${file.name}\`);
  
  // Process the file based on type
  if (file.contentType.startsWith('image/')) {
    await processImage(file);
  } else if (file.contentType === 'application/pdf') {
    await processPdf(file);
  }
  
  // Publish event
  await events.publish('file.processed', {
    fileId: file.id,
    name: file.name,
    contentType: file.contentType,
    size: file.size,
    timestamp: new Date().toISOString()
  });
});

async function processImage(file) {
  // Image processing logic
}

async function processPdf(file) {
  // PDF processing logic
}
\`\`\`

## Security Best Practices

1. **Use service accounts** with minimal required permissions
2. **Rotate service account keys** regularly
3. **Set appropriate bucket and object ACLs**
4. **Use signed URLs** for temporary access
5. **Enable Cloud Audit Logs** for storage operations
6. **Configure appropriate retention policies**
7. **Encrypt sensitive data** before uploading

## Performance Optimization

1. **Use regional buckets** close to your users
2. **Enable Cloud CDN** for frequently accessed public files
3. **Use composite objects** for large files
4. **Implement resumable uploads** for large files
5. **Set appropriate cache control headers**

## Related Resources

- [Cloud Functions](/docs/06_GCP%20Feature%20InDepth/cloud-functions) - Learn how to process files with Cloud Functions
- [Security Best Practices](/docs/05_Development%20Guide/security-best-practices) - Security considerations for file storage`,
        lastUpdated: "2024-01-02",
      },
    }[slugPath] || null
  )
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = await getDocContent(slug)

  if (!doc) {
    notFound()
  }

  const currentHref = `/docs/${slug.join("/")}`
  const { previousPage, nextPage } = getNavigation(currentHref)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />

      <div className="flex">
        {/* Fixed Left Sidebar */}
        <div className="fixed left-0 top-0 bottom-0 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
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
        <div className="fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto pt-20">
          <div className="p-6">
            <TableOfContents content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  // Pre-generate only the main top-level pages; everything else is rendered on demand.
  return [
    { slug: ["introduction"] },
    { slug: ["user-guide"] },
    { slug: ["api-reference"] },
    { slug: ["examples"] },
    { slug: ["development"] },
    { slug: ["architecture"] },
  ]
}
