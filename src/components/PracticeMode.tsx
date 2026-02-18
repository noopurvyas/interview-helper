import { useState, useCallback } from 'react';
import { X, Eye, EyeOff, ChevronLeft, ChevronRight, Shuffle, Zap } from 'lucide-react';
import type { Question } from '../db/indexeddb';

interface PracticeModeProps {
  questions: Question[];
  onPractice: (id: string) => void;
  onClose: () => void;
}

const starLabels = [
  { key: 'situation', label: 'S', full: 'Situation', color: 'bg-blue-500' },
  { key: 'task', label: 'T', full: 'Task', color: 'bg-amber-500' },
  { key: 'action', label: 'A', full: 'Action', color: 'bg-green-500' },
  { key: 'result', label: 'R', full: 'Result', color: 'bg-purple-500' },
] as const;

export function PracticeMode({ questions, onPractice, onClose }: PracticeModeProps) {
  const [order, setOrder] = useState(() => questions.map((_, i) => i));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = questions[order[currentIdx]];
  const total = order.length;

  const goNext = useCallback(() => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setShowAnswer(false);
    }
  }, [currentIdx, total]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setShowAnswer(false);
    }
  }, [currentIdx]);

  const shuffleCards = () => {
    const shuffled = [...order].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setCurrentIdx(0);
    setShowAnswer(false);
  };

  const markPracticed = () => {
    onPractice(current.id);
    goNext();
  };

  if (!current) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">No questions to practice.</p>
          <button onClick={onClose} className="btn-secondary mt-4">Close</button>
        </div>
      </div>
    );
  }

  const primaryAnswer = current.answerVariations.find((a) => a.isPrimary) || current.answerVariations[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Practice Mode</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentIdx + 1} / {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={shuffleCards}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-behavioral">
                {current.type.charAt(0).toUpperCase() + current.type.slice(1)}
              </span>
              <span className="badge badge-bookmarks">{current.company}</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {current.question}
            </p>
          </div>

          {/* Reveal button */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              showAnswer
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                : 'bg-behavioral-600 text-white hover:bg-behavioral-700'
            }`}
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Answer
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Reveal Answer
              </>
            )}
          </button>

          {/* Answer */}
          {showAnswer && primaryAnswer && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3 animate-fade-in">
              {primaryAnswer.star ? (
                <div className="space-y-3">
                  {starLabels.map(({ key, label, full, color }) => {
                    const value = primaryAnswer.star![key];
                    if (!value) return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <span className={`${color} text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5`}>
                          {label}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{full}</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {primaryAnswer.content}
                </p>
              )}

              {primaryAnswer.keyPoints.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 dark:border-gray-600">
                  {primaryAnswer.keyPoints.map((point, i) => (
                    <span
                      key={i}
                      className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAnswer && !primaryAnswer && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No answer recorded yet. Add one after practice!
            </p>
          )}
        </div>

        {/* Footer navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={markPracticed}
            className="btn-behavioral flex items-center gap-2 text-sm"
          >
            <Zap className="w-4 h-4" />
            Mark Practiced
          </button>

          <button
            onClick={goNext}
            disabled={currentIdx === total - 1}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-behavioral-500 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
