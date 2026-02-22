import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQuestion, makeBookmark, makeInterview } from '../test/factories';

// Mock the api module
vi.mock('./api', () => ({
  apiSyncPull: vi.fn(),
  apiSyncPush: vi.fn(),
  apiUpsertQuestion: vi.fn(),
  apiUpdateQuestion: vi.fn(),
  apiDeleteQuestion: vi.fn(),
  apiUpsertBookmark: vi.fn(),
  apiUpdateBookmark: vi.fn(),
  apiDeleteBookmark: vi.fn(),
  apiUpsertInterview: vi.fn(),
  apiUpdateInterview: vi.fn(),
  apiDeleteInterview: vi.fn(),
  apiUpsertNote: vi.fn(),
}));

// Mock indexeddb to avoid real DB operations in sync tests
vi.mock('./indexeddb', () => ({
  getAllQuestions: vi.fn().mockResolvedValue([]),
  getAllBookmarks: vi.fn().mockResolvedValue([]),
  getAllInterviews: vi.fn().mockResolvedValue([]),
  getAllCompanyNotes: vi.fn().mockResolvedValue([]),
  putQuestionDirect: vi.fn().mockResolvedValue(undefined),
  putBookmarkDirect: vi.fn().mockResolvedValue(undefined),
  putInterviewDirect: vi.fn().mockResolvedValue(undefined),
  putCompanyNoteDirect: vi.fn().mockResolvedValue(undefined),
  getSyncQueue: vi.fn().mockResolvedValue([]),
  clearSyncQueue: vi.fn().mockResolvedValue(undefined),
  addToSyncQueue: vi.fn().mockResolvedValue(undefined),
}));

import { handleMutation } from './sync';
import {
  apiUpsertQuestion,
  apiUpdateQuestion,
  apiDeleteQuestion,
  apiUpsertBookmark,
  apiDeleteBookmark,
  apiUpsertInterview,
  apiDeleteInterview,
  apiUpsertNote,
} from './api';

describe('handleMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiUpsertQuestion for create questions', async () => {
    const q = makeQuestion();
    vi.mocked(apiUpsertQuestion).mockResolvedValue({ id: q.id });
    await handleMutation('create', 'questions', q);
    expect(apiUpsertQuestion).toHaveBeenCalledWith(q);
  });

  it('calls apiUpdateQuestion for update questions', async () => {
    const q = makeQuestion();
    vi.mocked(apiUpdateQuestion).mockResolvedValue({ id: q.id });
    await handleMutation('update', 'questions', q);
    expect(apiUpdateQuestion).toHaveBeenCalledWith(q.id, q);
  });

  it('calls apiDeleteQuestion for delete questions', async () => {
    vi.mocked(apiDeleteQuestion).mockResolvedValue({ deleted: true });
    await handleMutation('delete', 'questions', undefined, 'q-1');
    expect(apiDeleteQuestion).toHaveBeenCalledWith('q-1');
  });

  it('calls apiUpsertBookmark for create bookmarks', async () => {
    const b = makeBookmark();
    vi.mocked(apiUpsertBookmark).mockResolvedValue({ id: b.id });
    await handleMutation('create', 'bookmarks', b);
    expect(apiUpsertBookmark).toHaveBeenCalledWith(b);
  });

  it('calls apiDeleteBookmark for delete bookmarks', async () => {
    vi.mocked(apiDeleteBookmark).mockResolvedValue({ deleted: true });
    await handleMutation('delete', 'bookmarks', undefined, 'b-1');
    expect(apiDeleteBookmark).toHaveBeenCalledWith('b-1');
  });

  it('calls apiUpsertInterview for create interviews', async () => {
    const i = makeInterview();
    vi.mocked(apiUpsertInterview).mockResolvedValue({ id: i.id });
    await handleMutation('create', 'interviews', i);
    expect(apiUpsertInterview).toHaveBeenCalledWith(i);
  });

  it('calls apiDeleteInterview for delete interviews', async () => {
    vi.mocked(apiDeleteInterview).mockResolvedValue({ deleted: true });
    await handleMutation('delete', 'interviews', undefined, 'int-1');
    expect(apiDeleteInterview).toHaveBeenCalledWith('int-1');
  });

  it('calls apiUpsertNote for companyNotes create/update', async () => {
    const note = { company: 'Google', content: 'Notes here', updatedAt: Date.now() };
    vi.mocked(apiUpsertNote).mockResolvedValue(note);
    await handleMutation('update', 'companyNotes', note);
    expect(apiUpsertNote).toHaveBeenCalledWith('Google', note);
  });

  it('rejects when API returns null (network failure)', async () => {
    const q = makeQuestion();
    vi.mocked(apiUpsertQuestion).mockResolvedValue(null);
    await expect(handleMutation('create', 'questions', q)).rejects.toThrow('sync failed');
  });

  it('silently discards unrecognized store (no infinite retry)', async () => {
    // Should resolve without error, not reject
    await expect(handleMutation('create', 'unknownStore', {})).resolves.toBeUndefined();
  });

  it('silently discards delete without entityId', async () => {
    // delete questions without entityId → no API call, should resolve
    await expect(handleMutation('delete', 'questions', undefined, undefined)).resolves.toBeUndefined();
  });

  it('silently discards companyNotes delete (unsupported op)', async () => {
    await expect(handleMutation('delete', 'companyNotes', undefined, 'Google')).resolves.toBeUndefined();
  });
});
