import { useQuestions } from '../hooks/useQuestions';
import { useBookmarks } from '../hooks/useBookmarks';
import { BarChart3, BookOpen, Bookmark, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { questions, companies } = useQuestions();
  const { bookmarks } = useBookmarks();

  const totalQuestions = questions.length;
  const behavioralQuestions = questions.filter((q) => q.type === 'behavioral').length;
  const technicalQuestions = questions.filter((q) => q.type === 'technical').length;
  const totalPracticeCount = questions.reduce((sum, q) => sum + q.practiceCount, 0);
  const favoriteQuestions = questions.filter((q) => q.isFavorite).length;
  const totalBookmarks = bookmarks.length;

  const unansweredQuestions = questions.filter((q) => q.answerVariations.length === 0);
  const needsPractice = questions
    .filter((q) => q.practiceCount === 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Questions"
            value={totalQuestions}
            color="bg-behavioral-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Practice Count"
            value={totalPracticeCount}
            color="bg-technical-600"
          />
          <StatCard
            icon={Bookmark}
            label="Bookmarks"
            value={totalBookmarks}
            color="bg-bookmarks-600"
          />
          <StatCard
            icon={BarChart3}
            label="Companies"
            value={companies.length}
            color="bg-behavioral-600"
          />
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-behavioral">
          <h3 className="font-semibold text-lg mb-2">Behavioral</h3>
          <p className="text-3xl font-bold text-behavioral-600">{behavioralQuestions}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {behavioralQuestions === 0 ? 'No questions yet' : 'questions added'}
          </p>
        </div>
        <div className="card-technical">
          <h3 className="font-semibold text-lg mb-2">Technical</h3>
          <p className="text-3xl font-bold text-technical-600">{technicalQuestions}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {technicalQuestions === 0 ? 'No questions yet' : 'questions added'}
          </p>
        </div>
        <div className="card-bookmarks">
          <h3 className="font-semibold text-lg mb-2">Favorites</h3>
          <p className="text-3xl font-bold text-bookmarks-600">{favoriteQuestions}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {favoriteQuestions === 0 ? 'Mark some as favorites' : 'flagged for review'}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Needs Practice</h3>
          {needsPractice.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <p>All questions have been practiced!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {needsPractice.map((q) => (
                <div key={q.id} className="card">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {q.question.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {q.company}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Unanswered Questions</h3>
          {unansweredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <p>All questions have answers!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unansweredQuestions.slice(0, 5).map((q) => (
                <div key={q.id} className="card">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {q.question.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {q.company}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
