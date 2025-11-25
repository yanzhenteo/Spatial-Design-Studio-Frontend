export interface RetryOptions {
  retries?: number;       // number of additional attempts after the first
  retryDelayMs?: number;  // delay between retries
  timeoutMs?: number;     // per-attempt timeout
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<Response> {
  const {
    retries = 2,
    retryDelayMs = 500,
    timeoutMs = 8000,
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);

      // If OK or non‑retriable status, return immediately
      if (res.ok || res.status < 500 || attempt === retries) {
        return res;
      }

      // 5xx and attempts left – retry
      attempt++;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt === retries) {
        break;
      }

      // Network/abort error – retry
      attempt++;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network error');
}
