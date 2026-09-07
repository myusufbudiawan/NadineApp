// Thin typed API client — one file per backend domain (matches Section 12).
// Sharing and Reports are the first mobile features that talk to the backend
// directly rather than through the offline-first SQLite path: inviting a
// caregiver and generating a report are inherently server-mediated actions,
// not local capture, so there is nothing to queue offline for them.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(body || response.statusText, response.status);
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  return (contentType.includes('application/json') ? response.json() : response.text()) as Promise<T>;
}
