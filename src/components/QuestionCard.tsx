import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Edit2, Trash2, Zap } from 'lucide-react';
import type { Question } from '../db/indexeddb';

interface QuestionCardProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onPractice: (id: string) => void;
}

export function QuestionCard({
  question,
  onEdit,
  onDelete,
  onToggleFavorite,
  onPractice,
}: QuestionCardProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  const cardClass = question.type === 'behavioral'
    ? 'card-behavioral'
    : 'card-technical';

  const lastPracticed = question.lastPracticed
    ? new Date(question.lastPracticed).toLocaleDateString()
    : 'Never';

  return (
    <div className={`${cardClass} animate-fade-in`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`badge ${
              question.type === 'behavioral'
                ? 'badge-behavioral'
                : 'badge-technical'
            }`}>
              {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
            </span>
            <span className="badge badge-bookmarks">{question.company}</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {question.question}
          </p>
        </div>
        <button
          onClick={() => onToggleFavorite(question.id)}
          className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle favorite"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              question.isFavorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Practice stats */}
      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span>Practiced: {question.practiceCount} times</span>
        <span>Last: {lastPracticed}</span>
      </div>

      {/* Answers section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span>Answer Variations ({question.answerVariations.length})</span>
          {showAnswers ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showAnswers && (
          <div className="mt-4 space-y-4">
            {question.answerVariations.map((answer, idx) => (
              <div
                key={answer.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Variation {idx + 1}
                  </span>
                  {answer.isPrimary && (
                    <span className="badge badge-behavioral text-xs">Primary</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {answer.content}
                </p>
                {answer.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {answer.keyPoints.map((point, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onPractice(question.id)}
          className="flex items-center space-x-1 text-sm font-medium text-behavioral-600 dark:text-behavioral-400 hover:text-behavioral-700 dark:hover:text-behavioral-300 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>Mark Practiced</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(question)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
