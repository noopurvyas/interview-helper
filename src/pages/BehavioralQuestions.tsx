import { useState, useRef, useMemo } from 'react';
import { Plus, Dumbbell, BookTemplate } from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionForm } from '../components/QuestionForm';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { PracticeMode } from '../components/PracticeMode';
import { TemplatesPicker } from '../components/TemplatesPicker';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonCard';
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
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts(useMemo(() => ({
    '/': () => searchRef.current?.focus(),
    'n': () => { setEditingQuestion(null); setPrefillQuestion(''); setShowForm(true); },
  }), []));

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    return questions.filter(
      (q_item) =>
        q_item.type === 'behavioral' &&
        (q_item.question.toLowerCase().includes(q.toLowerCase()) ||
          (q_item.company?.toLowerCase().includes(q.toLowerCase()) ?? false)) &&
        (selectedCompanies.length === 0 || selectedCompanies.includes(q_item.company || '')) &&
        (!showFavorites || q_item.isFavorite)
    );
  });

  const displayQuestions = query ? results : questions.filter(
    (q) =>
      q.type === 'behavioral' &&
      (selectedCompanies.length === 0 || selectedCompanies.includes(q.company || '')) &&
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
                ref={searchRef}
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

          {loading && <SkeletonList count={3} />}

          {!loading && displayQuestions.length === 0 && (
            query ? (
              <EmptyState icon="search" title="No results found" description={`No questions match "${query}". Try a different search term.`} />
            ) : (
              <EmptyState icon="questions" title="No questions yet" description="Get started by adding your first behavioral question or pick from templates! Press N to add." />
            )
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
