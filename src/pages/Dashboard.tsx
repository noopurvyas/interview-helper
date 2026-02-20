import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuestions } from '../hooks/useQuestions';
import { useBookmarks } from '../hooks/useBookmarks';
import { PracticeMode } from '../components/PracticeMode';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  TrendingUp,
  Flame,
  Shuffle,
  AlertTriangle,
  Star,
  BookMarked,
} from 'lucide-react';
import type { Question } from '../db/indexeddb';

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function calcStreak(questions: Question[]): number {
  const activeDays = new Set<string>();
  for (const q of questions) {
    if (q.lastPracticed) activeDays.add(dayKey(q.lastPracticed));
  }
  if (activeDays.size === 0) return 0;

  let streak = 0;
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if today is active; if not, start from yesterday
  if (!activeDays.has(dayKey(day.getTime()))) {
    day.setDate(day.getDate() - 1);
    if (!activeDays.has(dayKey(day.getTime()))) return 0;
  }

  while (activeDays.has(dayKey(day.getTime()))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

export function getWeeklyActivity(questions: Question[]): { label: string; count: number }[] {
  const days: { label: string; count: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(d.getTime());
    let count = 0;
    for (const q of questions) {
      if (q.lastPracticed && dayKey(q.lastPracticed) === key) count++;
    }
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    });
  }
  return days;
}

export interface CompanyReadiness {
  name: string;
  answered: number;
  total: number;
  score: number; // 0-100
  stale: boolean;
}

