import type { Question, Bookmark, Interview, CompanyNote } from './indexeddb';

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
export const apiGetQuestions = () => request<Question[]>('/questions');
export const apiUpsertQuestion = (q: Question) =>
  request<{ id: string }>('/questions', { method: 'POST', body: JSON.stringify(q) });
export const apiUpdateQuestion = (id: string, q: Question) =>
  request<{ id: string }>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(q) });
export const apiDeleteQuestion = (id: string) =>
  request<{ deleted: boolean }>(`/questions/${id}`, { method: 'DELETE' });

// Bookmarks
export const apiGetBookmarks = () => request<Bookmark[]>('/bookmarks');
export const apiUpsertBookmark = (b: Bookmark) =>
  request<{ id: string }>('/bookmarks', { method: 'POST', body: JSON.stringify(b) });
export const apiUpdateBookmark = (id: string, b: Bookmark) =>
  request<{ id: string }>(`/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(b) });
export const apiDeleteBookmark = (id: string) =>
  request<{ deleted: boolean }>(`/bookmarks/${id}`, { method: 'DELETE' });

// Interviews
export const apiGetInterviews = () => request<Interview[]>('/interviews');
export const apiUpsertInterview = (i: Interview) =>
  request<{ id: string }>('/interviews', { method: 'POST', body: JSON.stringify(i) });
export const apiUpdateInterview = (id: string, i: Interview) =>
  request<{ id: string }>(`/interviews/${id}`, { method: 'PUT', body: JSON.stringify(i) });
export const apiDeleteInterview = (id: string) =>
  request<{ deleted: boolean }>(`/interviews/${id}`, { method: 'DELETE' });

// Company Notes
export const apiGetNote = (company: string) =>
  request<CompanyNote>(`/notes/${encodeURIComponent(company)}`);
export const apiUpsertNote = (company: string, data: CompanyNote) =>
  request<CompanyNote>(`/notes/${encodeURIComponent(company)}`, { method: 'PUT', body: JSON.stringify(data) });

// Sync
export interface SyncPullResponse {
  questions: Question[];
  bookmarks: Bookmark[];
  interviews: Interview[];
  notes: CompanyNote[];
}

export interface SyncPushData {
  questions?: Question[];
  bookmarks?: Bookmark[];
  interviews?: Interview[];
  notes?: CompanyNote[];
}

export const apiSyncPull = () => request<SyncPullResponse>('/sync/pull', { method: 'POST' });
export const apiSyncPush = (data: SyncPushData) =>
  request<{ success: boolean }>('/sync/push', { method: 'POST', body: JSON.stringify(data) });
