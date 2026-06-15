import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Mutex to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.accessToken) {
      // Update the store with the new access token, keeping existing user & refresh token
      useAuthStore.setState({ accessToken: data.accessToken });
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const { accessToken, logout } = useAuthStore.getState();
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s exponential backoff

  const buildHeaders = (token: string | null) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  };

  const performRequest = async (token: string | null) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: buildHeaders(token),
    });
  };

  let lastError: any = null;

  // Retry loop for temporary failures (network errors, timeouts)
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await Promise.race([
        performRequest(accessToken),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 30000) // 30s timeout
        ),
      ]) as Response;

      // If 401 and not a login/refresh request, try refreshing the token
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        // Use a shared promise so concurrent 401s only trigger one refresh
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
        }

        const newToken = await (refreshPromise || refreshAccessToken());

        if (newToken) {
          // Retry the original request with the new token
          const retryResponse = await performRequest(newToken);
          const retryData = await retryResponse.json().catch(() => ({}));

          if (!retryResponse.ok) {
            if (retryResponse.status === 401) {
              logout();
              window.location.href = '/login';
            }
            throw new Error(retryData.error || 'API request failed');
          }

          return retryData;
        } else {
          // Refresh failed — force logout
          logout();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `API request failed (${response.status})`);
      }

      return data;
    } catch (error: any) {
      lastError = error;

      // Retry only for temporary errors (not 4xx status codes, not auth errors)
      const isTemporaryError =
        error.message.includes('timeout') ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('503') || // Service Unavailable
        error.message.includes('502') || // Bad Gateway
        error.message.includes('504'); // Gateway Timeout

      if (isTemporaryError && attempt < MAX_RETRIES - 1) {
        const delayMs = RETRY_DELAYS[attempt];
        console.warn(
          `[API Retry] Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${endpoint}. Retrying in ${delayMs}ms...`,
          error.message
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue; // Try again
      }

      // Don't retry if this is not a temporary error
      throw error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('API request failed after maximum retries');
};
