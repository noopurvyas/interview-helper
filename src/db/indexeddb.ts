import { type IDBPDatabase, openDB } from 'idb';

export interface StarFields {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface AnswerVariation {
  id: string;
  content: string;
  keyPoints: string[];
  isPrimary: boolean;
  star?: StarFields;
}

export const BEHAVIORAL_TEMPLATES: { category: string; questions: string[] }[] = [
  {
    category: 'Leadership',
    questions: [
      'Tell me about a time you led a team through a difficult project.',
      'Describe a situation where you had to make an unpopular decision.',
      'Give an example of when you mentored someone.',
    ],
  },
  {
    category: 'Conflict',
    questions: [
      'Tell me about a time you had a disagreement with a coworker.',
      'Describe a situation where you had to handle a difficult stakeholder.',
      'Give an example of when you resolved a conflict on your team.',
    ],
  },
  {
    category: 'Teamwork',
    questions: [
      'Tell me about a time you worked with a cross-functional team.',
      'Describe a situation where you had to rely on others to complete a task.',
      'Give an example of when you helped a teammate who was struggling.',
    ],
  },
  {
    category: 'Failure',
    questions: [
      'Tell me about a time you failed at something. What did you learn?',
      'Describe a project that did not go as planned.',
      'Give an example of when you received critical feedback and how you responded.',
    ],
  },
  {
    category: 'Problem Solving',
    questions: [
      'Tell me about a time you solved a complex problem under pressure.',
      'Describe a situation where you had to think creatively to find a solution.',
      'Give an example of when you identified a problem before others noticed.',
    ],
  },
  {
    category: 'Communication',
    questions: [
      'Tell me about a time you had to explain a technical concept to a non-technical audience.',
      'Describe a situation where miscommunication caused an issue and how you fixed it.',
      'Give an example of when you persuaded someone to see your point of view.',
    ],
  },
];

export interface Question {
  id: string;
  type: 'behavioral' | 'technical';
  company: string;
  question: string;
  answerVariations: AnswerVariation[];
  isFavorite: boolean;
  practiceCount: number;
  lastPracticed: number | null;
  createdAt: number;
}

export type BookmarkStatus = 'unread' | 'in-progress' | 'completed';
export type ResourceType = 'blog' | 'video' | 'course' | 'podcast' | 'docs' | 'other';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  resourceType: ResourceType;
  category?: string;
  collection?: string;
  notes?: string;
  status: BookmarkStatus;
  createdAt: number;
}

export function detectResourceType(url: string): ResourceType {
  const hostname = new URL(url).hostname.toLowerCase();
  const path = new URL(url).pathname.toLowerCase();

  if (/youtube\.com|youtu\.be|vimeo\.com|twitch\.tv/.test(hostname)) return 'video';
  if (/udemy\.com|coursera\.org|educative\.io|leetcode\.com|hackerrank\.com/.test(hostname)) return 'course';
  if (/medium\.com|dev\.to|hashnode\.dev|substack\.com|blog/.test(hostname)) return 'blog';
  if (/spotify\.com|podcasts\.apple\.com|anchor\.fm/.test(hostname) || /podcast/.test(path)) return 'podcast';
  if (/docs\.|documentation|wiki|readme|\.io\/docs|developer\./.test(hostname + path)) return 'docs';

  return 'other';
}

export async function getUniqueCollections(): Promise<string[]> {
  const database = await initDB();
  const allBookmarks = await database.getAll(BOOKMARKS_STORE);
  const collections = new Set(
    allBookmarks
      .filter((b: Bookmark) => b.collection)
      .map((b: Bookmark) => b.collection!)
  );
  return Array.from(collections).sort();
}

export interface CompanyNote {
  company: string;
  content: string;
  updatedAt: number;
}

let db: IDBPDatabase | null = null;

const DB_NAME = 'interview-helper';
const DB_VERSION = 2;
const QUESTIONS_STORE = 'questions';
const BOOKMARKS_STORE = 'bookmarks';
const NOTES_STORE = 'companyNotes';

async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create questions store
      if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
        const questionsStore = db.createObjectStore(QUESTIONS_STORE, {
          keyPath: 'id',
        });
        questionsStore.createIndex('type', 'type');
        questionsStore.createIndex('company', 'company');
        questionsStore.createIndex('isFavorite', 'isFavorite');
        questionsStore.createIndex('createdAt', 'createdAt');
        questionsStore.createIndex('type-company', ['type', 'company']);
      }

      // Create bookmarks store
      if (!db.objectStoreNames.contains(BOOKMARKS_STORE)) {
        const bookmarksStore = db.createObjectStore(BOOKMARKS_STORE, {
          keyPath: 'id',
        });
        bookmarksStore.createIndex('resourceType', 'resourceType');
        bookmarksStore.createIndex('category', 'category');
        bookmarksStore.createIndex('createdAt', 'createdAt');
      }

      // Create company notes store (v2)
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: 'company' });
      }
    },
  });

  return db;
}

// Question operations
export async function addQuestion(question: Omit<Question, 'id'>): Promise<string> {
  const database = await initDB();
  const id = crypto.randomUUID();
  const newQuestion: Question = {
    ...question,
    id,
  };
  await database.add(QUESTIONS_STORE, newQuestion);
  return id;
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  const database = await initDB();
  return database.get(QUESTIONS_STORE, id);
}

