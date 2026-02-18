import { useState } from 'react';
import { Plus, Loader, Dumbbell, BookTemplate } from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import { useSearch } from '../hooks/useSearch';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionForm } from '../components/QuestionForm';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { PracticeMode } from '../components/PracticeMode';
import { TemplatesPicker } from '../components/TemplatesPicker';
import type { Question } from '../db/indexeddb';

export function BehavioralQuestionsPage() {
  const { questions, companies, loading, loadByType, addQuestion, updateQuestion, deleteQuestion, toggleFavorite, incrementPracticeCount } = useQuestions();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [prefillQuestion, setPrefillQuestion] = useState('');

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    return questions.filter(
      (q_item) =>
        q_item.type === 'behavioral' &&
        (q_item.question.toLowerCase().includes(q.toLowerCase()) ||
          q_item.company.toLowerCase().includes(q.toLowerCase())) &&
        (selectedCompanies.length === 0 || selectedCompanies.includes(q_item.company)) &&
        (!showFavorites || q_item.isFavorite)
    );
  });

  const displayQuestions = query ? results : questions.filter(
    (q) =>
      q.type === 'behavioral' &&
      (selectedCompanies.length === 0 || selectedCompanies.includes(q.company)) &&
      (!showFavorites || q.isFavorite)
  );

  const handleSubmit = async (data: Omit<Question, 'id'>) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ ...editingQuestion, ...data });
      } else {
        await addQuestion(data);
      }
      setShowForm(false);
      setEditingQuestion(null);
      setPrefillQuestion('');
      await loadByType('behavioral');
    } catch {
      alert('Error saving question');
    }
  };

  const handleTemplateSelect = (questionText: string) => {
    setShowTemplates(false);
    setPrefillQuestion(questionText);
    setEditingQuestion(null);
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <FilterSidebar
          companies={companies}
          selectedCompanies={selectedCompanies}
          onCompanyChange={setSelectedCompanies}
          showFavoritesOnly={showFavorites}
          onFavoritesChange={setShowFavorites}
        />

        {/* Main content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                query={query}
                onSearch={handleSearch}
                onClear={clearSearch}
                placeholder="Search behavioral questions..."
              />
            </div>
            <div className="flex gap-2">
              {displayQuestions.length > 0 && (
                <button
                  onClick={() => setShowPractice(true)}
                  className="btn-secondary flex items-center justify-center gap-2"
                  title="Practice mode"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span className="hidden sm:inline">Practice</span>
                </button>
              )}
              <button
                onClick={() => setShowTemplates(true)}
                className="btn-secondary flex items-center justify-center gap-2"
                title="Common questions"
              >
                <BookTemplate className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setPrefillQuestion('');
                  setShowForm(true);
                }}
                className="btn-behavioral flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-behavioral-600" />
            </div>
          )}

          {!loading && displayQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No questions found</p>
              <p className="text-sm mt-2">Get started by adding your first question or pick from templates!</p>
            </div>
          )}

          <div className="grid gap-4">
            {displayQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={(q) => {
                  setEditingQuestion(q);
                  setPrefillQuestion('');
                  setShowForm(true);
                }}
                onDelete={deleteQuestion}
                onToggleFavorite={toggleFavorite}
                onPractice={incrementPracticeCount}
              />
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <QuestionForm
          question={editingQuestion ? { ...editingQuestion, ...(prefillQuestion ? { question: prefillQuestion } : {}) } : prefillQuestion ? { question: prefillQuestion } as any : undefined}
          companies={companies}
          defaultType="behavioral"
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
            setPrefillQuestion('');
          }}
        />
      )}

      {showPractice && (
        <PracticeMode
          questions={displayQuestions}
          onPractice={incrementPracticeCount}
          onClose={() => setShowPractice(false)}
        />
      )}

      {showTemplates && (
        <TemplatesPicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
