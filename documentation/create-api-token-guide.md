# Cloudflare API Token Creation Guide

## Step 1: Access the API Tokens Page
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**

## Step 2: Use Custom Token Template
1. Click **"Get started"** next to **"Custom token"**

## Step 3: Configure Token Permissions
Set the following permissions:

### Account Permissions:
- **Account** - `Read`

### Zone Permissions:
- **Zone** - `Read`

### User Permissions (Optional but recommended):
- **User** - `Read`

### Product-Specific Permissions:
- **Workers Scripts** - `Edit`
- **Workers KV** - `Edit`
- **D1** - `Edit`
- **R2** - `Edit`
- **Queues** - `Edit`
- **Analytics** - `Read`
- **Logs** - `Read`
- **AI** - `Edit`
- **Vectorize** - `Edit`
- **Page Rules** - `Edit`

## Step 4: Configure Resources
- **Account Resources**: `Include - All accounts`
- **Zone Resources**: `Include - All zones` (if you have zones)

## Step 5: Client IP Address Filtering (Optional)
- Leave blank for no restrictions

## Step 6: TTL (Time to Live)
- Set to your preference (e.g., 1 year)

## Step 7: Create and Copy Token
1. Click **"Continue to summary"**
2. Review the permissions
3. Click **"Create Token"**
4. **IMPORTANT**: Copy the token immediately - you won't see it again!

## Step 8: Test the Token
After creating the token, run:
```bash
./setup-cloudflare-mcp-auth.sh YOUR_NEW_TOKEN
```

The token should look something like: `1234567890abcdef1234567890abcdef12345678`