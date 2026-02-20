import { useState } from 'react';
import { X, Plus, Code } from 'lucide-react';
import { Modal } from './Modal';
import type { Question, AnswerVariation, TechnicalSubtype, Difficulty } from '../db/indexeddb';

interface QuestionFormProps {
  question?: Question;
  companies: string[];
  defaultType?: 'behavioral' | 'technical';
  onSubmit: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
}

function emptyAnswer(useStar: boolean): AnswerVariation {
  return {
    id: crypto.randomUUID(),
    content: '',
    keyPoints: [],
    isPrimary: false,
    ...(useStar ? { star: { situation: '', task: '', action: '', result: '' } } : {}),
  };
}

export function QuestionForm({
  question,
  companies,
  defaultType,
  onSubmit,
  onCancel,
}: QuestionFormProps) {
  const [type, setType] = useState<'behavioral' | 'technical'>(
    question?.type || defaultType || 'behavioral'
  );
  const [company, setCompany] = useState(question?.company || '');
  const [newCompany, setNewCompany] = useState('');
  const [questionText, setQuestionText] = useState(question?.question || '');
  const [answers, setAnswers] = useState<AnswerVariation[]>(
    question?.answerVariations?.length
      ? question.answerVariations
      : [{ id: crypto.randomUUID(), content: '', keyPoints: [], isPrimary: true }]
  );
  const [useStarMode, setUseStarMode] = useState(() => {
    return question?.answerVariations?.some((a) => a.star) || false;
  });

  // Technical-specific fields
  const [subtype, setSubtype] = useState<TechnicalSubtype | ''>(question?.subtype || '');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(question?.difficulty || '');
  const [tags, setTags] = useState<string>(question?.tags?.join(', ') || '');
  const [codeLanguage, setCodeLanguage] = useState(question?.codeSnippet?.language || '');
  const [codeContent, setCodeContent] = useState(question?.codeSnippet?.code || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCompany = (newCompany || company).trim();

    // Filter answers: for STAR mode, check if any STAR field is filled; for free-form check content
    const filteredAnswers = answers.filter((a) => {
      if (a.star) {
        return a.star.situation.trim() || a.star.task.trim() || a.star.action.trim() || a.star.result.trim();
      }
      return a.content.trim();
    });

    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const codeSnippet = codeContent.trim()
      ? { language: codeLanguage || 'text', code: codeContent }
      : undefined;

    onSubmit({
      type,
      company: selectedCompany || undefined,
      question: questionText,
      answerVariations: filteredAnswers,
      isFavorite: question?.isFavorite || false,
      practiceCount: question?.practiceCount || 0,
      lastPracticed: question?.lastPracticed || null,
      createdAt: question?.createdAt || Date.now(),
      ...(type === 'technical' ? {
        subtype: subtype || undefined,
        difficulty: difficulty || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        codeSnippet,
      } : {}),
    });
  };

  const updateAnswer = (id: string, field: string, value: string) => {
    setAnswers(answers.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const updateStarField = (id: string, field: string, value: string) => {
    setAnswers(answers.map((a) => {
      if (a.id !== id) return a;
      return { ...a, star: { ...a.star!, [field]: value } };
    }));
  };

  const updateKeyPoints = (id: string, keyPoints: string[]) => {
    setAnswers(answers.map((a) => (a.id === id ? { ...a, keyPoints } : a)));
  };

  // Store raw key-points text per answer so commas aren't stripped while typing
  const [keyPointsText, setKeyPointsText] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const a of question?.answerVariations || answers) {
      map[a.id] = a.keyPoints.join(', ');
    }
    return map;
  });

  const handleKeyPointsChange = (id: string, raw: string) => {
    setKeyPointsText((prev) => ({ ...prev, [id]: raw }));
  };

  const handleKeyPointsBlur = (id: string) => {
    const raw = keyPointsText[id] || '';
    const parsed = raw.split(',').map((k) => k.trim()).filter(Boolean);
    updateKeyPoints(id, parsed);
  };

  const addAnswer = () => {
    const newAns = emptyAnswer(useStarMode);
    setAnswers([...answers, newAns]);
    setKeyPointsText((prev) => ({ ...prev, [newAns.id]: '' }));
  };

  const removeAnswer = (id: string) => {
    setAnswers(answers.filter((a) => a.id !== id));
  };

  const toggleStarMode = () => {
    const next = !useStarMode;
    setUseStarMode(next);
    // Migrate existing answers
    setAnswers(answers.map((a) => {
      if (next && !a.star) {
        return { ...a, star: { situation: '', task: '', action: '', result: '' } };
      }
      if (!next && a.star) {
        // Combine STAR into content if content is empty
        const combined = a.content || [a.star.situation, a.star.task, a.star.action, a.star.result].filter(Boolean).join('\n\n');
        return { ...a, content: combined, star: undefined };
      }
      return a;
    }));
  };

  return (
    <Modal onClose={onCancel} label={question ? 'Edit Question' : 'Add New Question'}>
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
              <label className="block text-sm font-medium mb-2">Company <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setNewCompany('');
                }}
                className="input-field"
              >
                <option value="">None (general question)</option>
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

          {/* STAR toggle for behavioral */}
          {type === 'behavioral' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleStarMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useStarMode ? 'bg-behavioral-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useStarMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                STAR Framework
              </span>
              <span className="text-xs text-gray-500">
                (Situation, Task, Action, Result)
              </span>
            </div>
          )}

          {/* Technical-specific fields */}
          {type === 'technical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subtype</label>
                  <select
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value as TechnicalSubtype | '')}
                    className="input-field"
                  >
                    <option value="">Select subtype...</option>
                    <option value="coding">Coding</option>
                    <option value="system-design">System Design</option>
                    <option value="knowledge">Knowledge</option>
                    <option value="take-home">Take-Home</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
                    className="input-field"
                  >
                    <option value="">Select difficulty...</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Arrays, Dynamic Programming, Trees"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-technical-600" />
                  <label className="text-sm font-medium">Code Snippet (optional)</label>
                </div>
                <div className="space-y-2">
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Language...</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="sql">SQL</option>
                    <option value="text">Plain Text</option>
                  </select>
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="input-field font-mono text-sm"
                    rows={6}
                    placeholder="Paste your code snippet here..."
                  />
                </div>
              </div>
            </div>
          )}

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

                  {useStarMode && answer.star ? (
                    <div className="space-y-3">
                      {(['situation', 'task', 'action', 'result'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-behavioral-600">
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                          </label>
                          <textarea
                            value={answer.star![field]}
                            onChange={(e) => updateStarField(answer.id, field, e.target.value)}
                            className="input-field"
                            rows={2}
                            placeholder={`Describe the ${field}...`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answer.content}
                      onChange={(e) => updateAnswer(answer.id, 'content', e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Enter answer content..."
                    />
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-2">
                      Key Points (comma separated)
                    </label>
                    <input
                      type="text"
                      value={keyPointsText[answer.id] ?? answer.keyPoints.join(', ')}
                      onChange={(e) => handleKeyPointsChange(answer.id, e.target.value)}
                      onBlur={() => handleKeyPointsBlur(answer.id)}
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
    </Modal>
  );
}
