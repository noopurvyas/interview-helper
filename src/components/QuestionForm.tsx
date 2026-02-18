import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Question, AnswerVariation } from '../db/indexeddb';

interface QuestionFormProps {
  question?: Question;
  companies: string[];
  onSubmit: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
}

export function QuestionForm({
  question,
  companies,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const [type, setType] = useState<'behavioral' | 'technical'>(
    question?.type || 'behavioral'
  );
  const [company, setCompany] = useState(question?.company || '');
  const [newCompany, setNewCompany] = useState('');
  const [questionText, setQuestionText] = useState(question?.question || '');
  const [answers, setAnswers] = useState<AnswerVariation[]>(
    question?.answerVariations || [{ id: crypto.randomUUID(), content: '', keyPoints: [], isPrimary: true }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCompany = newCompany || company;

    if (!questionText.trim() || !selectedCompany.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit({
      type,
      company: selectedCompany,
      question: questionText,
      answerVariations: answers.filter((a) => a.content.trim()),
      isFavorite: question?.isFavorite || false,
      practiceCount: question?.practiceCount || 0,
      lastPracticed: question?.lastPracticed || null,
      createdAt: question?.createdAt || Date.now(),
    });
  };

  const updateAnswer = (id: string, content: string) => {
    setAnswers(answers.map((a) => (a.id === id ? { ...a, content } : a)));
  };

  const updateKeyPoints = (id: string, keyPoints: string[]) => {
    setAnswers(answers.map((a) => (a.id === id ? { ...a, keyPoints } : a)));
  };

  const addAnswer = () => {
    setAnswers([
      ...answers,
      { id: crypto.randomUUID(), content: '', keyPoints: [], isPrimary: false },
    ]);
  };

  const removeAnswer = (id: string) => {
    setAnswers(answers.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type and Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'behavioral' | 'technical')}
                className="input-field"
              >
                <option value="behavioral">Behavioral</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setNewCompany('');
                }}
                className="input-field"
              >
                <option value="">Select or create...</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {company === '' && (
                <input
                  type="text"
                  placeholder="Or type new company name"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="input-field mt-2"
                />
              )}
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Enter the interview question..."
            />
          </div>

          {/* Answers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">Answer Variations</label>
              <button
                type="button"
                onClick={addAnswer}
                className="flex items-center space-x-1 text-sm text-behavioral-600 hover:text-behavioral-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Variation</span>
              </button>
            </div>

            <div className="space-y-4">
              {answers.map((answer, idx) => (
                <div
                  key={answer.id}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variation {idx + 1}</h4>
                    {answers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(answer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <textarea
                    value={answer.content}
                    onChange={(e) => updateAnswer(answer.id, e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="Enter answer content..."
                  />

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Key Points (comma separated)
                    </label>
                    <input
                      type="text"
                      value={answer.keyPoints.join(', ')}
                      onChange={(e) =>
                        updateKeyPoints(
                          answer.id,
                          e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                        )
                      }
                      className="input-field"
                      placeholder="e.g., Point 1, Point 2, Point 3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${
                type === 'behavioral' ? 'btn-behavioral' : 'btn-technical'
              }`}
            >
              {question ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
