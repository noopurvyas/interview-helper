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
  try {
    const questions = (getAllQuestions.all() as Record<string, unknown>[]).map(deserializeQuestion);
    const bookmarks = getAllBookmarks.all();
    const interviews = (getAllInterviews.all() as Record<string, unknown>[]).map(deserializeInterview);
    const notes = getAllNotes.all();
    res.json({ questions, bookmarks, interviews, notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pull data' });
  }
});

// Push bulk data to server
syncRouter.post('/push', (req, res) => {
  const { questions, bookmarks, interviews, notes, deletions } = req.body ?? {};

  try {
    const pushMany = db.transaction(() => {
      if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q?.id) upsertQuestion.run(serializeQuestion(q));
        }
      }
      if (Array.isArray(bookmarks)) {
        for (const b of bookmarks) {
          if (b?.id) upsertBookmark.run(serializeBookmark(b));
        }
      }
      if (Array.isArray(interviews)) {
        for (const i of interviews) {
          if (i?.id) upsertInterview.run(serializeInterview(i));
        }
      }
      if (Array.isArray(notes)) {
        for (const n of notes) {
          if (n?.company && n?.content != null && n?.updatedAt != null) {
            upsertNote.run({ company: n.company, content: n.content, updatedAt: n.updatedAt });
          }
        }
      }
      if (Array.isArray(deletions)) {
        for (const d of deletions) {
          if (!d?.id) continue;
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to push data' });
  }
});
