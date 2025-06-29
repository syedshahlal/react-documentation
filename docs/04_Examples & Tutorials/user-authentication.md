# User Authentication Tutorial

Learn how to implement secure user authentication in your GRA Core Platform application.

## Overview

This tutorial covers:
- Setting up authentication
- User registration and login
- Token management
- Protected routes
- Session handling

## Authentication Setup

### 1. Install Authentication Module

\`\`\`bash
npm install @gra-core/auth
\`\`\`

### 2. Configure Authentication

\`\`\`javascript
import { GRAAuth } from '@gra-core/auth'

const auth = new GRAAuth({
  apiKey: process.env.GRA_API_KEY,
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['read', 'write', 'admin']
})
\`\`\`

## User Registration

### Basic Registration

\`\`\`javascript
async function registerUser(userData) {
  try {
    const result = await auth.register({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
    
    console.log('User registered:', result.user)
    return result
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}
\`\`\`

### Registration with Email Verification

\`\`\`javascript
async function registerWithVerification(userData) {
  try {
    const result = await auth.register({
      ...userData,
      requireEmailVerification: true
    })
    
    // Send verification email
    await auth.sendVerificationEmail(result.user.email)
    
    return result
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}
\`\`\`

## User Login

### Standard Login

\`\`\`javascript
async function loginUser(credentials) {
  try {
    const result = await auth.login({
      email: credentials.email,
      password: credentials.password
    })
    
    // Store tokens securely
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    
    return result
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}
\`\`\`

### OAuth Login

\`\`\`javascript
async function loginWithOAuth(provider) {
  try {
    // Redirect to OAuth provider
    const authUrl = await auth.getOAuthUrl(provider)
    window.location.href = authUrl
  } catch (error) {
    console.error('OAuth login failed:', error)
    throw error
  }
}

// Handle OAuth callback
async function handleOAuthCallback(code) {
  try {
    const result = await auth.exchangeOAuthCode(code)
    
    // Store tokens
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    
    return result
  } catch (error) {
    console.error('OAuth callback failed:', error)
    throw error
  }
}
\`\`\`

## Token Management

### Automatic Token Refresh

\`\`\`javascript
// Set up automatic token refresh
auth.onTokenExpired(async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    const result = await auth.refreshToken(refreshToken)
    
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
  } catch (error) {
    // Redirect to login if refresh fails
    window.location.href = '/login'
  }
})
\`\`\`

### Manual Token Validation

\`\`\`javascript
async function validateToken() {
  try {
    const token = localStorage.getItem('accessToken')
    const isValid = await auth.validateToken(token)
    
    if (!isValid) {
      // Token is invalid, redirect to login
      window.location.href = '/login'
    }
    
    return isValid
  } catch (error) {
    console.error('Token validation failed:', error)
    return false
  }
}
\`\`\`

## Protected Routes

### Middleware Example

\`\`\`javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  auth.validateToken(token)
    .then(isValid => {
      if (isValid) {
        next()
      } else {
        res.status(401).json({ error: 'Invalid token' })
      }
    })
    .catch(error => {
      res.status(500).json({ error: 'Token validation failed' })
    })
}

// Use middleware
app.get('/protected', requireAuth, (req, res) => {
  res.json({ message: 'This is a protected route' })
})
\`\`\`

## Session Management

### Session Storage

\`\`\`javascript
class SessionManager {
  static setSession(user, tokens) {
    sessionStorage.setItem('user', JSON.stringify(user))
    sessionStorage.setItem('accessToken', tokens.accessToken)
    sessionStorage.setItem('refreshToken', tokens.refreshToken)
  }
  
  static getSession() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null')
    const accessToken = sessionStorage.getItem('accessToken')
    const refreshToken = sessionStorage.getItem('refreshToken')
    
    return { user, accessToken, refreshToken }
  }
  
  static clearSession() {
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
  }
}
\`\`\`

## Best Practices

### Security Considerations

1. **Never store sensitive data in localStorage**
2. **Use HTTPS in production**
3. **Implement proper CORS policies**
4. **Validate tokens on every request**
5. **Use secure, httpOnly cookies when possible**

### Error Handling

\`\`\`javascript
class AuthError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

function handleAuthError(error) {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password'
    case 'USER_NOT_FOUND':
      return 'User account not found'
    case 'TOKEN_EXPIRED':
      return 'Session expired, please login again'
    default:
      return 'Authentication failed'
  }
}
\`\`\`

## Complete Example

\`\`\`javascript
import { GRAAuth } from '@gra-core/auth'

class AuthService {
  constructor() {
    this.auth = new GRAAuth({
      apiKey: process.env.GRA_API_KEY,
      redirectUri: window.location.origin + '/callback'
    })
    
    this.setupTokenRefresh()
  }
  
  async login(email, password) {
    try {
      const result = await this.auth.login({ email, password })
      SessionManager.setSession(result.user, result.tokens)
      return result
    } catch (error) {
      throw new AuthError(handleAuthError(error), error.code)
    }
  }
  
  async logout() {
    try {
      await this.auth.logout()
      SessionManager.clearSession()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  setupTokenRefresh() {
    this.auth.onTokenExpired(async () => {
      const { refreshToken } = SessionManager.getSession()
      if (refreshToken) {
        try {
          const result = await this.auth.refreshToken(refreshToken)
          SessionManager.setSession(result.user, result.tokens)
        } catch (error) {
          this.logout()
        }
      }
    })
  }
}

export default new AuthService()
\`\`\`

## Next Steps

- Learn about [Data Management](./data-management.md)
- Explore [Advanced Security Features](../05_Development%20Guide/security-best-practices.md)
- Check out [API Reference](../03_API%20Reference/api-reference.md)
