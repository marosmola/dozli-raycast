# OAuth Setup Guide

This guide walks you through setting up OAuth authentication for the Dozli Raycast extension.

## Prerequisites

Your Dozli application needs to implement an OAuth 2.0 server with PKCE support.

## Step 1: Register OAuth Application

In your Dozli application, you need to register a new OAuth application with these settings:

- **Application Name**: Dozli Raycast Extension
- **Redirect URI**: `https://raycast.com/redirect?packageName=Extension`
- **Grant Type**: Authorization Code with PKCE
- **Scopes**: `blocks:write` (or whatever scopes your API requires)

After registration, you'll receive a **Client ID**. Save this for the next step.

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Client ID:
   ```
   DOZLI_CLIENT_ID=your-actual-client-id-here
   ```

3. If your OAuth endpoints differ from the defaults, update them:
   ```
   DOZLI_AUTH_ENDPOINT=http://localhost:3000/oauth/authorize
   DOZLI_TOKEN_ENDPOINT=http://localhost:3000/oauth/token
   ```

## Step 3: Implement OAuth Server Endpoints

Your Dozli server needs to implement these OAuth 2.0 endpoints:

### Authorization Endpoint

**URL**: `GET /oauth/authorize`

**Parameters**:
- `client_id`: The client ID you registered
- `redirect_uri`: `https://raycast.com/redirect?packageName=Extension`
- `response_type`: `code`
- `code_challenge`: PKCE code challenge
- `code_challenge_method`: `S256`
- `scope`: Requested scopes (e.g., `blocks:write`)
- `state`: Random state for CSRF protection

**Response**: Redirect to `redirect_uri` with authorization code

### Token Endpoint

**URL**: `POST /oauth/token`

**Parameters** (form-urlencoded):
- `grant_type`: `authorization_code` or `refresh_token`
- `code`: Authorization code (for authorization_code grant)
- `refresh_token`: Refresh token (for refresh_token grant)
- `client_id`: The client ID
- `code_verifier`: PKCE code verifier (for authorization_code grant)
- `redirect_uri`: Same redirect URI used in authorization

**Response** (JSON):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...",
  "scope": "blocks:write"
}
```

## Step 4: Protect API Endpoints

Update your API endpoints to require OAuth authentication:

```javascript
// Example Express.js middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  // Verify the token and extract user info
  // ...
  next();
}

app.post('/api/blocks/intake', requireAuth, (req, res) => {
  // Handle block creation
});
```

## Step 5: Test the Integration

1. Start your Dozli server:
   ```bash
   # In your Dozli server directory
   npm start
   ```

2. Run the Raycast extension in development mode:
   ```bash
   npm run dev
   ```

3. In Raycast, trigger the "Add Block" command
4. You'll be redirected to the OAuth authorization page
5. Approve the authorization
6. You'll be redirected back to Raycast
7. The extension will now use the access token for API calls

## Troubleshooting

### "Failed to obtain access token"
- Verify your `DOZLI_CLIENT_ID` is correct
- Check that your OAuth endpoints are accessible
- Ensure your Dozli server is running

### "Token refresh failed"
- Verify your token endpoint supports `refresh_token` grant type
- Check that refresh tokens are being returned and stored

### "HTTP error! status: 401"
- Ensure your API endpoints are checking for valid Bearer tokens
- Verify the token hasn't expired
- Check that the token has the required scopes

## Security Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- Store client secrets securely on the server side only
- Use HTTPS in production
- Implement proper token expiration and refresh logic
- Validate PKCE code verifiers properly
- Protect against CSRF with state parameter
