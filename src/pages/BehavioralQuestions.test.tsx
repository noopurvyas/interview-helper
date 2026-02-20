import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BehavioralQuestionsPage } from './BehavioralQuestions';
import { makeQuestion } from '../test/factories';
import type { Question } from '../db/indexeddb';

// Mock the hooks
const mockQuestions: Question[] = [];
const mockLoadByType = vi.fn();
const mockAddQuestion = vi.fn();
const mockUpdateQuestion = vi.fn();
const mockDeleteQuestion = vi.fn();
const mockToggleFavorite = vi.fn();
const mockIncrementPracticeCount = vi.fn();

vi.mock('../hooks/useQuestions', () => ({
  useQuestions: () => ({
    questions: mockQuestions,
    companies: [...new Set(mockQuestions.map((q) => q.company).filter(Boolean))],
    loading: false,
    loadByType: mockLoadByType,
    addQuestion: mockAddQuestion,
    updateQuestion: mockUpdateQuestion,
    deleteQuestion: mockDeleteQuestion,
    toggleFavorite: mockToggleFavorite,
    incrementPracticeCount: mockIncrementPracticeCount,
  }),
}));

vi.mock('../hooks/useSearch', () => ({
  useSearch: () => ({
    query: '',
    results: [],
    loading: false,
    error: null,
    handleSearch: vi.fn(),
    clearSearch: vi.fn(),
  }),
}));

describe('BehavioralQuestionsPage', () => {
  beforeEach(() => {
    mockQuestions.length = 0;
    vi.clearAllMocks();
  });

  it('should render the search bar', () => {
    render(<BehavioralQuestionsPage />);
    expect(screen.getByPlaceholderText('Search behavioral questions...')).toBeInTheDocument();
  });

  it('should render Add Question button', () => {
    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('Add Question')).toBeInTheDocument();
  });

  it('should render Templates button', () => {
    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('should show empty state when no questions exist', () => {
    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('should render question cards when questions exist', () => {
    mockQuestions.push(
      makeQuestion({ type: 'behavioral', question: 'Tell me about leadership' }),
      makeQuestion({ type: 'behavioral', question: 'Describe a conflict' }),
    );

    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('Tell me about leadership')).toBeInTheDocument();
    expect(screen.getByText('Describe a conflict')).toBeInTheDocument();
  });

  it('should show Practice button when questions exist', () => {
    mockQuestions.push(makeQuestion({ type: 'behavioral' }));

    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('should open QuestionForm when Add Question is clicked', async () => {
    render(<BehavioralQuestionsPage />);

    await userEvent.click(screen.getByText('Add Question'));
    expect(screen.getByText('Add New Question')).toBeInTheDocument();
  });

  it('should open TemplatesPicker when Templates is clicked', async () => {
    render(<BehavioralQuestionsPage />);

    await userEvent.click(screen.getByText('Templates'));
    // TemplatesPicker should show template categories
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Conflict')).toBeInTheDocument();
  });

  it('should filter to only show behavioral questions', () => {
    mockQuestions.push(
      makeQuestion({ type: 'behavioral', question: 'Behavioral Q' }),
      makeQuestion({ type: 'technical', question: 'Technical Q' }),
    );

    render(<BehavioralQuestionsPage />);
    expect(screen.getByText('Behavioral Q')).toBeInTheDocument();
    expect(screen.queryByText('Technical Q')).not.toBeInTheDocument();
  });
});
