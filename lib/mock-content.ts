"use client"

export const mockContent: Record<string, string> = {
  'introduction': `# GRA Core Platform Introduction

Welcome to the **GRA Core Platform** - a comprehensive cloud-native solution built on Google Cloud Platform (GCP) that provides enterprise-grade infrastructure, security, and scalability for modern applications.

## What is GRA Core Platform?

The GRA Core Platform is an integrated suite of services and tools designed to accelerate application development and deployment while maintaining the highest standards of security, performance, and reliability.

### Key Features

- **Cloud-Native Architecture**: Built from the ground up for Google Cloud Platform
- **Enterprise Security**: Advanced security features including IAM, encryption, and compliance
- **Auto-Scaling**: Intelligent scaling based on demand and usage patterns
- **Multi-Region Support**: Global deployment capabilities with regional failover
- **Developer-Friendly**: Comprehensive APIs and SDKs for rapid integration

## Architecture Overview

The platform consists of several core components:

### 1. Compute Layer
- **Google Kubernetes Engine (GKE)** for container orchestration
- **Cloud Run** for serverless container deployment
- **Compute Engine** for virtual machine instances

### 2. Data Layer
- **Cloud SQL** for relational databases
- **Firestore** for NoSQL document storage
- **Cloud Storage** for object storage
- **BigQuery** for data analytics

### 3. Security Layer
- **Identity and Access Management (IAM)**
- **Cloud Security Command Center**
- **Binary Authorization** for container security
- **Cloud KMS** for key management

### 4. Networking Layer
- **Virtual Private Cloud (VPC)**
- **Cloud Load Balancing**
- **Cloud CDN** for content delivery
- **Cloud DNS** for domain name resolution

## Getting Started

To begin using the GRA Core Platform:

1. **Set up your GCP project** with billing enabled
2. **Configure authentication** using service accounts
3. **Deploy your first application** using our quickstart guide
4. **Monitor and scale** using built-in observability tools

## Support and Resources

- **Documentation**: Comprehensive guides and API references
- **Community**: Active developer community and forums
- **Support**: 24/7 enterprise support available
- **Training**: Certification programs and workshops

Ready to get started? Check out our [User Guide](/docs/user-guide) for detailed setup instructions.`,

  'user-guide': `# User Guide

This comprehensive guide will walk you through setting up and using the GRA Core Platform effectively.

## Prerequisites

Before you begin, ensure you have:

- A Google Cloud Platform account with billing enabled
- Administrative access to create projects and resources
- Basic familiarity with cloud computing concepts
- Command line tools installed (gcloud CLI, kubectl)

## Initial Setup

### 1. Project Configuration

First, create a new GCP project or select an existing one:

\`\`\`bash
# Create a new project
gcloud projects create your-project-id --name="GRA Core Platform"

# Set the project as default
gcloud config set project your-project-id
\`\`\`

### 2. Enable Required APIs

Enable the necessary Google Cloud APIs:

\`\`\`bash
gcloud services enable container.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable storage-component.googleapis.com
\`\`\`

### 3. Authentication Setup

Create a service account for the platform:

\`\`\`bash
gcloud iam service-accounts create gra-core-sa \\
    --description="GRA Core Platform Service Account" \\
    --display-name="GRA Core SA"
\`\`\`

Grant necessary permissions:

\`\`\`bash
gcloud projects add-iam-policy-binding your-project-id \\
    --member="serviceAccount:gra-core-sa@your-project-id.iam.gserviceaccount.com" \\
    --role="roles/editor"
\`\`\`

## Configuration

### Environment Variables

Set up your environment variables:

\`\`\`bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export GRA_ENVIRONMENT="production"
\`\`\`

### Network Configuration

Create a VPC network for your resources:

\`\`\`bash
gcloud compute networks create gra-vpc --subnet-mode=custom
gcloud compute networks subnets create gra-subnet \\
    --network=gra-vpc \\
    --range=10.0.0.0/24 \\
    --region=us-central1
\`\`\`

## Deployment

### Container Deployment

Deploy your application using Cloud Run:

\`\`\`bash
gcloud run deploy gra-app \\
    --image=gcr.io/your-project-id/your-app \\
    --platform=managed \\
    --region=us-central1 \\
    --allow-unauthenticated
\`\`\`

### Database Setup

Create a Cloud SQL instance:

\`\`\`bash
gcloud sql instances create gra-db \\
    --database-version=POSTGRES_13 \\
    --tier=db-f1-micro \\
    --region=us-central1
\`\`\`

## Monitoring and Logging

The platform includes comprehensive monitoring capabilities:

- **Cloud Monitoring**: Real-time metrics and alerting
- **Cloud Logging**: Centralized log management
- **Error Reporting**: Automatic error detection and reporting
- **Cloud Trace**: Distributed tracing for performance analysis

## Best Practices

1. **Security**: Always use least-privilege access principles
2. **Scaling**: Configure auto-scaling based on your traffic patterns
3. **Backup**: Implement regular backup strategies for your data
4. **Monitoring**: Set up proactive monitoring and alerting

For more detailed information, see our [API Reference](/docs/api-reference) and [Examples & Tutorials](/docs/basic-setup).`,

  'api-reference': `# API Reference

The GRA Core Platform provides a comprehensive REST API for managing resources and integrating with your applications.

## Base URL

All API requests should be made to:
\`\`\`
https://api.gra-core.com/v1
\`\`\`

## Authentication

The API uses Bearer token authentication. Include your API key in the Authorization header:

\`\`\`http
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limiting

API requests are limited to:
- **1000 requests per hour** for standard accounts
- **10000 requests per hour** for premium accounts

Rate limit headers are included in all responses:
\`\`\`http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
\`\`\`

## Resources

### Projects

Manage GCP projects and configurations.

#### List Projects
\`\`\`http
GET /projects
\`\`\`

Response:
\`\`\`json
{
  "projects": [
    {
      "id": "project-123",
      "name": "My Project",
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
\`\`\`

#### Create Project
\`\`\`http
POST /projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "region": "us-central1"
}
\`\`\`

#### Get Project
\`\`\`http
GET /projects/{project_id}
\`\`\`

#### Update Project
\`\`\`http
PUT /projects/{project_id}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
\`\`\`

#### Delete Project
\`\`\`http
DELETE /projects/{project_id}
\`\`\`

### Applications

Deploy and manage applications on the platform.

#### List Applications
\`\`\`http
GET /projects/{project_id}/applications
\`\`\`

#### Deploy Application
\`\`\`http
POST /projects/{project_id}/applications
Content-Type: application/json

{
  "name": "my-app",
  "image": "gcr.io/project/app:latest",
  "port": 8080,
  "environment": {
    "NODE_ENV": "production"
  }
}
\`\`\`

#### Get Application
\`\`\`http
GET /projects/{project_id}/applications/{app_id}
\`\`\`

#### Update Application
\`\`\`http
PUT /projects/{project_id}/applications/{app_id}
Content-Type: application/json

{
  "image": "gcr.io/project/app:v2",
  "replicas": 3
}
\`\`\`

#### Delete Application
\`\`\`http
DELETE /projects/{project_id}/applications/{app_id}
\`\`\`

### Databases

Manage Cloud SQL instances and databases.

#### List Databases
\`\`\`http
GET /projects/{project_id}/databases
\`\`\`

#### Create Database
\`\`\`http
POST /projects/{project_id}/databases
Content-Type: application/json

{
  "name": "my-database",
  "engine": "postgresql",
  "version": "13",
  "tier": "db-f1-micro"
}
\`\`\`

### Storage

Manage Cloud Storage buckets and objects.

#### List Buckets
\`\`\`http
GET /projects/{project_id}/storage/buckets
\`\`\`

#### Create Bucket
\`\`\`http
POST /projects/{project_id}/storage/buckets
Content-Type: application/json

{
  "name": "my-bucket",
  "location": "us-central1",
  "storage_class": "STANDARD"
}
\`\`\`

#### Upload Object
\`\`\`http
POST /projects/{project_id}/storage/buckets/{bucket_name}/objects
Content-Type: multipart/form-data

file: [binary data]
\`\`\`

## Error Handling

The API uses standard HTTP status codes and returns error details in JSON format:

\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      }
    ]
  }
}
\`\`\`

Common error codes:
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`429\` - Too Many Requests
- \`500\` - Internal Server Error

## SDKs

Official SDKs are available for:
- **Node.js**: \`npm install @gra-core/node-sdk\`
- **Python**: \`pip install gra-core-python\`
- **Go**: \`go get github.com/gra-core/go-sdk\`
- **Java**: Maven/Gradle dependencies available

## Webhooks

Configure webhooks to receive real-time notifications:

\`\`\`http
POST /projects/{project_id}/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["application.deployed", "database.created"],
  "secret": "webhook-secret"
}
\`\`\`

For more examples, see our [Examples & Tutorials](/docs/basic-setup) section.`,

  'basic-setup': `# Basic Setup Tutorial

This tutorial will guide you through setting up your first application on the GRA Core Platform from scratch.

## Prerequisites

- GCP account with billing enabled
- \`gcloud\` CLI installed and configured
- Docker installed locally
- Basic knowledge of containerization

## Step 1: Project Setup

### Create a New Project

\`\`\`bash
# Create project
gcloud projects create my-gra-project --name="My GRA Project"

# Set as default
gcloud config set project my-gra-project

# Enable billing (replace BILLING_ACCOUNT_ID)
gcloud billing projects link my-gra-project --billing-account=BILLING_ACCOUNT_ID
\`\`\`

### Enable Required APIs

\`\`\`bash
gcloud services enable \\
    container.googleapis.com \\
    run.googleapis.com \\
    sql-component.googleapis.com \\
    storage-component.googleapis.com \\
    cloudbuild.googleapis.com
\`\`\`

## Step 2: Create a Sample Application

### Node.js Express App

Create a simple Express.js application:

\`\`\`javascript
// app.js
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from GRA Core Platform!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
\`\`\`

### Package Configuration

\`\`\`json
{
  "name": "gra-sample-app",
  "version": "1.0.0",
  "description": "Sample app for GRA Core Platform",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
\`\`\`

### Dockerfile

\`\`\`dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
\`\`\`

## Step 3: Build and Deploy

### Build Container Image

\`\`\`bash
# Build using Cloud Build
gcloud builds submit --tag gcr.io/my-gra-project/sample-app
\`\`\`

### Deploy to Cloud Run

\`\`\`bash
gcloud run deploy sample-app \\
    --image gcr.io/my-gra-project/sample-app \\
    --platform managed \\
    --region us-central1 \\
    --allow-unauthenticated \\
    --port 8080 \\
    --memory 512Mi \\
    --cpu 1 \\
    --max-instances 10
\`\`\`

## Step 4: Database Setup

### Create Cloud SQL Instance

\`\`\`bash
gcloud sql instances create sample-db \\
    --database-version=POSTGRES_13 \\
    --tier=db-f1-micro \\
    --region=us-central1 \\
    --root-password=secure-password
\`\`\`

### Create Database

\`\`\`bash
gcloud sql databases create sampleapp --instance=sample-db
\`\`\`

### Create Database User

\`\`\`bash
gcloud sql users create appuser \\
    --instance=sample-db \\
    --password=app-password
\`\`\`

## Step 5: Storage Setup

### Create Storage Bucket

\`\`\`bash
gsutil mb -l us-central1 gs://my-gra-project-storage
\`\`\`

### Set Bucket Permissions

\`\`\`bash
gsutil iam ch serviceAccount:sample-app@my-gra-project.iam.gserviceaccount.com:objectAdmin gs://my-gra-project-storage
\`\`\`

## Step 6: Environment Configuration

### Update Application with Database Connection

\`\`\`javascript
// Updated app.js with database
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      message: 'Hello from GRA Core Platform!',
      database_time: result.rows[0].current_time,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
\`\`\`

### Deploy with Environment Variables

\`\`\`bash
gcloud run deploy sample-app \\
    --image gcr.io/my-gra-project/sample-app \\
    --platform managed \\
    --region us-central1 \\
    --set-env-vars="DB_HOST=10.0.0.3,DB_NAME=sampleapp,DB_USER=appuser,DB_PASSWORD=app-password"
\`\`\`

## Step 7: Monitoring Setup

### Enable Cloud Monitoring

\`\`\`bash
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
\`\`\`

### Create Uptime Check

\`\`\`bash
gcloud alpha monitoring uptime create \\
    --display-name="Sample App Health Check" \\
    --http-check-path="/health" \\
    --hostname="your-cloud-run-url"
\`\`\`

## Step 8: Testing

### Test the Application

\`\`\`bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe sample-app --region=us-central1 --format="value(status.url)")

# Test the endpoint
curl $SERVICE_URL
curl $SERVICE_URL/health
\`\`\`

## Next Steps

Now that you have a basic application running:

1. **Security**: Implement proper authentication and authorization
2. **Scaling**: Configure auto-scaling based on traffic
3. **CI/CD**: Set up automated deployment pipelines
4. **Monitoring**: Add custom metrics and alerts
5. **Backup**: Implement database backup strategies

For more advanced topics, check out:
- [User Authentication Tutorial](/docs/user-authentication)
- [Data Management Guide](/docs/data-management)
- [Security Best Practices](/docs/security-best-practices)

## Troubleshooting

Common issues and solutions:

### Build Failures
- Check Dockerfile syntax
- Verify all dependencies are listed in package.json
- Ensure proper file permissions

### Deployment Issues
- Verify service account permissions
- Check environment variable configuration
- Review Cloud Run logs for errors

### Database Connection Problems
- Verify network connectivity
- Check firewall rules
- Confirm database credentials

For additional help, consult our [Development Guide](/docs/security-best-practices) or contact support.`,

  'user-authentication': `# User Authentication Tutorial

This comprehensive guide covers implementing secure user authentication in your GRA Core Platform applications using Google Cloud Identity and Access Management (IAM) and Firebase Authentication.

## Overview

Authentication is a critical component of any application. This tutorial covers:

- Setting up Firebase Authentication
- Implementing OAuth 2.0 flows
- Managing user sessions
- Role-based access control (RBAC)
- Security best practices

## Prerequisites

- Completed [Basic Setup Tutorial](/docs/basic-setup)
- Firebase project created
- Understanding of JWT tokens
- Basic knowledge of OAuth 2.0

## Step 1: Firebase Authentication Setup

### Enable Firebase Authentication

\`\`\`bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init auth
\`\`\`

### Configure Authentication Providers

In the Firebase Console, enable the following providers:

1. **Email/Password Authentication**
2. **Google OAuth**
3. **GitHub OAuth** (optional)
4. **Microsoft OAuth** (optional)

### Firebase Configuration

\`\`\`javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
\`\`\`

## Step 2: Implement Authentication Service

### Authentication Service Class

\`\`\`javascript
// auth-service.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase-config.js';

class AuthService {
  constructor() {
    this.googleProvider = new GoogleAuthProvider();
  }

  // Email/Password Registration
  async registerWithEmail(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.updateUserProfile(userCredential.user, { displayName });
      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Email/Password Login
  async loginWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Google OAuth Login
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get user token
  async getUserToken() {
    const user = this.getCurrentUser();
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  // Error handling
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/popup-closed-by-user': 'Authentication popup was closed.',
      'auth/cancelled-popup-request': 'Authentication was cancelled.'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message
    };
  }
}

export default new AuthService();
\`\`\`

## Step 3: Frontend Implementation

### React Authentication Hook

\`\`\`javascript
// useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from './auth-service.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const user = await AuthService.loginWithEmail(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const user = await AuthService.loginWithGoogle();
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    setLoading(true);
    try {
      const user = await AuthService.registerWithEmail(email, password, displayName);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
\`\`\`

### Login Component

\`\`\`javascript
// LoginForm.js
import React, { useState } from 'react';
import { useAuth } from './useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
\`\`\`

## Step 4: Backend Token Verification

### Express.js Middleware

\`\`\`javascript
// auth-middleware.js
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.role || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { authenticateToken, requireRole };
\`\`\`

### Protected Routes

\`\`\`javascript
// protected-routes.js
const express = require('express');
const { authenticateToken, requireRole } = require('./auth-middleware');

const router = express.Router();

// Protected route - requires authentication
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Admin-only route
router.get('/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    res.json({ users: listUsersResult.users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
\`\`\`

## Step 5: Role-Based Access Control

### Custom Claims Setup

\`\`\`javascript
// user-roles.js
const admin = require('firebase-admin');

async function setUserRole(uid, role) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(\`Role '\${role}' assigned to user \${uid}\`);
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
}

async function getUserRole(uid) {
  try {
    const user = await admin.auth().getUser(uid);
    return user.customClaims?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
}

module.exports = { setUserRole, getUserRole };
\`\`\`

## Step 6: Security Best Practices

### Environment Variables

\`\`\`bash
# .env
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
\`\`\`

### Security Rules

\`\`\`javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
\`\`\`

## Testing

### Unit Tests

\`\`\`javascript
// auth.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import AuthService from './auth-service';

jest.mock('./auth-service');

describe('LoginForm', () => {
  test('handles successful login', async () => {
    AuthService.loginWithEmail.mockResolvedValue({ uid: '123', email: 'test@example.com' });
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(AuthService.loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
\`\`\`

## Deployment

### Environment Configuration

\`\`\`bash
# Deploy with environment variables
gcloud run deploy auth-app \\
    --image gcr.io/your-project/auth-app \\
    --set-env-vars="FIREBASE_PROJECT_ID=your-project,FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com" \\
    --set-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
\`\`\`

## Next Steps

- Implement password reset functionality
- Add multi-factor authentication (MFA)
- Set up session management
- Implement social login providers
- Add audit logging for authentication events

For more advanced security topics, see our [Security Best Practices](/docs/security-best-practices) guide.`,

  'data-management': `# Data Management Guide

This comprehensive guide covers data management strategies, database design, and best practices for the GRA Core Platform using Google Cloud's data services.

## Overview

Effective data management is crucial for scalable applications. This guide covers:

- Database selection and design
- Data modeling strategies
- Migration and backup procedures
- Performance optimization
- Security and compliance

## Database Options

### Cloud SQL (Relational)

Best for:
- ACID transactions
- Complex relationships
- Existing SQL applications
- Strong consistency requirements

Supported engines:
- **PostgreSQL** (recommended)
- **MySQL**
- **SQL Server**

### Firestore (NoSQL Document)

Best for:
- Real-time applications
- Mobile and web apps
- Flexible schema requirements
- Automatic scaling

### Cloud Spanner (Global SQL)

Best for:
- Global applications
- High availability requirements
- Strong consistency at scale
- Mission-critical workloads

### BigQuery (Analytics)

Best for:
- Data warehousing
- Analytics and reporting
- Large-scale data processing
- Business intelligence

## Step 1: Database Design

### PostgreSQL Setup

\`\`\`bash
# Create Cloud SQL instance
gcloud sql instances create main-db \\
    --database-version=POSTGRES_14 \\
    --tier=db-custom-2-4096 \\
    --region=us-central1 \\
    --storage-type=SSD \\
    --storage-size=100GB \\
    --storage-auto-increase \\
    --backup-start-time=03:00 \\
    --maintenance-window-day=SUN \\
    --maintenance-window-hour=04
\`\`\`

### Database Schema Design

\`\`\`sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- project_members table (many-to-many)
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    port INTEGER DEFAULT 8080,
    environment JSONB DEFAULT '{}',
    replicas INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- deployments table
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    logs TEXT,
    deployed_by UUID REFERENCES users(id),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_applications_project ON applications(project_id);
CREATE INDEX idx_deployments_application ON deployments(application_id);
CREATE INDEX idx_deployments_status ON deployments(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Step 2: Data Access Layer

### Database Connection Pool

\`\`\`javascript
// db/connection.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
\`\`\`

### Data Models

\`\`\`javascript
// models/User.js
const pool = require('../db/connection');

class User {
  static async create(userData) {
    const { email, displayName, avatarUrl, role = 'user' } = userData;
    
    const query = \`
      INSERT INTO users (email, display_name, avatar_url, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    \`;
    
    const values = [email, displayName, avatarUrl, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    const setClause = fields.map((field, index) => 
      \`\${field} = $\${index + 2}\`
    ).join(', ');
    
    const query = \`
      UPDATE users 
      SET \${setClause}
      WHERE id = $1
      RETURNING *
    \`;
    
    const result = await pool.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = \`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = $1 
      RETURNING *
    \`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
\`\`\`

### Repository Pattern

\`\`\`javascript
// repositories/ProjectRepository.js
const pool = require('../db/connection');

class ProjectRepository {
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, status } = options;
    
    let query = \`
      SELECT p.*, u.display_name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = $1 OR pm.user_id = $1
    \`;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      query += \` AND p.status = $\${paramIndex}\`;
      params.push(status);
      paramIndex++;
    }
    
    query += \` ORDER BY p.created_at DESC LIMIT $\${paramIndex} OFFSET $\${paramIndex + 1}\`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findWithMembers(projectId) {
    const query = \`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'user_id', pm.user_id,
            'role', pm.role,
            'permissions', pm.permissions,
            'display_name', u.display_name,
            'email', u.email
          )
        ) as members
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON pm.user_id = u.id
      WHERE p.id = $1
      GROUP BY p.id
    \`;
    
    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }

  async addMember(projectId, userId, role = 'member', permissions = {}) {
    const query = \`
      INSERT INTO project_members (project_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, user_id) 
      DO UPDATE SET role = $3, permissions = $4
      RETURNING *
    \`;
    
    const result = await pool.query(query, [projectId, userId, role, permissions]);
    return result.rows[0];
  }
}

module.exports = new ProjectRepository();
\`\`\`

## Step 3: Firestore Integration

### Firestore Setup

\`\`\`javascript
// db/firestore.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

module.exports = db;
\`\`\`

### Firestore Data Models

\`\`\`javascript
// models/Activity.js
const db = require('../db/firestore');

class Activity {
  static collection = db.collection('activities');

  static async create(activityData) {
    const docRef = await this.collection.add({
      ...activityData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
  }

  static async findByProject(projectId, limit = 50) {
    const snapshot = await this.collection
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async findByUser(userId, limit = 50) {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async realTimeListener(projectId, callback) {
    return this.collection
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(snapshot => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(activities);
      });
  }
}

module.exports = Activity;
\`\`\`

## Step 4: Data Migration

### Migration Scripts

\`\`\`javascript
// migrations/001_initial_schema.js
const pool = require('../db/connection');

async function up() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create users table
    await client.query(\`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    \`);
    
    // Create projects table
    await client.query(\`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    \`);
    
    await client.query('COMMIT');
    console.log('Migration 001 completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS projects CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query('COMMIT');
    console.log('Migration 001 rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };
\`\`\`

### Migration Runner

\`\`\`javascript
// scripts/migrate.js
const fs = require('fs');
const path = require('path');
const pool = require('../db/connection');

async function createMigrationsTable() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  \`);
}

async function getExecutedMigrations() {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function runMigrations() {
  await createMigrationsTable();
  
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
  
  const executedMigrations = await getExecutedMigrations();
  
  for (const file of migrationFiles) {
    const migrationName = path.basename(file, '.js');
    
    if (!executedMigrations.includes(migrationName)) {
      console.log(\`Running migration: \${migrationName}\`);
      
      const migration = require(path.join(migrationsDir, file));
      await migration.up();
      
      await pool.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [migrationName]
      );
      
      console.log(\`Completed migration: \${migrationName}\`);
    }
  }
  
  console.log('All migrations completed');
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
\`\`\`

## Step 5: Backup and Recovery

### Automated Backups

\`\`\`bash
#!/bin/bash
# scripts/backup.sh

PROJECT_ID="your-project-id"
INSTANCE_NAME="main-db"
BACKUP_DESCRIPTION="Automated backup $(date +%Y%m%d_%H%M%S)"

# Create backup
gcloud sql backups create \\
    --instance=$INSTANCE_NAME \\
    --description="$BACKUP_DESCRIPTION" \\
    --project=$PROJECT_ID

echo "Backup created: $BACKUP_DESCRIPTION"

# Clean up old backups (keep last 30)
gcloud sql backups list \\
    --instance=$INSTANCE_NAME \\
    --limit=unlimited \\
    --format="value(id)" \\
    --sort-by="~windowStartTime" | \\
    tail -n +31 | \\
    xargs -I {} gcloud sql backups delete {} --instance=$INSTANCE_NAME --quiet

echo "Old backups cleaned up"
\`\`\`

### Point-in-Time Recovery

\`\`\`bash
# Restore to specific timestamp
gcloud sql instances clone main-db main-db-restored \\
    --point-in-time="2023-12-01T10:30:00Z"
\`\`\`

## Step 6: Performance Optimization

### Query Optimization

\`\`\`sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT 
    p.name, 
    COUNT(a.id) as app_count
FROM projects p
LEFT JOIN applications a ON p.id = a.project_id
WHERE p.owner_id = 'user-uuid'
GROUP BY p.id, p.name;

-- Add composite index for better performance
CREATE INDEX idx_applications_project_status ON applications(project_id, status);

-- Optimize with partial index
CREATE INDEX idx_active_applications ON applications(project_id) 
WHERE status = 'active';
\`\`\`

### Connection Pooling

\`\`\`javascript
// Advanced connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool configuration
  max: 20,                    // Maximum number of clients
  min: 5,                     // Minimum number of clients
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds
  
  // Advanced options
  acquireTimeoutMillis: 60000,   // Maximum time to wait for connection
  createTimeoutMillis: 30000,    // Maximum time to wait for new connection
  destroyTimeoutMillis: 5000,    // Maximum time to wait for client destruction
  reapIntervalMillis: 1000,      // How often to check for idle clients
  createRetryIntervalMillis: 200, // How long to wait before retrying failed connection
});
\`\`\`

## Step 7: Monitoring and Alerting

### Database Monitoring

\`\`\`javascript
// monitoring/database.js
const pool = require('../db/connection');

class DatabaseMonitor {
  static async getConnectionStats() {
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  }

  static async getSlowQueries() {
    const query = \`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > 1000
      ORDER BY mean_time DESC
      LIMIT 10
    \`;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async getDatabaseSize() {
    const query = \`
      SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE pg_database.datname = current_database()
    \`;
    
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = DatabaseMonitor;
\`\`\`

## Next Steps

- Implement data archiving strategies
- Set up read replicas for scaling
- Configure cross-region replication
- Implement data encryption at rest
- Set up automated testing for data integrity

For security considerations, see our [Security Best Practices](/docs/security-best-practices) guide.`,

  'security-best-practices': `# Security Best Practices

This comprehensive guide covers security best practices for applications built on the GRA Core Platform, focusing on Google Cloud Platform security features and industry standards.

## Security Framework

### Defense in Depth

Implement multiple layers of security:

1. **Network Security**: VPC, firewalls, private networks
2. **Identity & Access Management**: Authentication, authorization, RBAC
3. **Application Security**: Input validation, secure coding practices
4. **Data Security**: Encryption, access controls, data classification
5. **Infrastructure Security**: Hardened images, security patches
6. **Monitoring & Logging**: Security monitoring, incident response

## Step 1: Network Security

### VPC Configuration

\`\`\`bash
# Create secure VPC with private subnets
gcloud compute networks create secure-vpc --subnet-mode=custom

# Create private subnet for applications
gcloud compute networks subnets create app-subnet \\
    --network=secure-vpc \\
    --range=10.0.1.0/24 \\
    --region=us-central1 \\
    --enable-private-ip-google-access

# Create private subnet for databases
gcloud compute networks subnets create db-subnet \\
    --network=secure-vpc \\
    --range=10.0.2.0/24 \\
    --region=us-central1 \\
    --enable-private-ip-google-access
\`\`\`

### Firewall Rules

\`\`\`bash
# Default deny all ingress
gcloud compute firewall-rules create deny-all-ingress \\
    --network=secure-vpc \\
    --action=deny \\
    --rules=all \\
    --source-ranges=0.0.0.0/0 \\
    --priority=65534

# Allow HTTPS traffic to load balancer
gcloud compute firewall-rules create allow-https-lb \\
    --network=secure-vpc \\
    --action=allow \\
    --rules=tcp:443 \\
    --source-ranges=0.0.0.0/0 \\
    --target-tags=https-server \\
    --priority=1000

# Allow internal communication
gcloud compute firewall-rules create allow-internal \\
    --network=secure-vpc \\
    --action=allow \\
    --rules=all \\
    --source-ranges=10.0.0.0/16 \\
    --priority=1000

# Allow SSH from specific IP ranges only
gcloud compute firewall-rules create allow-ssh-admin \\
    --network=secure-vpc \\
    --action=allow \\
    --rules=tcp:22 \\
    --source-ranges=YOUR_ADMIN_IP/32 \\
    --target-tags=ssh-allowed \\
    --priority=1000
\`\`\`

### Private Google Access

\`\`\`bash
# Enable private Google access for subnets
gcloud compute networks subnets update app-subnet \\
    --region=us-central1 \\
    --enable-private-ip-google-access

gcloud compute networks subnets update db-subnet \\
    --region=us-central1 \\
    --enable-private-ip-google-access
\`\`\`

## Step 2: Identity and Access Management

### Service Account Best Practices

\`\`\`bash
# Create service accounts with minimal permissions
gcloud iam service-accounts create app-service-account \\
    --description="Application service account" \\
    --display-name="App Service Account"

# Grant specific roles only
gcloud projects add-iam-policy-binding PROJECT_ID \\
    --member="serviceAccount:app-service-account@PROJECT_ID.iam.gserviceaccount.com" \\
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding PROJECT_ID \\
    --member="serviceAccount:app-service-account@PROJECT_ID.iam.gserviceaccount.com" \\
    --role="roles/storage.objectViewer"
\`\`\`

### Custom IAM Roles

\`\`\`yaml
# custom-app-role.yaml
title: "Custom App Role"
description: "Minimal permissions for application"
stage: "GA"
includedPermissions:
- cloudsql.instances.connect
- storage.objects.get
- storage.objects.list
- logging.logEntries.create
- monitoring.metricDescriptors.create
- monitoring.timeSeries.create
\`\`\`

\`\`\`bash
# Create custom role
gcloud iam roles create customAppRole \\
    --project=PROJECT_ID \\
    --file=custom-app-role.yaml
\`\`\`

### Workload Identity

\`\`\`bash
# Enable Workload Identity on GKE cluster
gcloud container clusters update CLUSTER_NAME \\
    --workload-pool=PROJECT_ID.svc.id.goog

# Create Kubernetes service account
kubectl create serviceaccount app-ksa

# Bind Kubernetes SA to Google SA
gcloud iam service-accounts add-iam-policy-binding \\
    --role roles/iam.workloadIdentityUser \\
    --member "serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/app-ksa]" \\
    app-service-account@PROJECT_ID.iam.gserviceaccount.com

# Annotate Kubernetes service account
kubectl annotate serviceaccount app-ksa \\
    iam.gke.io/gcp-service-account=app-service-account@PROJECT_ID.iam.gserviceaccount.com
\`\`\`

## Step 3: Application Security

### Input Validation and Sanitization

\`\`\`javascript
// security/validation.js
const Joi = require('joi');
const DOMPurify = require('isomorphic-dompurify');

class InputValidator {
  static schemas = {
    user: Joi.object({
      email: Joi.string().email().required(),
      displayName: Joi.string().min(2).max(50).pattern(/^[a-zA-Z0-9\\s]+$/).required(),
      role: Joi.string().valid('user', 'admin', 'moderator').default('user')
    }),
    
    project: Joi.object({
      name: Joi.string().min(3).max(100).pattern(/^[a-zA-Z0-9\\s\\-
