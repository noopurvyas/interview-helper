import type { Question, Bookmark, AnswerVariation, Interview } from '../db/indexeddb';

let counter = 0;

export function makeAnswer(overrides: Partial<AnswerVariation> = {}): AnswerVariation {
  return {
    id: `answer-${++counter}`,
    content: 'Sample answer content',
    keyPoints: ['point1', 'point2'],
    isPrimary: false,
    ...overrides,
  };
}

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: `q-${++counter}`,
    type: 'behavioral',
    company: 'Google',
    question: 'Tell me about a time you led a team.',
    answerVariations: [makeAnswer({ isPrimary: true })],
    isFavorite: false,
    practiceCount: 0,
    lastPracticed: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function makeTechnicalQuestion(overrides: Partial<Question> = {}): Question {
  return makeQuestion({
    type: 'technical',
    question: 'Implement a binary search tree.',
    subtype: 'coding',
    difficulty: 'medium',
    tags: ['trees', 'data-structures'],
    ...overrides,
  });
}

export function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: `b-${++counter}`,
    title: 'React Testing Library Guide',
    url: 'https://testing-library.com/docs/react-testing-library/intro',
    resourceType: 'docs',
    status: 'unread',
    createdAt: Date.now(),
    ...overrides,
  };
}

export function makeInterview(overrides: Partial<Interview> = {}): Interview {
  const now = Date.now();
  return {
    id: `int-${++counter}`,
    company: 'Google',
    dateTime: now + 7 * 24 * 60 * 60 * 1000, // 1 week from now
    duration: 60,
    interviewType: 'video',
    status: 'scheduled',
    linkedQuestionIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