export async function updateQuestion(question: Question): Promise<void> {
  const database = await initDB();
  await database.put(QUESTIONS_STORE, question);
}

export async function deleteQuestion(id: string): Promise<void> {
  const database = await initDB();
  await database.delete(QUESTIONS_STORE, id);
}

export async function getQuestionsByType(type: 'behavioral' | 'technical'): Promise<Question[]> {
  const database = await initDB();
  return database.getAllFromIndex(QUESTIONS_STORE, 'type', type);
}

export async function getQuestionsByCompany(company: string): Promise<Question[]> {
  const database = await initDB();
  return database.getAllFromIndex(QUESTIONS_STORE, 'company', company);
}

export async function getQuestionsByTypeAndCompany(
  type: 'behavioral' | 'technical',
  company: string
): Promise<Question[]> {
  const database = await initDB();
  return database.getAllFromIndex(QUESTIONS_STORE, 'type-company', [type, company]);
}

export async function getFavoriteQuestions(type?: 'behavioral' | 'technical'): Promise<Question[]> {
  const database = await initDB();
  const allFavorites = await database.getAllFromIndex(QUESTIONS_STORE, 'isFavorite', 1);

  if (type) {
    return allFavorites.filter((q) => q.type === type);
  }

  return allFavorites;
}

export async function getAllQuestions(): Promise<Question[]> {
  const database = await initDB();
  return database.getAll(QUESTIONS_STORE);
}

export async function searchQuestions(query: string): Promise<Question[]> {
  const database = await initDB();
  const allQuestions = await database.getAll(QUESTIONS_STORE);

  const lowerQuery = query.toLowerCase();
  return allQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(lowerQuery) ||
      q.company.toLowerCase().includes(lowerQuery) ||
      q.answerVariations.some((av: AnswerVariation) =>
        av.content.toLowerCase().includes(lowerQuery)
      )
  );
}

export async function getUniqueCompanies(): Promise<string[]> {
  const database = await initDB();
  const allQuestions = await database.getAll(QUESTIONS_STORE);
  const companies = new Set(allQuestions.map((q) => q.company));
  return Array.from(companies).sort();
}

// Bookmark operations
export async function addBookmark(
  bookmark: Omit<Bookmark, 'id'>
): Promise<string> {
  const database = await initDB();
  const id = crypto.randomUUID();
  const newBookmark: Bookmark = {
    ...bookmark,
    id,
  };
  await database.add(BOOKMARKS_STORE, newBookmark);
  return id;
}

export async function getBookmark(id: string): Promise<Bookmark | undefined> {
  const database = await initDB();
  return database.get(BOOKMARKS_STORE, id);
}

export async function updateBookmark(bookmark: Bookmark): Promise<void> {
  const database = await initDB();
  await database.put(BOOKMARKS_STORE, bookmark);
}

export async function deleteBookmark(id: string): Promise<void> {
  const database = await initDB();
  await database.delete(BOOKMARKS_STORE, id);
}

export async function getBookmarksByType(
  resourceType: ResourceType
): Promise<Bookmark[]> {
  const database = await initDB();
  return database.getAllFromIndex(BOOKMARKS_STORE, 'resourceType', resourceType);
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const database = await initDB();
  return database.getAll(BOOKMARKS_STORE);
}

export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const database = await initDB();
  const allBookmarks = await database.getAll(BOOKMARKS_STORE);

  const lowerQuery = query.toLowerCase();
  return allBookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.url.toLowerCase().includes(lowerQuery) ||
      (b.category?.toLowerCase().includes(lowerQuery) || false) ||
      (b.notes?.toLowerCase().includes(lowerQuery) || false)
  );
}

export async function getBookmarksByCategory(category: string): Promise<Bookmark[]> {
  const database = await initDB();
  return database.getAllFromIndex(BOOKMARKS_STORE, 'category', category);
}

export async function getUniqueResourceCategories(): Promise<string[]> {
  const database = await initDB();
  const allBookmarks = await database.getAll(BOOKMARKS_STORE);
  const categories = new Set(
    allBookmarks
      .filter((b) => b.category)
      .map((b) => b.category!)
  );
  return Array.from(categories).sort();
}

// Company notes operations
export async function getCompanyNote(company: string): Promise<CompanyNote | undefined> {
  const database = await initDB();
  return database.get(NOTES_STORE, company);
}

export async function saveCompanyNote(company: string, content: string): Promise<void> {
  const database = await initDB();
  const note: CompanyNote = { company, content, updatedAt: Date.now() };
  await database.put(NOTES_STORE, note);
}

// Company stats helper
export interface CompanyStats {
  name: string;
  behavioral: number;
  technical: number;
  total: number;
  lastPracticed: number | null;
}

export async function getCompanyStats(): Promise<CompanyStats[]> {
  const database = await initDB();
  const allQuestions = await database.getAll(QUESTIONS_STORE);

  const statsMap = new Map<string, CompanyStats>();

  for (const q of allQuestions) {
    let stats = statsMap.get(q.company);
    if (!stats) {
      stats = { name: q.company, behavioral: 0, technical: 0, total: 0, lastPracticed: null };
      statsMap.set(q.company, stats);
    }
    stats.total++;
    if (q.type === 'behavioral') stats.behavioral++;
    else stats.technical++;
    if (q.lastPracticed && (!stats.lastPracticed || q.lastPracticed > stats.lastPracticed)) {
      stats.lastPracticed = q.lastPracticed;
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
