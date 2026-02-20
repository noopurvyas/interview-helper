import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionForm } from './QuestionForm';
import { makeQuestion } from '../test/factories';

const defaultProps = {
  companies: ['Google', 'Meta', 'Amazon'],
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('QuestionForm', () => {
  // ─── Rendering ──────────────────────────────────────────────

  it('should render the form with Add title when no question provided', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('Add New Question')).toBeInTheDocument();
  });

  it('should render with Edit title when question is provided', () => {
    const q = makeQuestion();
    render(<QuestionForm {...defaultProps} question={q} />);
    expect(screen.getByText('Edit Question')).toBeInTheDocument();
  });

  it('should show type selector with behavioral and technical options', () => {
    render(<QuestionForm {...defaultProps} />);
    const typeSelect = screen.getByDisplayValue('Behavioral');
    expect(typeSelect).toBeInTheDocument();
  });

  it('should show company dropdown with existing companies', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('should mark company as optional', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('should show "None (general question)" as default company option', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('None (general question)')).toBeInTheDocument();
  });

  it('should show new company input when no company selected', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Or type new company name')).toBeInTheDocument();
  });

  // ─── Default type ───────────────────────────────────────────

  it('should default to behavioral when defaultType is behavioral', () => {
    render(<QuestionForm {...defaultProps} defaultType="behavioral" />);
    expect(screen.getByDisplayValue('Behavioral')).toBeInTheDocument();
  });

  it('should default to technical when defaultType is technical', () => {
    render(<QuestionForm {...defaultProps} defaultType="technical" />);
    expect(screen.getByDisplayValue('Technical')).toBeInTheDocument();
  });

  // ─── Technical fields ───────────────────────────────────────

  it('should show technical fields when type is technical', async () => {
    render(<QuestionForm {...defaultProps} defaultType="technical" />);
    expect(screen.getByText('Subtype')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Tags (comma separated)')).toBeInTheDocument();
  });

  it('should NOT show technical fields when type is behavioral', () => {
    render(<QuestionForm {...defaultProps} defaultType="behavioral" />);
    expect(screen.queryByText('Subtype')).not.toBeInTheDocument();
    expect(screen.queryByText('Difficulty')).not.toBeInTheDocument();
  });

  // ─── STAR mode ──────────────────────────────────────────────

  it('should show STAR toggle for behavioral questions', () => {
    render(<QuestionForm {...defaultProps} defaultType="behavioral" />);
    expect(screen.getByText('STAR Framework')).toBeInTheDocument();
  });

  it('should NOT show STAR toggle for technical questions', () => {
    render(<QuestionForm {...defaultProps} defaultType="technical" />);
    expect(screen.queryByText('STAR Framework')).not.toBeInTheDocument();
  });

  it('should show STAR fields when toggled on', async () => {
    render(<QuestionForm {...defaultProps} defaultType="behavioral" />);

    // The toggle button is inside the "STAR Framework" section
    const toggle = screen.getByText('STAR Framework').closest('div')!.querySelector('button')!;
    await userEvent.click(toggle);

    expect(screen.getByPlaceholderText('Describe the situation...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the task...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the action...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the result...')).toBeInTheDocument();
  });

  // ─── Answer variations ──────────────────────────────────────

  it('should start with one answer variation', () => {
    render(<QuestionForm {...defaultProps} />);
    expect(screen.getByText('Variation 1')).toBeInTheDocument();
  });

  it('should add answer variation when clicking Add Variation', async () => {
    render(<QuestionForm {...defaultProps} />);

    await userEvent.click(screen.getByText('Add Variation'));
    expect(screen.getByText('Variation 2')).toBeInTheDocument();
  });

  // ─── Key Points (the bug fix) ──────────────────────────────

  it('should allow typing comma-separated key points', async () => {
    render(<QuestionForm {...defaultProps} />);

    const keyPointsInput = screen.getByPlaceholderText('e.g., Point 1, Point 2, Point 3');
    await userEvent.type(keyPointsInput, 'Leadership, Communication, Teamwork');

    // The raw text should be preserved while typing
    expect(keyPointsInput).toHaveValue('Leadership, Communication, Teamwork');
  });

  it('should preserve trailing comma while typing key points', async () => {
    render(<QuestionForm {...defaultProps} />);

    const keyPointsInput = screen.getByPlaceholderText('e.g., Point 1, Point 2, Point 3');
    await userEvent.type(keyPointsInput, 'Point 1,');

    // Should keep the trailing comma (this was the bug before)
    expect(keyPointsInput).toHaveValue('Point 1,');
  });

  // ─── Form submission ───────────────────────────────────────

  it('should call onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    render(<QuestionForm {...defaultProps} onSubmit={onSubmit} />);

    // Fill in the question
    const questionInput = screen.getByPlaceholderText('Enter the interview question...');
    await userEvent.type(questionInput, 'My test question');

    // Submit
    await userEvent.click(screen.getByText('Add Question'));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.question).toBe('My test question');
    expect(submitted.type).toBe('behavioral');
  });

  it('should pass company as undefined when none selected', async () => {
    const onSubmit = vi.fn();
    render(<QuestionForm {...defaultProps} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText('Enter the interview question...'), 'Q');
    await userEvent.click(screen.getByText('Add Question'));

    expect(onSubmit.mock.calls[0][0].company).toBeUndefined();
  });

  // ─── Cancel ─────────────────────────────────────────────────

  it('should call onCancel when Cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<QuestionForm {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when X button is clicked', async () => {
    const onCancel = vi.fn();
    render(<QuestionForm {...defaultProps} onCancel={onCancel} />);

    // The X button is the first button in the header
    const closeButtons = screen.getAllByRole('button');
    // First interactive button should be X in the header area
    const xButton = closeButtons.find((btn) => btn.querySelector('svg'));
    // Click the close X
    await userEvent.click(closeButtons[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  // ─── Editing existing question ──────────────────────────────

  it('should populate fields when editing an existing question', () => {
    const q = makeQuestion({
      question: 'Existing question text',
      company: 'Google',
      type: 'behavioral',
    });
    render(<QuestionForm {...defaultProps} question={q} />);

    expect(screen.getByDisplayValue('Existing question text')).toBeInTheDocument();
    // Company should be selected
    const companySelect = screen.getByDisplayValue('Google') as HTMLSelectElement;
    expect(companySelect.value).toBe('Google');
  });
});
