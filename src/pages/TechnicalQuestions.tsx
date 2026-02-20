import { useState, useRef, useMemo } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionForm } from '../components/QuestionForm';
import { PracticeMode } from '../components/PracticeMode';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonCard';
import type { TechnicalSubtype, Difficulty } from '../db/indexeddb';

export function TechnicalQuestionsPage() {
  const { questions, companies, loading, loadByType, addQuestion, updateQuestion, deleteQuestion, toggleFavorite, incrementPracticeCount } = useQuestions();
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState<TechnicalSubtype | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');
  const [showPractice, setShowPractice] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts(useMemo(() => ({
    '/': () => searchRef.current?.focus(),
    'n': () => { setEditingQuestion(null); setShowForm(true); },
  }), []));

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    const allQuestions = await Promise.resolve(questions);
    return allQuestions.filter(
      (q_item) =>
        (q_item.question.toLowerCase().includes(q.toLowerCase()) ||
          (q_item.company?.toLowerCase().includes(q.toLowerCase()) ?? false)) &&
        (selectedCompanies.length === 0 || selectedCompanies.includes(q_item.company || '')) &&
        (!showFavorites || q_item.isFavorite)
    );
  });

  const displayQuestions = query ? results : questions.filter(
    (q) =>
      q.type === 'technical' &&
      (selectedCompanies.length === 0 || selectedCompanies.includes(q.company || '')) &&
      (!showFavorites || q.isFavorite) &&
      (!selectedSubtype || q.subtype === selectedSubtype) &&
      (!selectedDifficulty || q.difficulty === selectedDifficulty)
  );

  const handleSubmit = async (data: any) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ ...editingQuestion, ...data });
      } else {
        await addQuestion(data);
      }
      setShowForm(false);
      setEditingQuestion(null);
      await loadByType('technical');
    } catch (err) {
      alert('Error saving question');
    }
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
                placeholder="Search technical questions..."
              />
            </div>
            <div className="flex gap-2">
              {displayQuestions.length > 0 && (
                <button
                  onClick={() => setShowPractice(true)}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>Practice</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowForm(true);
                }}
                className="btn-technical flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Subtype & Difficulty filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSubtype}
              onChange={(e) => setSelectedSubtype(e.target.value as TechnicalSubtype | '')}
              className="input-field w-auto text-sm"
            >
              <option value="">All Subtypes</option>
              <option value="coding">Coding</option>
              <option value="system-design">System Design</option>
              <option value="knowledge">Knowledge</option>
              <option value="take-home">Take-Home</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | '')}
              className="input-field w-auto text-sm"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {(selectedSubtype || selectedDifficulty) && (
              <button
                onClick={() => { setSelectedSubtype(''); setSelectedDifficulty(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading && <SkeletonList count={3} />}

          {!loading && displayQuestions.length === 0 && (
            query ? (
              <EmptyState icon="search" title="No results found" description={`No questions match "${query}". Try a different search term.`} />
            ) : (
              <EmptyState icon="questions" title="No questions yet" description="Add your first technical question to start tracking. Press N to add." />
            )
          )}

          <div className="grid gap-4">
            {displayQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={(q) => {
                  setEditingQuestion(q);
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
          question={editingQuestion}
          companies={companies}
          defaultType="technical"
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
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
    </div>
  );
}
