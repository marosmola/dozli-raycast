# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension for Dozli, a productivity application. The extension integrates Dozli functionality into Raycast, allowing users to interact with Dozli directly from the Raycast launcher.

## Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build the extension
npm run build

# Lint code
npm run lint

# Lint and auto-fix issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

## Architecture

### Extension Structure

This is a Raycast extension following the Raycast Extension API architecture:

- **Extension Type**: View-based commands that render React components
- **Primary Framework**: React with TypeScript, using Raycast's API (@raycast/api)
- **Entry Points**: Commands are defined in `package.json` under the `commands` array and map to files in `src/`

### Current Commands

1. **Add Block** (`src/add-block.tsx`): A form-based command that adds blocks via the Dozli intake API
   - Uses Raycast's Form components (Form.TextField, Form.Dropdown, etc.)
   - Handles form submission through ActionPanel and Action.SubmitForm
   - Currently in scaffolding state with commented-out form elements

### Key Dependencies

- `@raycast/api`: Core Raycast extension API for UI components and utilities
- `@raycast/utils`: Additional utilities for Raycast extensions
- TypeScript 5.8.2 with strict mode enabled

### TypeScript Configuration

- Target: ES2023
- Module system: CommonJS
- JSX: react-jsx (automatic runtime)
- Strict mode enabled with isolated modules
- Files are in `src/` directory

## OAuth Authentication

This extension uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for authentication:

### OAuth Setup

1. **Environment Configuration**:
   - Copy `.env.example` to `.env`
   - Add your Dozli OAuth client ID: `DOZLI_CLIENT_ID=your-client-id`
   - Update OAuth endpoints if needed (defaults to `localhost:3000`)

2. **OAuth Provider** (`src/oauth.ts`):
   - Manages the PKCE OAuth flow
   - Handles token storage, refresh, and expiration
   - Provides `getAccessToken()` for authenticated API calls

3. **Token Management**:
   - Tokens are automatically stored by Raycast's OAuth client
   - Expired tokens are automatically refreshed using refresh tokens
   - User can log out via Raycast's built-in preferences

### Making Authenticated API Calls

```typescript
import { getAccessToken } from "./oauth";

const accessToken = await getAccessToken();
const response = await fetch("http://localhost:3000/api/endpoint", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

The `getAccessToken()` function will:
- Return existing valid token
- Trigger OAuth flow if no token exists
- Automatically refresh expired tokens
- Throw error if authentication fails

## Development Workflow

1. **Adding New Commands**:
   - Add command definition to `package.json` under `commands` array
   - Create corresponding `.tsx` file in `src/` directory
   - Export default function that returns Raycast UI components

2. **Form-Based Commands**:
   - Use `Form` component from `@raycast/api`
   - Wrap form elements in `ActionPanel` with appropriate actions
   - Handle submission with typed values interface
   - Use `getAccessToken()` for authenticated API requests

3. **Testing**:
   - Use `npm run dev` to test in Raycast with hot reload
   - Raycast will automatically reload the extension on file changes
   - First run will trigger OAuth authorization flow

## Platform Support

This extension supports both macOS and Windows platforms as specified in `package.json`.
