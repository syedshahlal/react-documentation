# API Reference

Complete reference for all GRA Core Platform APIs and interactive documentation generation.

## Authentication

All API requests require authentication using API keys.

### Headers

\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

## Core Platform APIs

### Users API

#### GET /api/users

Retrieve a list of users.

**Parameters:**
- `limit` (optional): Number of users to return (default: 10)
- `offset` (optional): Number of users to skip (default: 0)

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

Submit new data to the platform.

### JavaScript SDK

\`\`\`javascript
import { GRAClient } from '@gra-core/js-sdk'

const client = new GRAClient({
  apiKey: 'your_api_key'
})

// Get users
const users = await client.users.list({ limit: 10 })

// Create user
const newUser = await client.users.create({
  name: 'John Doe',
  email: 'john@example.com'
})

// Search
const results = await client.search('getting started')
\`\`\`

## Python API Documentation Generator

Generate comprehensive API documentation from any Python repository by analyzing docstrings and code structure.

### Sample Repositories to Try

- **Requests Library**: `https://github.com/psf/requests`
- **Flask Framework**: `https://github.com/pallets/flask`
- **FastAPI**: `https://github.com/tiangolo/fastapi`
- **Django**: `https://github.com/django/django`
- **NumPy**: `https://github.com/numpy/numpy`

### Features

- **Automatic Package Discovery**: Finds all Python packages with `__init__.py` files
- **Docstring Parsing**: Extracts Google/Sphinx style docstrings
- **Class & Function Analysis**: Complete API coverage including methods, properties, and constants
- **Interactive Navigation**: Browse packages with search and filtering
- **Real-time Generation**: Live documentation from any GitHub repository

---

## Webhooks

Configure webhooks to receive real-time notifications:

### Webhook Events

- `user.created` - New user registered
- `user.updated` - User information changed
- `user.deleted` - User account deleted
- `data.created` - New data submitted
- `data.updated` - Data modified
- `search.performed` - Search query executed

### Webhook Payload

\`\`\`json
{
  "event": "user.created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "webhook_id": "webhook_001"
}
\`\`\`

## GraphQL API

Alternative GraphQL endpoint available at `/graphql`:

```graphql
query GetUsers($limit: Int, $offset: Int) {
  users(limit: $limit, offset: $offset) {
    id
    name
    email
    createdAt
    status
  }
}

mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}
