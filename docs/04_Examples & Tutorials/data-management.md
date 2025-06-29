# Data Management Tutorial

Learn how to effectively manage data in your GRA Core Platform applications.

## Overview

This tutorial covers:
- Data models and schemas
- CRUD operations
- Data validation
- Relationships and joins
- Caching strategies
- Real-time updates

## Setting Up Data Models

### Basic Model Definition

\`\`\`javascript
import { GRAData } from '@gra-core/data'

const data = new GRAData({
  apiKey: process.env.GRA_API_KEY,
  database: 'production'
})

// Define a User model
const User = data.model('User', {
  id: { type: 'string', primary: true },
  email: { type: 'string', required: true, unique: true },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  age: { type: 'number', min: 0, max: 150 },
  isActive: { type: 'boolean', default: true },
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
})
\`\`\`

### Advanced Schema with Validation

\`\`\`javascript
const Product = data.model('Product', {
  id: { type: 'string', primary: true },
  name: { 
    type: 'string', 
    required: true,
    minLength: 2,
    maxLength: 100
  },
  description: { type: 'text' },
  price: { 
    type: 'number', 
    required: true,
    min: 0,
    validate: (value) => value > 0 || 'Price must be positive'
  },
  category: {
    type: 'string',
    enum: ['electronics', 'clothing', 'books', 'home'],
    required: true
  },
  tags: { type: 'array', items: { type: 'string' } },
  metadata: { type: 'object' },
  isAvailable: { type: 'boolean', default: true }
})
\`\`\`

## CRUD Operations

### Create Operations

\`\`\`javascript
// Create a single record
async function createUser(userData) {
  try {
    const user = await User.create({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      age: userData.age
    })
    
    console.log('User created:', user)
    return user
  } catch (error) {
    console.error('Create failed:', error)
    throw error
  }
}

// Bulk create
async function createMultipleUsers(usersData) {
  try {
    const users = await User.createMany(usersData)
    console.log(`Created ${users.length} users`)
    return users
  } catch (error) {
    console.error('Bulk create failed:', error)
    throw error
  }
}
\`\`\`

### Read Operations

\`\`\`javascript
// Find by ID
async function getUserById(id) {
  try {
    const user = await User.findById(id)
    return user
  } catch (error) {
    console.error('Find by ID failed:', error)
    throw error
  }
}

// Find with conditions
async function getActiveUsers() {
  try {
    const users = await User.find({
      isActive: true,
      age: { $gte: 18 }
    })
    return users
  } catch (error) {
    console.error('Find failed:', error)
    throw error
  }
}

// Advanced queries
async function searchUsers(searchTerm) {
  try {
    const users = await User.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .skip(0)
    
    return users
  } catch (error) {
    console.error('Search failed:', error)
    throw error
  }
}
\`\`\`

### Update Operations

\`\`\`javascript
// Update by ID
async function updateUser(id, updates) {
  try {
    const user = await User.findByIdAndUpdate(id, {
      ...updates,
      updatedAt: new Date()
    }, { new: true })
    
    return user
  } catch (error) {
    console.error('Update failed:', error)
    throw error
  }
}

// Bulk update
async function deactivateOldUsers() {
  try {
    const result = await User.updateMany(
      { 
        createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        isActive: true
      },
      { isActive: false }
    )
    
    console.log(`Deactivated ${result.modifiedCount} users`)
    return result
  } catch (error) {
    console.error('Bulk update failed:', error)
    throw error
  }
}
\`\`\`

### Delete Operations

\`\`\`javascript
// Soft delete (recommended)
async function softDeleteUser(id) {
  try {
    const user = await User.findByIdAndUpdate(id, {
      isActive: false,
      deletedAt: new Date()
    })
    
    return user
  } catch (error) {
    console.error('Soft delete failed:', error)
    throw error
  }
}

// Hard delete (use with caution)
async function hardDeleteUser(id) {
  try {
    const result = await User.findByIdAndDelete(id)
    return result
  } catch (error) {
    console.error('Hard delete failed:', error)
    throw error
  }
}
\`\`\`

## Data Relationships

### One-to-Many Relationships

\`\`\`javascript
// Define related models
const Order = data.model('Order', {
  id: { type: 'string', primary: true },
  userId: { type: 'string', ref: 'User', required: true },
  items: [{ 
    productId: { type: 'string', ref: 'Product' },
    quantity: { type: 'number', min: 1 },
    price: { type: 'number', min: 0 }
  }],
  total: { type: 'number', min: 0 },
  status: { 
    type: 'string', 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: 'date', default: Date.now }
})

// Query with population
async function getUserWithOrders(userId) {
  try {
    const user = await User.findById(userId)
    const orders = await Order.find({ userId }).populate('items.productId')
    
    return { user, orders }
  } catch (error) {
    console.error('Query with population failed:', error)
    throw error
  }
}
\`\`\`

### Many-to-Many Relationships

\`\`\`javascript
const Tag = data.model('Tag', {
  id: { type: 'string', primary: true },
  name: { type: 'string', required: true, unique: true },
  color: { type: 'string', default: '#000000' }
})

const Article = data.model('Article', {
  id: { type: 'string', primary: true },
  title: { type: 'string', required: true },
  content: { type: 'text', required: true },
  authorId: { type: 'string', ref: 'User', required: true },
  tags: [{ type: 'string', ref: 'Tag' }],
  publishedAt: { type: 'date' }
})

// Query articles with tags
async function getArticlesWithTags() {
  try {
    const articles = await Article.find({ publishedAt: { $ne: null } })
      .populate('authorId', 'firstName lastName')
      .populate('tags')
      .sort({ publishedAt: -1 })
    
    return articles
  } catch (error) {
    console.error('Query failed:', error)
    throw error
  }
}
\`\`\`

## Data Validation

### Custom Validators

\`\`\`javascript
const UserProfile = data.model('UserProfile', {
  userId: { type: 'string', ref: 'User', required: true },
  bio: { 
    type: 'string',
    maxLength: 500,
    validate: {
      validator: (value) => !value.includes('spam'),
      message: 'Bio cannot contain spam content'
    }
  },
  website: {
    type: 'string',
    validate: {
      validator: (value) => {
        const urlRegex = /^https?:\/\/.+/
        return !value || urlRegex.test(value)
      },
      message: 'Website must be a valid URL'
    }
  },
  socialLinks: {
    twitter: { type: 'string' },
    linkedin: { type: 'string' },
    github: { type: 'string' }
  }
})
\`\`\`

### Pre/Post Hooks

\`\`\`javascript
// Pre-save hook
User.pre('save', function(next) {
  // Hash password before saving
  if (this.isModified('password')) {
    this.password = hashPassword(this.password)
  }
  
  // Update timestamp
  this.updatedAt = new Date()
  next()
})

// Post-save hook
User.post('save', function(doc) {
  // Send welcome email for new users
  if (doc.isNew) {
    sendWelcomeEmail(doc.email)
  }
})
\`\`\`

## Caching Strategies

### Basic Caching

\`\`\`javascript
import { GRACache } from '@gra-core/cache'

const cache = new GRACache({
  provider: 'redis',
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
})

async function getCachedUser(id) {
  try {
    // Try cache first
    let user = await cache.get(`user:${id}`)
    
    if (!user) {
      // Fetch from database
      user = await User.findById(id)
      
      // Cache for 1 hour
      await cache.set(`user:${id}`, user, 3600)
    }
    
    return user
  } catch (error) {
    console.error('Cache operation failed:', error)
    // Fallback to database
    return await User.findById(id)
  }
}
\`\`\`

### Cache Invalidation

\`\`\`javascript
// Invalidate cache on update
async function updateUserWithCache(id, updates) {
  try {
    const user = await User.findByIdAndUpdate(id, updates, { new: true })
    
    // Invalidate cache
    await cache.del(`user:${id}`)
    
    return user
  } catch (error) {
    console.error('Update with cache failed:', error)
    throw error
  }
}
\`\`\`

## Real-time Updates

### WebSocket Integration

\`\`\`javascript
import { GRAWebSocket } from '@gra-core/websocket'

const ws = new GRAWebSocket({
  url: process.env.GRA_WEBSOCKET_URL,
  apiKey: process.env.GRA_API_KEY
})

// Subscribe to data changes
ws.subscribe('users', (event) => {
  switch (event.type) {
    case 'created':
      console.log('New user created:', event.data)
      break
    case 'updated':
      console.log('User updated:', event.data)
      break
    case 'deleted':
      console.log('User deleted:', event.data)
      break
  }
})

// Emit changes
User.post('save', function(doc) {
  ws.emit('users', {
    type: doc.isNew ? 'created' : 'updated',
    data: doc
  })
})
\`\`\`

## Performance Optimization

### Indexing

\`\`\`javascript
// Create indexes for better query performance
User.index({ email: 1 }, { unique: true })
User.index({ isActive: 1, createdAt: -1 })
User.index({ firstName: 'text', lastName: 'text' })

Order.index({ userId: 1, createdAt: -1 })
Order.index({ status: 1 })
\`\`\`

### Aggregation Pipelines

\`\`\`javascript
async function getUserStats() {
  try {
    const stats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageAge: { $avg: '$age' },
          oldestUser: { $max: '$age' },
          youngestUser: { $min: '$age' }
        }
      }
    ])
    
    return stats[0]
  } catch (error) {
    console.error('Aggregation failed:', error)
    throw error
  }
}
\`\`\`

## Error Handling

### Comprehensive Error Handling

\`\`\`javascript
class DataService {
  async createUser(userData) {
    try {
      // Validate input
      if (!userData.email || !userData.firstName) {
        throw new ValidationError('Email and first name are required')
      }
      
      // Check for duplicates
      const existingUser = await User.findOne({ email: userData.email })
      if (existingUser) {
        throw new DuplicateError('User with this email already exists')
      }
      
      // Create user
      const user = await User.create(userData)
      return user
      
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      } else if (error.code === 11000) {
        throw new DuplicateError('Duplicate key error')
      } else {
        console.error('Unexpected error:', error)
        throw new DatabaseError('Failed to create user')
      }
    }
  }
}
\`\`\`

## Next Steps

- Explore [Advanced Querying](../05_Development%20Guide/advanced-querying.md)
- Learn about [Performance Optimization](../05_Development%20Guide/performance-optimization.md)
- Check out [Real-time Features](../06_GCP%20Feature%20InDepth/real-time-data.md)
