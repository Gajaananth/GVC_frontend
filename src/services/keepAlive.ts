import { API_URL } from './api';

/**
 * Keep-Alive Service
 * Prevents Render backend from spinning down during inactivity
 * Renders free tier spins down after 15 minutes, so we ping every 10 minutes
 */

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const startKeepAlive = () => {
  if (keepAliveInterval) return; // Already running

  console.log('[KeepAlive] Starting background health checks...');

  // Initial ping
  pingHealth();

  // Set up recurring pings every 10 minutes
  keepAliveInterval = setInterval(() => {
    pingHealth();
  }, KEEP_ALIVE_INTERVAL);
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[KeepAlive] Stopped background health checks.');
  }
};

/**
 * Ping the health endpoint
 * This is a lightweight request that doesn't require authentication
 * Keeps Render backend warm and prevents spin-down
 */
const pingHealth = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (response.ok) {
      console.log('[KeepAlive] ✓ Backend is alive and warm');
    } else {
      console.warn('[KeepAlive] Backend health check returned:', response.status);
    }
  } catch (error: any) {
    console.warn('[KeepAlive] Background health check failed (this is OK):', error.message);
    // This is fine - the health check is best-effort
    // It's just to keep services warm, not critical for operation
  }
};

/**
 * Alternative: Aggressive keep-alive for times when user needs immediate response
 * Call this when user opens the app after being away
 */
export const forceHealthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};
