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
  putQuestionDirect,
  putBookmarkDirect,
  putInterviewDirect,
  putCompanyNoteDirect,
  getSyncQueue,
  clearSyncQueue,
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

  const localQuestionIds = new Set(localQuestions.map((q) => q.id));
  const localBookmarkIds = new Set(localBookmarks.map((b) => b.id));
  const localInterviewIds = new Set(localInterviews.map((i) => i.id));

  const serverQuestionIds = new Set((serverData.questions as Question[]).map((q) => q.id));
  const serverBookmarkIds = new Set((serverData.bookmarks as Bookmark[]).map((b) => b.id));
  const serverInterviewIds = new Set((serverData.interviews as Interview[]).map((i) => i.id));

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
  for (const n of serverData.notes as CompanyNote[]) {
    await putCompanyNoteDirect(n);
  }

  // Push local data not on server (new offline data)
  const newQuestions = localQuestions.filter((q) => !serverQuestionIds.has(q.id));
  const newBookmarks = localBookmarks.filter((b) => !serverBookmarkIds.has(b.id));
  const newInterviews = localInterviews.filter((i) => !serverInterviewIds.has(i.id));

  if (newQuestions.length || newBookmarks.length || newInterviews.length) {
    await apiSyncPush({
      questions: newQuestions,
      bookmarks: newBookmarks,
      interviews: newInterviews,
    });
  }

  // Flush any queued offline mutations
  await flushSyncQueue();
}

export async function handleMutation(
  op: 'create' | 'update' | 'delete',
  store: string,
  data?: unknown,
  id?: string
): Promise<void> {
  let result: unknown = null;

  switch (store) {
    case 'questions':
      if (op === 'create') result = await apiUpsertQuestion(data);
      else if (op === 'update') result = await apiUpdateQuestion((data as Question).id, data);
      else if (op === 'delete' && id) result = await apiDeleteQuestion(id);
      break;
    case 'bookmarks':
      if (op === 'create') result = await apiUpsertBookmark(data);
      else if (op === 'update') result = await apiUpdateBookmark((data as Bookmark).id, data);
      else if (op === 'delete' && id) result = await apiDeleteBookmark(id);
      break;
    case 'interviews':
      if (op === 'create') result = await apiUpsertInterview(data);
      else if (op === 'update') result = await apiUpdateInterview((data as Interview).id, data);
      else if (op === 'delete' && id) result = await apiDeleteInterview(id);
      break;
    case 'companyNotes':
      if (data && (op === 'create' || op === 'update')) {
        const note = data as CompanyNote;
        result = await apiUpsertNote(note.company, data);
      }
      break;
  }

  if (result === null) {
    // Failed — queue for retry
    await queueMutation(op, store, data, id);
    startRetryLoop();
  }
}

async function queueMutation(
  op: string,
  store: string,
  data?: unknown,
  id?: string
): Promise<void> {
  try {
    const { addToSyncQueue } = await import('./indexeddb');
    await addToSyncQueue({ op, store, data, id, timestamp: Date.now() });
  } catch {
    // If syncQueue store doesn't exist yet, silently ignore
  }
}

async function flushSyncQueue(): Promise<void> {
  try {
    const queue = await getSyncQueue();
    if (!queue.length) return;

    for (const item of queue) {
      await handleMutation(
        item.op as 'create' | 'update' | 'delete',
        item.store as string,
        item.data,
        item.id as string | undefined
      );
    }

    await clearSyncQueue();
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
