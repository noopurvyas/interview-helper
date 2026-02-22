import {
  apiSyncPull,
  apiSyncPush,
  apiUpsertQuestion,
  apiUpdateQuestion,
  apiDeleteQuestion,
  apiUpsertBookmark,
  apiUpdateBookmark,
  apiDeleteBookmark,
  apiUpsertInterview,
  apiUpdateInterview,
  apiDeleteInterview,
  apiUpsertNote,
} from './api';
import type { Question, Bookmark, Interview, CompanyNote } from './indexeddb';

type HydrationCallback = () => void;
let onHydrationComplete: HydrationCallback | null = null;
export function setHydrationCallback(cb: HydrationCallback) { onHydrationComplete = cb; }
import {
  getAllQuestions,
  getAllBookmarks,
  getAllInterviews,
  getAllCompanyNotes,
  putQuestionDirect,
  putBookmarkDirect,
  putInterviewDirect,
  putCompanyNoteDirect,
  getSyncQueue,
  clearSyncQueue,
  addToSyncQueue,
} from './indexeddb';

let initialized = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

export async function initSync(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Pull from server and merge into IndexedDB
  const serverData = await apiSyncPull();
  if (!serverData) {
    // Server unreachable — start offline, try flushing queue
    startRetryLoop();
    return;
  }

  // Build sets of existing IDs in IndexedDB
  const localQuestions = await getAllQuestions();
  const localBookmarks = await getAllBookmarks();
  const localInterviews = await getAllInterviews();
  const localNotes = await getAllCompanyNotes();

  const localQuestionIds = new Set(localQuestions.map((q) => q.id));
  const localBookmarkIds = new Set(localBookmarks.map((b) => b.id));
  const localInterviewIds = new Set(localInterviews.map((i) => i.id));
  const localNotesByCompany = new Map(localNotes.map((n) => [n.company, n]));

  const serverQuestionIds = new Set(serverData.questions.map((q) => q.id));
  const serverBookmarkIds = new Set(serverData.bookmarks.map((b) => b.id));
  const serverInterviewIds = new Set(serverData.interviews.map((i) => i.id));
  const serverNotesByCompany = new Map(
    serverData.notes.map((n) => [n.company, n])
  );

  // Restore data from server that's missing locally (IndexedDB was wiped)
  let hydrated = false;
  for (const q of serverData.questions) {
    if (!localQuestionIds.has(q.id)) {
      await putQuestionDirect(q);
      hydrated = true;
    }
  }
  for (const b of serverData.bookmarks) {
    if (!localBookmarkIds.has(b.id)) {
      await putBookmarkDirect(b);
      hydrated = true;
    }
  }
  for (const i of serverData.interviews) {
    if (!localInterviewIds.has(i.id)) {
      await putInterviewDirect(i);
      hydrated = true;
    }
  }
  for (const n of serverData.notes) {
    if (!localNotesByCompany.has(n.company)) {
      await putCompanyNoteDirect(n);
      hydrated = true;
    }
  }

  // Notify UI to refresh if data was restored from server
  if (hydrated) {
    onHydrationComplete?.();
  }

  // Push local data not on server (new offline data)
  const newQuestions = localQuestions.filter((q) => !serverQuestionIds.has(q.id));
  const newBookmarks = localBookmarks.filter((b) => !serverBookmarkIds.has(b.id));
  const newInterviews = localInterviews.filter((i) => !serverInterviewIds.has(i.id));
  const newNotes = localNotes.filter((n) => !serverNotesByCompany.has(n.company));

  if (newQuestions.length || newBookmarks.length || newInterviews.length || newNotes.length) {
    await apiSyncPush({
      questions: newQuestions,
      bookmarks: newBookmarks,
      interviews: newInterviews,
      notes: newNotes,
    });
  }

  // Flush any queued offline mutations
  await flushSyncQueue();
}

export async function handleMutation(
  op: 'create' | 'update' | 'delete',
  store: string,
  data?: unknown,
  entityId?: string
): Promise<void> {
  let apiCall: Promise<unknown> | null = null;

  switch (store) {
    case 'questions': {
      const q = data as Question;
      if (op === 'create') apiCall = apiUpsertQuestion(q);
      else if (op === 'update') apiCall = apiUpdateQuestion(q.id, q);
      else if (op === 'delete' && entityId) apiCall = apiDeleteQuestion(entityId);
      break;
    }
    case 'bookmarks': {
      const b = data as Bookmark;
      if (op === 'create') apiCall = apiUpsertBookmark(b);
      else if (op === 'update') apiCall = apiUpdateBookmark(b.id, b);
      else if (op === 'delete' && entityId) apiCall = apiDeleteBookmark(entityId);
      break;
    }
    case 'interviews': {
      const i = data as Interview;
      if (op === 'create') apiCall = apiUpsertInterview(i);
      else if (op === 'update') apiCall = apiUpdateInterview(i.id, i);
      else if (op === 'delete' && entityId) apiCall = apiDeleteInterview(entityId);
      break;
    }
    case 'companyNotes': {
      if (data && (op === 'create' || op === 'update')) {
        const note = data as CompanyNote;
        apiCall = apiUpsertNote(note.company, note);
      }
      break;
    }
  }

  // No matching handler — silently discard (don't queue for retry)
  if (apiCall === null) return;

  const result = await apiCall;
  if (result === null) {
    // Network failure — queue for retry
    return Promise.reject(new Error('sync failed'));
  }
}

// Bug #2 fix: clear queue BEFORE processing so re-queued failures aren't wiped
async function flushSyncQueue(): Promise<void> {
  try {
    const queue = await getSyncQueue();
    if (!queue.length) return;

    // Snapshot and clear — failed items get re-added by individual retries
    await clearSyncQueue();

    for (const item of queue) {
      try {
        await handleMutation(
          item.op as 'create' | 'update' | 'delete',
          item.store as string,
          item.data,
          item.entityId,
        );
      } catch {
        // Re-queue this individual failed item
        await addToSyncQueue({
          op: item.op,
          store: item.store,
          data: item.data,
          entityId: item.entityId,
          timestamp: item.timestamp,
        });
      }
    }
  } catch {
    // Queue store may not exist yet
  }
}

function startRetryLoop(): void {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    const queue = await getSyncQueue().catch(() => []);
    if (queue.length === 0) {
      if (retryTimer) clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    await flushSyncQueue();
  }, 5000);
}

export function stopRetryLoop(): void {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}
