import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechnicalQuestionsPage } from './TechnicalQuestions';
import { makeQuestion, makeTechnicalQuestion } from '../test/factories';
import type { Question } from '../db/indexeddb';

const mockQuestions: Question[] = [];

vi.mock('../hooks/useQuestions', () => ({
  useQuestions: () => ({
    questions: mockQuestions,
    companies: [...new Set(mockQuestions.map((q) => q.company).filter(Boolean))],
    loading: false,
    loadByType: vi.fn(),
    addQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    toggleFavorite: vi.fn(),
    incrementPracticeCount: vi.fn(),
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

describe('TechnicalQuestionsPage', () => {
  beforeEach(() => {
    mockQuestions.length = 0;
    vi.clearAllMocks();
  });

  it('should render the search bar', () => {
    render(<TechnicalQuestionsPage />);
    expect(screen.getByPlaceholderText('Search technical questions...')).toBeInTheDocument();
  });

  it('should render Add Question button', () => {
    render(<TechnicalQuestionsPage />);
    expect(screen.getByText('Add Question')).toBeInTheDocument();
  });

  it('should show empty state when no questions exist', () => {
    render(<TechnicalQuestionsPage />);
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('should render question cards for technical questions', () => {
    mockQuestions.push(
      makeTechnicalQuestion({ question: 'Implement binary search' }),
      makeTechnicalQuestion({ question: 'Design a cache system' }),
    );

    render(<TechnicalQuestionsPage />);
    expect(screen.getByText('Implement binary search')).toBeInTheDocument();
    expect(screen.getByText('Design a cache system')).toBeInTheDocument();
  });

  it('should filter out behavioral questions', () => {
    mockQuestions.push(
      makeTechnicalQuestion({ question: 'Tech Q' }),
      makeQuestion({ type: 'behavioral', question: 'Behavioral Q' }),
    );

    render(<TechnicalQuestionsPage />);
    expect(screen.getByText('Tech Q')).toBeInTheDocument();
    expect(screen.queryByText('Behavioral Q')).not.toBeInTheDocument();
  });

  it('should show Practice button when questions exist', () => {
    mockQuestions.push(makeTechnicalQuestion());
    render(<TechnicalQuestionsPage />);
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('should have subtype filter dropdown', () => {
    render(<TechnicalQuestionsPage />);
    expect(screen.getByDisplayValue('All Subtypes')).toBeInTheDocument();
  });

  it('should have difficulty filter dropdown', () => {
    render(<TechnicalQuestionsPage />);
    expect(screen.getByDisplayValue('All Difficulties')).toBeInTheDocument();
  });

  it('should open QuestionForm when Add Question is clicked', async () => {
    render(<TechnicalQuestionsPage />);

    await userEvent.click(screen.getByText('Add Question'));
    expect(screen.getByText('Add New Question')).toBeInTheDocument();
  });
});
