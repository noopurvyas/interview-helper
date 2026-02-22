import { Router } from 'express';
import db, { serializeQuestion, deserializeQuestion, serializeBookmark, serializeInterview, deserializeInterview } from '../db.ts';

export const syncRouter = Router();

const getAllQuestions = db.prepare('SELECT * FROM questions');
const getAllBookmarks = db.prepare('SELECT * FROM bookmarks');
const getAllInterviews = db.prepare('SELECT * FROM interviews');
const getAllNotes = db.prepare('SELECT * FROM companyNotes');

const upsertQuestion = db.prepare(`
  INSERT OR REPLACE INTO questions (id, type, company, question, answerVariations, isFavorite, practiceCount, lastPracticed, createdAt, subtype, difficulty, tags, codeSnippet)
  VALUES (@id, @type, @company, @question, @answerVariations, @isFavorite, @practiceCount, @lastPracticed, @createdAt, @subtype, @difficulty, @tags, @codeSnippet)
`);
const upsertBookmark = db.prepare(`
  INSERT OR REPLACE INTO bookmarks (id, title, url, resourceType, category, collection, notes, status, createdAt)
  VALUES (@id, @title, @url, @resourceType, @category, @collection, @notes, @status, @createdAt)
`);
const upsertInterview = db.prepare(`
  INSERT OR REPLACE INTO interviews (id, company, dateTime, duration, role, interviewType, round, status, notes, linkedQuestionIds, location, contactName, contactEmail, icalUid, createdAt, updatedAt)
  VALUES (@id, @company, @dateTime, @duration, @role, @interviewType, @round, @status, @notes, @linkedQuestionIds, @location, @contactName, @contactEmail, @icalUid, @createdAt, @updatedAt)
`);
const upsertNote = db.prepare(`
  INSERT OR REPLACE INTO companyNotes (company, content, updatedAt)
  VALUES (@company, @content, @updatedAt)
`);

const deleteQuestion = db.prepare('DELETE FROM questions WHERE id = ?');
const deleteBookmark = db.prepare('DELETE FROM bookmarks WHERE id = ?');
const deleteInterview = db.prepare('DELETE FROM interviews WHERE id = ?');

// Pull all data from server
syncRouter.post('/pull', (_req, res) => {
  const questions = (getAllQuestions.all() as Record<string, unknown>[]).map(deserializeQuestion);
  const bookmarks = getAllBookmarks.all();
  const interviews = (getAllInterviews.all() as Record<string, unknown>[]).map(deserializeInterview);
  const notes = getAllNotes.all();
  res.json({ questions, bookmarks, interviews, notes });
});

// Push bulk data to server
syncRouter.post('/push', (req, res) => {
  const { questions, bookmarks, interviews, notes, deletions } = req.body;

  const pushMany = db.transaction(() => {
    if (questions) {
      for (const q of questions) {
        upsertQuestion.run(serializeQuestion(q));
      }
    }
    if (bookmarks) {
      for (const b of bookmarks) {
        upsertBookmark.run(serializeBookmark(b));
      }
    }
    if (interviews) {
      for (const i of interviews) {
        upsertInterview.run(serializeInterview(i));
      }
    }
    if (notes) {
      for (const n of notes) {
        upsertNote.run(n);
      }
    }
    if (deletions) {
      for (const d of deletions) {
        switch (d.store) {
          case 'questions': deleteQuestion.run(d.id); break;
          case 'bookmarks': deleteBookmark.run(d.id); break;
          case 'interviews': deleteInterview.run(d.id); break;
        }
      }
    }
  });

  pushMany();
  res.json({ success: true });
});
