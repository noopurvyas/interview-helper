import { Router } from 'express';
import db, { statements, serializeQuestion, deserializeQuestion, serializeBookmark, serializeInterview, deserializeInterview } from '../db.ts';

export const syncRouter = Router();

// Pull all data from server
syncRouter.post('/pull', (_req, res) => {
  try {
    const questions = (statements.questions.getAll.all() as Record<string, unknown>[]).map(deserializeQuestion);
    const bookmarks = statements.bookmarks.getAll.all();
    const interviews = (statements.interviews.getAll.all() as Record<string, unknown>[]).map(deserializeInterview);
    const notes = statements.notes.getAll.all();
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
          if (q?.id) statements.questions.upsert.run(serializeQuestion(q));
        }
      }
      if (Array.isArray(bookmarks)) {
        for (const b of bookmarks) {
          if (b?.id) statements.bookmarks.upsert.run(serializeBookmark(b));
        }
      }
      if (Array.isArray(interviews)) {
        for (const i of interviews) {
          if (i?.id) statements.interviews.upsert.run(serializeInterview(i));
        }
      }
      if (Array.isArray(notes)) {
        for (const n of notes) {
          if (n?.company && n?.content != null && n?.updatedAt != null) {
            statements.notes.upsert.run({ company: n.company, content: n.content, updatedAt: n.updatedAt });
          }
        }
      }
      if (Array.isArray(deletions)) {
        for (const d of deletions) {
          if (!d?.id) continue;
          switch (d.store) {
            case 'questions': statements.questions.deleteById.run(d.id); break;
            case 'bookmarks': statements.bookmarks.deleteById.run(d.id); break;
            case 'interviews': statements.interviews.deleteById.run(d.id); break;
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
