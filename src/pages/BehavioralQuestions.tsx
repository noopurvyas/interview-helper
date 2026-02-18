import { useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import { useQuestions } from '../hooks/useQuestions';
import { useSearch } from '../hooks/useSearch';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionForm } from '../components/QuestionForm';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';

export function BehavioralQuestionsPage() {
  const { questions, companies, loading, loadByType, addQuestion, updateQuestion, deleteQuestion, toggleFavorite, incrementPracticeCount } = useQuestions();
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    const allQuestions = await Promise.resolve(questions);
    return allQuestions.filter(
      (q_item) =>
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

  const handleSubmit = async (data: any) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ ...editingQuestion, ...data });
      } else {
        await addQuestion(data);
      }
      setShowForm(false);
      setEditingQuestion(null);
      await loadByType('behavioral');
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
                query={query}
                onSearch={handleSearch}
                onClear={clearSearch}
                placeholder="Search behavioral questions..."
              />
            </div>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowForm(true);
              }}
              className="btn-behavioral flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Question</span>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-behavioral-600" />
            </div>
          )}

          {!loading && displayQuestions.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No questions found</p>
              <p className="text-sm mt-2">Get started by adding your first question!</p>
            </div>
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
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}
