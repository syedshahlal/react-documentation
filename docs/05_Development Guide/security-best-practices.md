# Security Best Practices

Comprehensive guide to securing your GRA Core Platform applications.

## Overview

This guide covers essential security practices including:
- Authentication and authorization
- Data encryption
- Input validation and sanitization
- API security
- Infrastructure security
- Monitoring and logging

## Authentication Security

### Strong Password Policies

\`\`\`javascript
import bcrypt from 'bcrypt'
import zxcvbn from 'zxcvbn'

class PasswordSecurity {
  static validatePassword(password) {
    const result = zxcvbn(password)
    
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      strongEnough: result.score >= 3
    }
    
    const isValid = Object.values(requirements).every(req => req)
    
    return {
      isValid,
      requirements,
      score: result.score,
      feedback: result.feedback
    }
  }
  
  static async hashPassword(password) {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }
  
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash)
  }
}
\`\`\`

### Multi-Factor Authentication (MFA)

\`\`\`javascript
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

class MFAService {
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `GRA Core Platform (${userEmail})`,
      issuer: 'GRA Core Platform',
      length: 32
    })
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    }
  }
  
  static async generateQRCode(otpauth_url) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth_url)
      return qrCodeDataURL
    } catch (error) {
      throw new Error('Failed to generate QR code')
    }
  }
  
  static verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) of variance
    })
  }
}
\`\`\`

### JWT Security

\`\`\`javascript
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

class JWTSecurity {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET
    this.accessTokenExpiry = '15m'
    this.refreshTokenExpiry = '7d'
  }
  
  generateTokenPair(payload) {
    const jti = crypto.randomUUID() // Unique token ID
    
    const accessToken = jwt.sign(
      { ...payload, jti, type: 'access' },
      this.accessTokenSecret,
      { 
        expiresIn: this.accessTokenExpiry,
        issuer: 'gra-core-platform',
        audience: 'gra-core-api'
      }
    )
    
    const refreshToken = jwt.sign(
      { userId: payload.userId, jti, type: 'refresh' },
      this.refreshTokenSecret,
      { 
        expiresIn: this.refreshTokenExpiry,
        issuer: 'gra-core-platform',
        audience: 'gra-core-api'
      }
    )
    
    return { accessToken, refreshToken, jti }
  }
  
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'gra-core-platform',
        audience: 'gra-core-api'
      })
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }
  
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'gra-core-platform',
        audience: 'gra-core-api'
      })
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }
}
\`\`\`

## Data Encryption

### Encryption at Rest

\`\`\`javascript
import crypto from 'crypto'

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm'
    this.keyLength = 32
    this.ivLength = 16
    this.tagLength = 16
    this.masterKey = Buffer.from(process.env.MASTER_KEY, 'hex')
  }
  
  encrypt(plaintext) {
    try {
      const iv = crypto.randomBytes(this.ivLength)
      const cipher = crypto.createCipher(this.algorithm, this.masterKey, iv)
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      throw new Error('Encryption failed')
    }
  }
  
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, tag } = encryptedData
      const decipher = crypto.createDecipher(
        this.algorithm,
        this.masterKey,
        Buffer.from(iv, 'hex')
      )
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error('Decryption failed')
    }
  }
  
  // Field-level encryption for sensitive data
  encryptField(value) {
    if (!value) return null
    return this.encrypt(JSON.stringify(value))
  }
  
  decryptField(encryptedValue) {
    if (!encryptedValue) return null
    const decrypted = this.decrypt(encryptedValue)
    return JSON.parse(decrypted)
  }
}
\`\`\`

### Encryption in Transit

\`\`\`javascript
import https from 'https'
import fs from 'fs'

// HTTPS configuration
const httpsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-certificate.pem'),
  
  // Security settings
  secureProtocol: 'TLSv1_2_method',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  honorCipherOrder: true
}

// Create HTTPS server
const server = https.createServer(httpsOptions, app)
\`\`\`

## Input Validation and Sanitization

### Comprehensive Input Validation

\`\`\`javascript
import Joi from 'joi'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

class InputValidator {
  static schemas = {
    user: Joi.object({
      email: Joi.string().email().required(),
      firstName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
      lastName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
      age: Joi.number().integer().min(13).max(120),
      phone: Joi.string().pattern(/^\+?[\d\s\-$$$$]+$/),
      website: Joi.string().uri()
    }),
    
    product: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().max(1000),
      price: Joi.number().positive().precision(2).required(),
      category: Joi.string().valid('electronics', 'clothing', 'books', 'home').required()
    })
  }
  
  static validate(data, schemaName) {
    const schema = this.schemas[schemaName]
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`)
    }
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
      throw new ValidationError('Validation failed', errors)
    }
    
    return value
  }
  
  static sanitizeHtml(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  }
  
  static sanitizeString(str) {
    if (typeof str !== 'string') return str
    
    return validator.escape(str.trim())
  }
  
  static validateAndSanitize(data, schemaName) {
    // First validate structure
    const validatedData = this.validate(data, schemaName)
    
    // Then sanitize string fields
    const sanitized = {}
    for (const [key, value] of Object.entries(validatedData)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }
}
\`\`\`

### SQL Injection Prevention

\`\`\`javascript
import { GRAData } from '@gra-core/data'

class SecureDataAccess {
  constructor() {
    this.db = new GRAData({
      apiKey: process.env.GRA_API_KEY,
      // Enable parameterized queries
      useParameterizedQueries: true,
      // Disable dynamic query building
      allowDynamicQueries: false
    })
  }
  
  // Safe query with parameters
  async findUserByEmail(email) {
    // This uses parameterized queries internally
    return await this.db.User.findOne({ email })
  }
  
  // Safe raw query (if needed)
  async customQuery(userId) {
    const query = `
      SELECT u.*, p.name as profile_name 
      FROM users u 
      LEFT JOIN profiles p ON u.id = p.user_id 
      WHERE u.id = ?
    `
    
    return await this.db.raw(query, [userId])
  }
  
  // Dangerous - DON'T DO THIS
  async unsafeQuery(userInput) {
    // This is vulnerable to SQL injection
    const query = `SELECT * FROM users WHERE name = '${userInput}'`
    return await this.db.raw(query) // NEVER DO THIS
  }
}
\`\`\`

## API Security

### Rate Limiting

\`\`\`javascript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Different rate limits for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:'
    }),
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip
    }
  })
}

// Apply different limits
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests')
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts')
const apiLimiter = createRateLimiter(60 * 1000, 1000, 'API rate limit exceeded')

// Usage
app.use('/api/', apiLimiter)
app.use('/auth/', authLimiter)
app.use(generalLimiter)
\`\`\`

### CORS Configuration

\`\`\`javascript
import cors from 'cors'

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}

app.use(cors(corsOptions))
\`\`\`

### API Key Management

\`\`\`javascript
class APIKeyManager {
  static async generateAPIKey(userId, permissions = []) {
    const keyId = crypto.randomUUID()
    const keySecret = crypto.randomBytes(32).toString('hex')
    const hashedSecret = await bcrypt.hash(keySecret, 12)
    
    const apiKey = {
      id: keyId,
      userId,
      hashedSecret,
      permissions,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
    
    await APIKey.create(apiKey)
    
    // Return the full key only once
    return {
      keyId,
      keySecret: `gra_${keyId}_${keySecret}`,
      permissions
    }
  }
  
  static async validateAPIKey(keyString) {
    try {
      const [prefix, keyId, keySecret] = keyString.split('_')
      
      if (prefix !== 'gra' || !keyId || !keySecret) {
        throw new Error('Invalid API key format')
      }
      
      const apiKey = await APIKey.findOne({ 
        id: keyId, 
        isActive: true,
        expiresAt: { $gt: new Date() }
      })
      
      if (!apiKey) {
        throw new Error('API key not found or expired')
      }
      
      const isValid = await bcrypt.compare(keySecret, apiKey.hashedSecret)
      if (!isValid) {
        throw new Error('Invalid API key')
      }
      
      // Update last used timestamp
      await APIKey.updateOne(
        { id: keyId },
        { lastUsedAt: new Date() }
      )
      
      return {
        userId: apiKey.userId,
        permissions: apiKey.permissions
      }
    } catch (error) {
      throw new Error('API key validation failed')
    }
  }
}
\`\`\`

## Infrastructure Security

### Environment Configuration

\`\`\`javascript
// config/security.js
export const securityConfig = {
  // Helmet.js configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.API_BASE_URL]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  }
}
\`\`\`

### Security Headers

\`\`\`javascript
import helmet from 'helmet'

app.use(helmet(securityConfig.helmet))

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})
\`\`\`

## Monitoring and Logging

### Security Event Logging

\`\`\`javascript
import winston from 'winston'

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

class SecurityMonitor {
  static logAuthAttempt(req, success, userId = null) {
    securityLogger.info('Authentication attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success,
      userId,
      timestamp: new Date().toISOString()
    })
  }
  
  static logSuspiciousActivity(req, activity, details = {}) {
    securityLogger.warn('Suspicious activity detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      activity,
      details,
      timestamp: new Date().toISOString()
    })
  }
  
  static logSecurityEvent(event, severity, details = {}) {
    securityLogger.log(severity, 'Security event', {
      event,
      details,
      timestamp: new Date().toISOString()
    })
  }
}
\`\`\`

### Intrusion Detection

\`\`\`javascript
class IntrusionDetection {
  static suspiciousPatterns = [
    /union.*select/i,
    /script.*alert/i,
    /<script/i,
    /javascript:/i,
    /eval\(/i,
    /document\.cookie/i
  ]
  
  static checkForSQLInjection(input) {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\b(or|and)\b.*=.*)/i
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }
  
  static checkForXSS(input) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }
  
  static analyzeRequest(req) {
    const threats = []
    
    // Check all input fields
    const inputs = { ...req.query, ...req.body, ...req.params }
    
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string') {
        if (this.checkForSQLInjection(value)) {
          threats.push({ type: 'sql_injection', field: key, value })
        }
        
        if (this.checkForXSS(value)) {
          threats.push({ type: 'xss', field: key, value })
        }
        
        // Check for suspicious patterns
        this.suspiciousPatterns.forEach(pattern => {
          if (pattern.test(value)) {
            threats.push({ type: 'suspicious_pattern', field: key, pattern: pattern.source })
          }
        })
      }
    }
    
    return threats
  }
}

// Middleware to detect threats
app.use((req, res, next) => {
  const threats = IntrusionDetection.analyzeRequest(req)
  
  if (threats.length > 0) {
    SecurityMonitor.logSuspiciousActivity(req, 'potential_attack', { threats })
    
    // Block request if high-risk threats detected
    const highRiskThreats = threats.filter(t => 
      ['sql_injection', 'xss'].includes(t.type)
    )
    
    if (highRiskThreats.length > 0) {
      return res.status(403).json({ error: 'Request blocked for security reasons' })
    }
  }
  
  next()
})
\`\`\`

## Security Checklist

### Development Checklist

- [ ] All user inputs are validated and sanitized
- [ ] Parameterized queries are used for database operations
- [ ] Sensitive data is encrypted at rest and in transit
- [ ] Strong authentication mechanisms are implemented
- [ ] API endpoints are properly secured with rate limiting
- [ ] Security headers are configured
- [ ] Error messages don't leak sensitive information
- [ ] Logging captures security events
- [ ] Dependencies are regularly updated
- [ ] Security tests are included in CI/CD pipeline

### Production Checklist

- [ ] HTTPS is enforced
- [ ] Security headers are properly configured
- [ ] Rate limiting is active
- [ ] Monitoring and alerting are set up
- [ ] Regular security audits are scheduled
- [ ] Backup and recovery procedures are tested
- [ ] Access controls are properly configured
- [ ] Security patches are applied promptly

## Next Steps

- Learn about [Performance Optimization](./performance-optimization.md)
- Explore [Advanced Monitoring](./advanced-monitoring.md)
- Check out [Deployment Security](../06_GCP%20Feature%20InDepth/deployment-security.md)
