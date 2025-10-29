/**
 * Idempotency Key Generator and Form Decorator (F-14)
 *
 * Generates unique idempotency keys for mutation requests to prevent
 * duplicate operations. Scoped to principal + route template.
 *
 * Per ADR-007, all POST/PUT/PATCH/DELETE endpoints accept `Idempotency-Key` header.
 *
 * @see apps/docs/6. adr/ADR-007-idempotency-policy-for-writes.md
 * @see CLAUDE.md - Idempotency Policy
 */

/**
 * Generate a UUID-based idempotency key
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Store for tracking generated idempotency keys per operation
 * Key format: `${method}:${path}`
 */
const keyStore = new Map<string, string>();

/**
 * Get or create idempotency key for a specific operation
 *
 * @param method - HTTP method (POST, PUT, PATCH, DELETE)
 * @param path - Route template or specific endpoint path
 * @returns Idempotency key
 *
 * @example
 * const key = getIdempotencyKey('POST', '/sessions');
 * // Returns same key for subsequent calls with same method+path
 */
export function getIdempotencyKey(method: string, path: string): string {
  const operationKey = `${method.toUpperCase()}:${path}`;

  if (!keyStore.has(operationKey)) {
    keyStore.set(operationKey, generateIdempotencyKey());
  }

  return keyStore.get(operationKey)!;
}

/**
 * Clear idempotency key for an operation after successful completion
 *
 * @param method - HTTP method
 * @param path - Route template or endpoint path
 */
export function clearIdempotencyKey(method: string, path: string): void {
  const operationKey = `${method.toUpperCase()}:${path}`;
  keyStore.delete(operationKey);
}

/**
 * Clear all stored idempotency keys (useful for logout/session reset)
 */
export function clearAllIdempotencyKeys(): void {
  keyStore.clear();
}

/**
 * Hook for React forms to attach idempotency key to mutation requests
 *
 * @param method - HTTP method
 * @param path - Endpoint path
 * @returns Object with key and reset function
 *
 * @example
 * const { key, reset } = useIdempotencyKey('POST', '/sessions');
 *
 * const handleSubmit = async (data) => {
 *   try {
 *     await apiClient.post('/sessions', data, {
 *       headers: { 'Idempotency-Key': key }
 *     });
 *     reset(); // Clear key after success
 *   } catch (error) {
 *     // Keep key on error to allow retry
 *   }
 * };
 */
export function useIdempotencyKey(method: string, path: string) {
  const key = getIdempotencyKey(method, path);

  const reset = () => {
    clearIdempotencyKey(method, path);
  };

  return { key, reset };
}

/**
 * Decorator to automatically attach idempotency key to form submissions
 *
 * @param onSubmit - Original form submit handler
 * @param method - HTTP method for the request
 * @param path - Endpoint path
 * @returns Wrapped submit handler with idempotency key management
 *
 * @example
 * const handleSubmit = withIdempotency(
 *   async (data) => {
 *     await apiClient.post('/sessions', data);
 *   },
 *   'POST',
 *   '/sessions'
 * );
 */
export function withIdempotency<T>(
  onSubmit: (data: T, idempotencyKey: string) => Promise<void>,
  method: string,
  path: string,
) {
  return async (data: T) => {
    const key = getIdempotencyKey(method, path);
    await onSubmit(data, key);
    // Clear key only on success (2xx response)
    clearIdempotencyKey(method, path);
    // Keep key on error to allow retry with same key
    // Server will return 409 if payload changed
  };
}

/**
 * React hook for idempotent form submissions
 *
 * @param method - HTTP method
 * @param path - Endpoint path
 * @returns Helper functions for idempotent operations
 *
 * @example
 * const { withKey, reset } = useIdempotentForm('POST', '/sessions');
 *
 * const handleSubmit = async (data) => {
 *   await withKey(async (key) => {
 *     await apiClient.post('/sessions', data, {
 *       headers: { 'Idempotency-Key': key }
 *     });
 *   });
 * };
 */
export function useIdempotentForm(method: string, path: string) {
  const key = getIdempotencyKey(method, path);

  const withKey = async <T>(fn: (idempotencyKey: string) => Promise<T>): Promise<T> => {
    const result = await fn(key);
    clearIdempotencyKey(method, path);
    return result;
    // Keep key on error for retry
  };

  const reset = () => {
    clearIdempotencyKey(method, path);
  };

  return { key, withKey, reset };
}
