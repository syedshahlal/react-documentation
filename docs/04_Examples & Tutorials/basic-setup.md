# Basic Setup Example

This guide walks you through setting up your first GRA Core Platform project from scratch.

## Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A GRA Core Platform account
- API credentials

## Step 1: Create a New Project

First, create a new directory for your project:

\`\`\`bash
mkdir my-gra-project
cd my-gra-project
npm init -y
\`\`\`

## Step 2: Install Dependencies

Install the GRA Core Platform SDK:

\`\`\`bash
npm install @gra-core/platform
npm install @gra-core/auth
npm install @gra-core/data
\`\`\`

## Step 3: Basic Configuration

Create a `.env` file in your project root:

\`\`\`env
GRA_API_KEY=your_api_key_here
GRA_ENVIRONMENT=development
GRA_BASE_URL=https://api.gra-core.com
\`\`\`

## Step 4: Initialize the Client

Create an `index.js` file:

\`\`\`javascript
import { GRACore } from '@gra-core/platform'

const client = new GRACore({
  apiKey: process.env.GRA_API_KEY,
  environment: process.env.GRA_ENVIRONMENT
})

async function main() {
  try {
    // Test the connection
    const status = await client.health.check()
    console.log('Connection successful:', status)
    
    // Your application logic here
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
\`\`\`

## Step 5: Run Your Application

Execute your application:

\`\`\`bash
node index.js
\`\`\`

## Next Steps

- Explore the [User Authentication Tutorial](./user-authentication.md)
- Learn about [Data Management](./data-management.md)
- Check out the [API Reference](../03_API%20Reference/api-reference.md)

## Troubleshooting

### Common Issues

**Connection Timeout**
- Check your internet connection
- Verify your API key is correct
- Ensure the GRA service is running

**Authentication Failed**
- Double-check your API credentials
- Make sure your account is active
- Contact support if issues persist
