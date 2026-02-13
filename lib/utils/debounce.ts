/**
 * Debounce and Performance Utilities (Phase 4)
 *
 * Performance optimization utilities for input handling and API calls
 */

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request cancellation utility
 */
export class CancellableRequest {
  private controller: AbortController | null = null;

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Cancel previous request if exists
    if (this.controller) {
      this.controller.abort();
    }

    // Create new controller
    this.controller = new AbortController();

    // Add signal to options
    const fetchOptions = {
      ...options,
      signal: this.controller.signal,
    };

    try {
      const response = await fetch(url, fetchOptions);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      }
      throw error;
    }
  }

  cancel() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

/**
 * Lazy load utility for dynamic imports
 */
export async function lazyLoad<T>(
  importFunc: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const module = await importFunc();
    return module.default;
  } catch (error) {
    console.error('Lazy load error:', error);
    throw error;
  }
}

/**
 * Memoization cache for expensive operations
 */
export class MemoCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}
