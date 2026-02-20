import { describe, it, expect } from 'vitest';
import { calcStreak, dayKey, getWeeklyActivity, getCompanyReadiness } from './Dashboard';
import { makeQuestion } from '../test/factories';

// Helper: get timestamp for N days ago at noon
function daysAgo(n: number): number {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

describe('dayKey', () => {
  it('should produce consistent key for same day', () => {
    const morning = new Date(2025, 5, 15, 8, 0).getTime();
    const evening = new Date(2025, 5, 15, 22, 30).getTime();
    expect(dayKey(morning)).toBe(dayKey(evening));
  });

  it('should produce different keys for different days', () => {
    const day1 = new Date(2025, 5, 15).getTime();
    const day2 = new Date(2025, 5, 16).getTime();
    expect(dayKey(day1)).not.toBe(dayKey(day2));
  });
});

describe('calcStreak', () => {
  it('should return 0 for no questions', () => {
    expect(calcStreak([])).toBe(0);
  });

  it('should return 0 when no questions have been practiced', () => {
    const questions = [makeQuestion({ lastPracticed: null })];
    expect(calcStreak(questions)).toBe(0);
  });

  it('should return 1 for practice only today', () => {
    const questions = [makeQuestion({ lastPracticed: daysAgo(0) })];
    expect(calcStreak(questions)).toBe(1);
  });

  it('should return 1 for practice only yesterday', () => {
    const questions = [makeQuestion({ lastPracticed: daysAgo(1) })];
    expect(calcStreak(questions)).toBe(1);
  });

  it('should count consecutive days', () => {
    const questions = [
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(1) }),
      makeQuestion({ lastPracticed: daysAgo(2) }),
    ];
    expect(calcStreak(questions)).toBe(3);
  });

  it('should break streak on gaps', () => {
    const questions = [
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(1) }),
      // gap at day 2
      makeQuestion({ lastPracticed: daysAgo(3) }),
    ];
    expect(calcStreak(questions)).toBe(2);
  });

  it('should return 0 if last practice was 2+ days ago', () => {
    const questions = [makeQuestion({ lastPracticed: daysAgo(3) })];
    expect(calcStreak(questions)).toBe(0);
  });

  it('should handle multiple questions on same day', () => {
    const questions = [
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(1) }),
    ];
    expect(calcStreak(questions)).toBe(2);
  });
});

describe('getWeeklyActivity', () => {
  it('should return 7 days of data', () => {
    const result = getWeeklyActivity([]);
    expect(result).toHaveLength(7);
  });

  it('should count questions practiced on each day', () => {
    const questions = [
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(0) }),
      makeQuestion({ lastPracticed: daysAgo(3) }),
    ];
    const result = getWeeklyActivity(questions);

    // Last item is today (index 6)
    expect(result[6].count).toBe(2);
    // 3 days ago is index 3
    expect(result[3].count).toBe(1);
  });

  it('should return 0 count for days without practice', () => {
    const result = getWeeklyActivity([]);
    result.forEach((d) => expect(d.count).toBe(0));
  });

  it('should have weekday labels', () => {
    const result = getWeeklyActivity([]);
    result.forEach((d) => {
      expect(d.label).toBeTruthy();
      expect(d.label.length).toBeLessThanOrEqual(3); // "Mon", "Tue", etc
    });
  });
});

describe('getCompanyReadiness', () => {
  it('should return empty for no questions', () => {
    expect(getCompanyReadiness([])).toEqual([]);
  });

  it('should skip questions without company', () => {
    const questions = [makeQuestion({ company: undefined })];
    expect(getCompanyReadiness(questions)).toEqual([]);
  });

  it('should calculate readiness correctly for fully answered, recently practiced', () => {
    const questions = [
      makeQuestion({
        company: 'Google',
        answerVariations: [{ id: 'a1', content: 'answer', keyPoints: [], isPrimary: true }],
        lastPracticed: Date.now(), // today = recent
      }),
    ];
    const result = getCompanyReadiness(questions);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Google');
    expect(result[0].score).toBe(100); // 1/1 answered × 1.0 recency × 100
    expect(result[0].stale).toBe(false);
  });

  it('should halve score when stale (not practiced in 7 days)', () => {
    const questions = [
      makeQuestion({
        company: 'Google',
        answerVariations: [{ id: 'a1', content: 'answer', keyPoints: [], isPrimary: true }],
        lastPracticed: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      }),
    ];
    const result = getCompanyReadiness(questions);
    expect(result[0].score).toBe(50); // 1/1 × 0.5 × 100
    expect(result[0].stale).toBe(true);
  });

  it('should score 0 for unanswered questions', () => {
    const questions = [
      makeQuestion({
        company: 'Google',
        answerVariations: [],
        lastPracticed: Date.now(),
      }),
    ];
    const result = getCompanyReadiness(questions);
    expect(result[0].score).toBe(0);
    expect(result[0].answered).toBe(0);
    expect(result[0].total).toBe(1);
  });

  it('should sort by score descending', () => {
    const questions = [
      makeQuestion({ company: 'LowScore', answerVariations: [], lastPracticed: null }),
      makeQuestion({
        company: 'HighScore',
        answerVariations: [{ id: 'a1', content: 'x', keyPoints: [], isPrimary: true }],
        lastPracticed: Date.now(),
      }),
    ];
    const result = getCompanyReadiness(questions);
    expect(result[0].name).toBe('HighScore');
    expect(result[1].name).toBe('LowScore');
  });
});