export function getCompanyReadiness(questions: Question[]): CompanyReadiness[] {
  const map = new Map<string, { total: number; answered: number; lastPracticed: number | null }>();
  for (const q of questions) {
    if (!q.company) continue;
    let entry = map.get(q.company);
    if (!entry) {
      entry = { total: 0, answered: 0, lastPracticed: null };
      map.set(q.company, entry);
    }
    entry.total++;
    if (q.answerVariations.length > 0) entry.answered++;
    if (q.lastPracticed && (!entry.lastPracticed || q.lastPracticed > entry.lastPracticed)) {
      entry.lastPracticed = q.lastPracticed;
    }
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return Array.from(map.entries())
    .map(([name, data]) => {
      const answerRatio = data.total > 0 ? data.answered / data.total : 0;
      const recency = data.lastPracticed && data.lastPracticed > sevenDaysAgo ? 1 : 0.5;
      const score = Math.round(answerRatio * recency * 100);
      return {
        name,
        answered: data.answered,
        total: data.total,
        score,
        stale: !data.lastPracticed || data.lastPracticed < sevenDaysAgo,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function WeeklyChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 32;
  const gap = 12;
  const chartHeight = 120;
  const width = data.length * (barWidth + gap) - gap;

  return (
    <svg width="100%" viewBox={`0 0 ${width + 20} ${chartHeight + 30}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * (barWidth + gap) + 10;
        const barH = max > 0 ? (d.count / max) * (chartHeight - 20) : 0;
        const y = chartHeight - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH || 2}
              rx={4}
              className={d.count > 0 ? 'fill-behavioral-500' : 'fill-gray-300 dark:fill-gray-600'}
            />
            {d.count > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-gray-600 dark:fill-gray-400 text-xs"
                fontSize="11"
              >
                {d.count}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 16}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize="11"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DashboardPage() {
  const { questions, companies, incrementPracticeCount } = useQuestions();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null);

  const totalQuestions = questions.length;
  const behavioralQuestions = questions.filter((q) => q.type === 'behavioral').length;
  const technicalQuestions = questions.filter((q) => q.type === 'technical').length;
  const totalPracticeCount = questions.reduce((sum, q) => sum + q.practiceCount, 0);
  const totalBookmarks = bookmarks.length;

  const streak = useMemo(() => calcStreak(questions), [questions]);
  const weeklyActivity = useMemo(() => getWeeklyActivity(questions), [questions]);
  const companyReadiness = useMemo(() => getCompanyReadiness(questions), [questions]);

  // Needs attention
  const staleQuestions = questions
    .filter((q) => {
      if (!q.lastPracticed) return q.practiceCount === 0;
      return Date.now() - q.lastPracticed > 14 * 24 * 60 * 60 * 1000; // 14 days
    })
    .slice(0, 5);

  const unreadBookmarks = bookmarks.filter((b) => b.status === 'unread').slice(0, 5);
  const unansweredQuestions = questions.filter((q) => q.answerVariations.length === 0).slice(0, 5);

  const pickRandomQuestion = () => {
    if (questions.length === 0) return;
    const idx = Math.floor(Math.random() * questions.length);
    setPracticeQuestion(questions[idx]);
  };

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
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button
          onClick={pickRandomQuestion}
          disabled={questions.length === 0}
          className="btn-behavioral flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Shuffle className="w-4 h-4" />
          Random Question
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Flame} label="Day Streak" value={streak} color="bg-amber-500" />
        <StatCard icon={BookOpen} label="Questions" value={totalQuestions} color="bg-behavioral-600" />
        <StatCard icon={TrendingUp} label="Practiced" value={totalPracticeCount} color="bg-technical-600" />
        <StatCard icon={Bookmark} label="Bookmarks" value={totalBookmarks} color="bg-bookmarks-600" />
        <StatCard icon={BarChart3} label="Companies" value={companies.length} color="bg-behavioral-600" />
      </div>

      {/* Question Breakdown + Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card-behavioral">
            <h3 className="font-semibold text-sm mb-1">Behavioral</h3>
            <p className="text-2xl font-bold text-behavioral-600">{behavioralQuestions}</p>
          </div>
          <div className="card-technical">
            <h3 className="font-semibold text-sm mb-1">Technical</h3>
            <p className="text-2xl font-bold text-technical-600">{technicalQuestions}</p>
          </div>
          <div className="card-bookmarks">
            <h3 className="font-semibold text-sm mb-1">Favorites</h3>
            <p className="text-2xl font-bold text-bookmarks-600">
              {questions.filter((q) => q.isFavorite).length}
            </p>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Weekly Activity</h3>
          <WeeklyChart data={weeklyActivity} />
        </div>
      </div>

      {/* Company Readiness */}
      {companyReadiness.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Company Readiness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyReadiness.map((c) => (
              <button
                key={c.name}
                onClick={() => navigate(`/companies/${encodeURIComponent(c.name)}`)}
                className="card text-left hover:ring-2 hover:ring-behavioral-400 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                  <span className={`text-sm font-bold ${
                    c.score >= 70 ? 'text-green-600' :
                    c.score >= 40 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {c.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      c.score >= 70 ? 'bg-green-500' :
                      c.score >= 40 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{c.answered}/{c.total} answered</span>
                  {c.stale && (
                    <span className="text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Stale
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stale / Unpracticed */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Needs Practice
          </h3>
          {staleQuestions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              All caught up!
            </div>
          ) : (
            <div className="space-y-2">
              {staleQuestions.map((q) => (
                <div key={q.id} className="card text-sm">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {q.company && <span className="text-xs text-gray-500">{q.company}</span>}
                    <span className={`text-xs ${q.type === 'behavioral' ? 'text-behavioral-500' : 'text-technical-500'}`}>
                      {q.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unanswered */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Unanswered
          </h3>
          {unansweredQuestions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              All questions have answers!
            </div>
          ) : (
            <div className="space-y-2">
              {unansweredQuestions.map((q) => (
                <div key={q.id} className="card text-sm">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {q.question}
                  </p>
                  {q.company && <p className="text-xs text-gray-500 mt-1">{q.company}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unread Bookmarks */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-bookmarks-500" />
            Unread Bookmarks
          </h3>
          {unreadBookmarks.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              No unread bookmarks!
            </div>
          ) : (
            <div className="space-y-2">
              {unreadBookmarks.map((b) => (
                <a
                  key={b.id}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card text-sm block hover:ring-2 hover:ring-bookmarks-400 transition-all"
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {b.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{b.resourceType}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Random question practice modal */}
      {practiceQuestion && (
        <PracticeMode
          questions={[practiceQuestion]}
          onPractice={incrementPracticeCount}
          onClose={() => setPracticeQuestion(null)}
        />
      )}
    </div>
  );
}
