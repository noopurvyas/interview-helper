const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const headers: Record<string, string> = {};
    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    // Network failure — offline or server down
    return null;
  }
}

// Questions
export const apiGetQuestions = () => request<unknown[]>('/questions');
export const apiUpsertQuestion = (q: unknown) =>
  request('/questions', { method: 'POST', body: JSON.stringify(q) });
export const apiUpdateQuestion = (id: string, q: unknown) =>
  request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(q) });
export const apiDeleteQuestion = (id: string) =>
  request(`/questions/${id}`, { method: 'DELETE' });

// Bookmarks
export const apiGetBookmarks = () => request<unknown[]>('/bookmarks');
export const apiUpsertBookmark = (b: unknown) =>
  request('/bookmarks', { method: 'POST', body: JSON.stringify(b) });
export const apiUpdateBookmark = (id: string, b: unknown) =>
  request(`/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(b) });
export const apiDeleteBookmark = (id: string) =>
  request(`/bookmarks/${id}`, { method: 'DELETE' });

// Interviews
export const apiGetInterviews = () => request<unknown[]>('/interviews');
export const apiUpsertInterview = (i: unknown) =>
  request('/interviews', { method: 'POST', body: JSON.stringify(i) });
export const apiUpdateInterview = (id: string, i: unknown) =>
  request(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(i) });
export const apiDeleteInterview = (id: string) =>
  request(`/interviews/${id}`, { method: 'DELETE' });

// Company Notes
export const apiGetNote = (company: string) =>
  request(`/notes/${encodeURIComponent(company)}`);
export const apiUpsertNote = (company: string, data: unknown) =>
  request(`/notes/${encodeURIComponent(company)}`, { method: 'PUT', body: JSON.stringify(data) });

// Sync
export interface SyncPullResponse {
  questions: unknown[];
  bookmarks: unknown[];
  interviews: unknown[];
  notes: unknown[];
}

export const apiSyncPull = () => request<SyncPullResponse>('/sync/pull', { method: 'POST' });
export const apiSyncPush = (data: unknown) =>
  request('/sync/push', { method: 'POST', body: JSON.stringify(data) });
