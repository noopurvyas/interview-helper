import { type IDBPDatabase, openDB } from 'idb';

export interface AnswerVariation {
  id: string;
  content: string;
  keyPoints: string[];
  isPrimary: boolean;
}

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

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  resourceType: 'blog' | 'video' | 'course' | 'other';
  category?: string;
  notes?: string;
  createdAt: number;
}

let db: IDBPDatabase | null = null;

const DB_NAME = 'interview-helper';
const DB_VERSION = 1;
const QUESTIONS_STORE = 'questions';
const BOOKMARKS_STORE = 'bookmarks';

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
  resourceType: 'blog' | 'video' | 'course' | 'other'
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
