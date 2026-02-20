import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from './QuestionCard';
import { makeQuestion, makeTechnicalQuestion } from '../test/factories';

const defaultProps = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleFavorite: vi.fn(),
  onPractice: vi.fn(),
};

describe('QuestionCard', () => {
  it('should render the question text', () => {
    const q = makeQuestion({ question: 'Tell me about teamwork.' });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Tell me about teamwork.')).toBeInTheDocument();
  });

  it('should display type badge', () => {
    const q = makeQuestion({ type: 'behavioral' });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Behavioral')).toBeInTheDocument();
  });

  it('should display company badge when company is set', () => {
    const q = makeQuestion({ company: 'Google' });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('should NOT display company badge when company is undefined', () => {
    const q = makeQuestion({ company: undefined });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.queryByText('Google')).not.toBeInTheDocument();
  });

  it('should show practice count and last practiced', () => {
    const q = makeQuestion({ practiceCount: 5, lastPracticed: null });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Practiced: 5 times')).toBeInTheDocument();
    expect(screen.getByText('Last: Never')).toBeInTheDocument();
  });

  it('should show formatted last practiced date', () => {
    const date = new Date(2025, 0, 15).getTime(); // Jan 15, 2025
    const q = makeQuestion({ practiceCount: 1, lastPracticed: date });
    render(<QuestionCard question={q} {...defaultProps} />);
    // The exact format depends on locale, but it should not say "Never"
    expect(screen.queryByText('Last: Never')).not.toBeInTheDocument();
  });

  it('should toggle answer variations on click', async () => {
    const q = makeQuestion({
      answerVariations: [
        { id: 'a1', content: 'My answer here', keyPoints: [], isPrimary: true },
      ],
    });
    render(<QuestionCard question={q} {...defaultProps} />);

    // Answers should be hidden initially
    expect(screen.queryByText('My answer here')).not.toBeInTheDocument();

    // Click to expand
    await userEvent.click(screen.getByText('Answer Variations (1)'));
    expect(screen.getByText('My answer here')).toBeInTheDocument();

    // Click to collapse
    await userEvent.click(screen.getByText('Answer Variations (1)'));
    expect(screen.queryByText('My answer here')).not.toBeInTheDocument();
  });

  it('should display key points as badges', async () => {
    const q = makeQuestion({
      answerVariations: [
        { id: 'a1', content: 'Answer', keyPoints: ['Leadership', 'Teamwork'], isPrimary: true },
      ],
    });
    render(<QuestionCard question={q} {...defaultProps} />);

    await userEvent.click(screen.getByText('Answer Variations (1)'));
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Teamwork')).toBeInTheDocument();
  });

  it('should display STAR format for STAR answers', async () => {
    const q = makeQuestion({
      answerVariations: [
        {
          id: 'a1',
          content: '',
          keyPoints: [],
          isPrimary: true,
          star: {
            situation: 'We had a deadline.',
            task: 'I needed to organize the team.',
            action: 'I created a plan.',
            result: 'We delivered on time.',
          },
        },
      ],
    });
    render(<QuestionCard question={q} {...defaultProps} />);

    await userEvent.click(screen.getByText('Answer Variations (1)'));
    expect(screen.getByText('STAR')).toBeInTheDocument();
    expect(screen.getByText('We had a deadline.')).toBeInTheDocument();
    expect(screen.getByText('We delivered on time.')).toBeInTheDocument();
  });

  it('should call onToggleFavorite when star button is clicked', async () => {
    const onToggleFavorite = vi.fn();
    const q = makeQuestion({ id: 'q-123' });
    render(<QuestionCard question={q} {...defaultProps} onToggleFavorite={onToggleFavorite} />);

    await userEvent.click(screen.getByLabelText('Toggle favorite'));
    expect(onToggleFavorite).toHaveBeenCalledWith('q-123');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const q = makeQuestion();
    render(<QuestionCard question={q} {...defaultProps} onEdit={onEdit} />);

    await userEvent.click(screen.getByLabelText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(q);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const q = makeQuestion({ id: 'q-del' });
    render(<QuestionCard question={q} {...defaultProps} onDelete={onDelete} />);

    await userEvent.click(screen.getByLabelText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('q-del');
  });

  it('should call onPractice when Mark Practiced is clicked', async () => {
    const onPractice = vi.fn();
    const q = makeQuestion({ id: 'q-prac' });
    render(<QuestionCard question={q} {...defaultProps} onPractice={onPractice} />);

    await userEvent.click(screen.getByText('Mark Practiced'));
    expect(onPractice).toHaveBeenCalledWith('q-prac');
  });

  // Technical question specific features
  it('should display subtype badge for technical questions', () => {
    const q = makeTechnicalQuestion({ subtype: 'system-design' });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('System Design')).toBeInTheDocument();
  });

  it('should display difficulty badge', () => {
    const q = makeTechnicalQuestion({ difficulty: 'hard' });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('should display tags', () => {
    const q = makeTechnicalQuestion({ tags: ['Arrays', 'HashMap'] });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('Arrays')).toBeInTheDocument();
    expect(screen.getByText('HashMap')).toBeInTheDocument();
  });

  it('should display code snippet', () => {
    const q = makeTechnicalQuestion({
      codeSnippet: { language: 'javascript', code: 'console.log("hello")' },
    });
    render(<QuestionCard question={q} {...defaultProps} />);
    expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });
});
