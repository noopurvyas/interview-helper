import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'interview-helper.db'));

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    company TEXT,
    question TEXT NOT NULL,
    answerVariations TEXT NOT NULL DEFAULT '[]',
    isFavorite INTEGER NOT NULL DEFAULT 0,
    practiceCount INTEGER NOT NULL DEFAULT 0,
    lastPracticed INTEGER,
    createdAt INTEGER NOT NULL,
    subtype TEXT,
    difficulty TEXT,
    tags TEXT DEFAULT '[]',
    codeSnippet TEXT
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    resourceType TEXT NOT NULL,
    category TEXT,
    collection TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'unread',
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    dateTime INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    role TEXT,
    interviewType TEXT NOT NULL,
    round TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    linkedQuestionIds TEXT DEFAULT '[]',
    location TEXT,
    contactName TEXT,
    contactEmail TEXT,
    icalUid TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS companyNotes (
    company TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updatedAt INTEGER NOT NULL
  );
`);

// --- Serialization helpers ---

export function serializeQuestion(q: Record<string, unknown>): Record<string, unknown> {
  return {
    id: q.id,
    type: q.type,
    company: q.company ?? null,
    question: q.question,
    answerVariations: JSON.stringify(q.answerVariations ?? []),
    isFavorite: q.isFavorite ? 1 : 0,
    practiceCount: q.practiceCount ?? 0,
    lastPracticed: q.lastPracticed ?? null,
    createdAt: q.createdAt,
    subtype: q.subtype ?? null,
    difficulty: q.difficulty ?? null,
    tags: JSON.stringify(q.tags ?? []),
    codeSnippet: q.codeSnippet ? JSON.stringify(q.codeSnippet) : null,
  };
}

export function deserializeQuestion(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    answerVariations: JSON.parse(row.answerVariations as string || '[]'),
    isFavorite: row.isFavorite === 1,
    tags: JSON.parse(row.tags as string || '[]'),
    codeSnippet: row.codeSnippet ? JSON.parse(row.codeSnippet as string) : undefined,
    lastPracticed: row.lastPracticed ?? null,
  };
}

export function serializeBookmark(b: Record<string, unknown>): Record<string, unknown> {
  return {
    id: b.id,
    title: b.title,
    url: b.url,
    resourceType: b.resourceType,
    category: b.category ?? null,
    collection: b.collection ?? null,
    notes: b.notes ?? null,
    status: b.status ?? 'unread',
    createdAt: b.createdAt,
  };
}

export function serializeInterview(i: Record<string, unknown>): Record<string, unknown> {
  return {
    id: i.id,
    company: i.company,
    dateTime: i.dateTime,
    duration: i.duration ?? 60,
    role: i.role ?? null,
    interviewType: i.interviewType,
    round: i.round ?? null,
    status: i.status ?? 'scheduled',
    notes: i.notes ?? null,
    linkedQuestionIds: JSON.stringify(i.linkedQuestionIds ?? []),
    location: i.location ?? null,
    contactName: i.contactName ?? null,
    contactEmail: i.contactEmail ?? null,
    icalUid: i.icalUid ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

export function deserializeInterview(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    linkedQuestionIds: JSON.parse(row.linkedQuestionIds as string || '[]'),
  };
}

// --- Shared prepared statements ---

export const statements = {
  questions: {
    getAll: db.prepare('SELECT * FROM questions'),
    upsert: db.prepare(`
      INSERT OR REPLACE INTO questions (id, type, company, question, answerVariations, isFavorite, practiceCount, lastPracticed, createdAt, subtype, difficulty, tags, codeSnippet)
      VALUES (@id, @type, @company, @question, @answerVariations, @isFavorite, @practiceCount, @lastPracticed, @createdAt, @subtype, @difficulty, @tags, @codeSnippet)
    `),
    deleteById: db.prepare('DELETE FROM questions WHERE id = ?'),
  },
  bookmarks: {
    getAll: db.prepare('SELECT * FROM bookmarks'),
    upsert: db.prepare(`
      INSERT OR REPLACE INTO bookmarks (id, title, url, resourceType, category, collection, notes, status, createdAt)
      VALUES (@id, @title, @url, @resourceType, @category, @collection, @notes, @status, @createdAt)
    `),
    deleteById: db.prepare('DELETE FROM bookmarks WHERE id = ?'),
  },
  interviews: {
    getAll: db.prepare('SELECT * FROM interviews'),
    upsert: db.prepare(`
      INSERT OR REPLACE INTO interviews (id, company, dateTime, duration, role, interviewType, round, status, notes, linkedQuestionIds, location, contactName, contactEmail, icalUid, createdAt, updatedAt)
      VALUES (@id, @company, @dateTime, @duration, @role, @interviewType, @round, @status, @notes, @linkedQuestionIds, @location, @contactName, @contactEmail, @icalUid, @createdAt, @updatedAt)
    `),
    deleteById: db.prepare('DELETE FROM interviews WHERE id = ?'),
  },
  notes: {
    getByCompany: db.prepare('SELECT * FROM companyNotes WHERE company = ?'),
    getAll: db.prepare('SELECT * FROM companyNotes'),
    upsert: db.prepare(`
      INSERT OR REPLACE INTO companyNotes (company, content, updatedAt)
      VALUES (@company, @content, @updatedAt)
    `),
  },
};

export default db;
