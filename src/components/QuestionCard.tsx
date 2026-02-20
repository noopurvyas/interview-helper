import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Edit2, Trash2, Zap, Code } from 'lucide-react';
import type { Question } from '../db/indexeddb';

interface QuestionCardProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onPractice: (id: string) => void;
}

const starLabels = [
  { key: 'situation', label: 'S', full: 'Situation', color: 'bg-blue-500' },
  { key: 'task', label: 'T', full: 'Task', color: 'bg-amber-500' },
  { key: 'action', label: 'A', full: 'Action', color: 'bg-green-500' },
  { key: 'result', label: 'R', full: 'Result', color: 'bg-purple-500' },
] as const;

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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`badge ${
              question.type === 'behavioral'
                ? 'badge-behavioral'
                : 'badge-technical'
            }`}>
              {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
            </span>
            {question.company && <span className="badge badge-bookmarks">{question.company}</span>}
            {question.subtype && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium">
                {question.subtype === 'system-design' ? 'System Design' : question.subtype === 'take-home' ? 'Take-Home' : question.subtype.charAt(0).toUpperCase() + question.subtype.slice(1)}
              </span>
            )}
            {question.difficulty && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                question.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                question.difficulty === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {question.question}
          </p>
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {question.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 bg-technical-100 dark:bg-technical-900/20 text-technical-700 dark:text-technical-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
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

      {/* Code snippet */}
      {question.codeSnippet && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-technical-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {question.codeSnippet.language}
            </span>
          </div>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
            <code>{question.codeSnippet.code}</code>
          </pre>
        </div>
      )}

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
                  {answer.star && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-behavioral-100 dark:bg-behavioral-900/30 text-behavioral-600 dark:text-behavioral-300 font-medium">
                      STAR
                    </span>
                  )}
                </div>

                {answer.star ? (
                  <div className="space-y-2">
                    {starLabels.map(({ key, label, full, color }) => {
                      const value = answer.star![key];
                      if (!value) return null;
                      return (
                        <div key={key} className="flex gap-2">
                          <span className={`${color} text-white text-xs font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5`}>
                            {label}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {full}
                            </span>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {answer.content}
                  </p>
                )}

                {answer.keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {answer.keyPoints.map((point, i) => (
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
