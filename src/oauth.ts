import { OAuth } from "@raycast/api";

// OAuth client configuration for Dozli
export const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Dozli",
  providerIcon: "extension-icon.png",
  description: "Connect your Dozli account to add blocks",
});

export const oauthConfig = {
  authorizationEndpoint: "https://noble-pup-37.clerk.accounts.dev/oauth/authorize",
  tokenEndpoint: "https://noble-pup-37.clerk.accounts.dev/oauth/token",
  clientId: "JmDqtdfex482JN5q",
  scope: "openid",
};

/**
 * Initiates the OAuth authorization flow
 */
export async function authorize(): Promise<void> {
  const authRequest = await client.authorizationRequest({
    endpoint: oauthConfig.authorizationEndpoint,
    clientId: oauthConfig.clientId,
    scope: oauthConfig.scope,
  });

  const { authorizationCode } = await client.authorize(authRequest);

  await exchangeCodeForTokens(authorizationCode, authRequest.codeVerifier);
}

/**
 * Exchanges authorization code for access token
 */
async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<void> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    code_verifier: codeVerifier,
    client_id: oauthConfig.clientId,
    redirect_uri: "https://raycast.com/redirect?packageName=Extension",
  });

  const response = await fetch(oauthConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
  };

  await client.setTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  });
}

/**
 * Gets valid access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string> {
  const tokens = await client.getTokens();

  if (!tokens) {
    await authorize();
    const newTokens = await client.getTokens();
    if (!newTokens?.accessToken) {
      throw new Error("Failed to obtain access token");
    }
    return newTokens.accessToken;
  }

  // Check if token is expired and refresh if needed
  if (tokens.refreshToken && tokens.isExpired()) {
    await refreshTokens(tokens.refreshToken);
    const refreshedTokens = await client.getTokens();
    if (!refreshedTokens?.accessToken) {
      throw new Error("Failed to refresh access token");
    }
    return refreshedTokens.accessToken;
  }

  return tokens.accessToken;
}

/**
 * Refreshes expired access token
 */
async function refreshTokens(refreshToken: string): Promise<void> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: oauthConfig.clientId,
  });

  const response = await fetch(oauthConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    // If refresh fails, user needs to re-authorize
    await client.removeTokens();
    throw new Error("Token refresh failed. Please re-authorize.");
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type: string;
  };

  await client.setTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken,
    expiresIn: tokens.expires_in,
  });
}
