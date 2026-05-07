//API helper utility.
//avoid repeating fetch code everywhere.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
// Base backend URL
// Uses environment variable if available
// Otherwise defaults to local backend server
type ApiOptions = RequestInit & {
  token?: string;
};
// Extends normal fetch options by adding optional auth token

// Reusable fetch helper for all API requests

// Centralized fetch helper so auth headers and error handling stay consistent.
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);  // Create request headers object
  // If request contains body and content type not already set,
  // automatically mark as JSON request
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // If authentication token exists,
  // add Authorization header
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  // Send request to backend
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
   // Parse JSON response safely
  // If parsing fails, return null instead of crashing
  const payload = await response.json().catch(() => null);
  // If backend returns error status
  if (!response.ok) {
    throw new Error(payload?.message ?? "Request failed.");
  }
  // Return successful response data
  return payload as T;
}

export { API_BASE_URL }; // Export base URL for reuse elsewhere