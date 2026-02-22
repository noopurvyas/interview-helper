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

  const serverQuestionIds = new Set((serverData.questions as Question[]).map((q) => q.id));
  const serverBookmarkIds = new Set((serverData.bookmarks as Bookmark[]).map((b) => b.id));
  const serverInterviewIds = new Set((serverData.interviews as Interview[]).map((i) => i.id));
  const serverNotesByCompany = new Map(
    (serverData.notes as CompanyNote[]).map((n) => [n.company, n])
  );

  // Restore data from server that's missing locally (IndexedDB was wiped)
  for (const q of serverData.questions as Question[]) {
    if (!localQuestionIds.has(q.id)) {
      await putQuestionDirect(q);
    }
  }
  for (const b of serverData.bookmarks as Bookmark[]) {
    if (!localBookmarkIds.has(b.id)) {
      await putBookmarkDirect(b);
    }
  }
  for (const i of serverData.interviews as Interview[]) {
    if (!localInterviewIds.has(i.id)) {
      await putInterviewDirect(i);
    }
  }
  // Bug #4 fix: only restore notes missing locally, don't overwrite local edits
  for (const n of serverData.notes as CompanyNote[]) {
    if (!localNotesByCompany.has(n.company)) {
      await putCompanyNoteDirect(n);
    }
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
  let result: unknown = null;

  switch (store) {
    case 'questions':
      if (op === 'create') result = await apiUpsertQuestion(data);
      else if (op === 'update') result = await apiUpdateQuestion((data as Question).id, data);
      else if (op === 'delete' && entityId) result = await apiDeleteQuestion(entityId);
      break;
    case 'bookmarks':
      if (op === 'create') result = await apiUpsertBookmark(data);
      else if (op === 'update') result = await apiUpdateBookmark((data as Bookmark).id, data);
      else if (op === 'delete' && entityId) result = await apiDeleteBookmark(entityId);
      break;
    case 'interviews':
      if (op === 'create') result = await apiUpsertInterview(data);
      else if (op === 'update') result = await apiUpdateInterview((data as Interview).id, data);
      else if (op === 'delete' && entityId) result = await apiDeleteInterview(entityId);
      break;
    case 'companyNotes':
      if (data && (op === 'create' || op === 'update')) {
        const note = data as CompanyNote;
        result = await apiUpsertNote(note.company, data);
      }
      break;
  }

  if (result === null) {
    // Failed — queue for retry (only when called from live mutation, not from flush)
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
