import { useState, useRef, useMemo } from 'react';
import { Plus, Calendar, CheckCircle2, XCircle, ListFilter } from 'lucide-react';
import { useInterviews } from '../hooks/useInterviews';
import { useQuestions } from '../hooks/useQuestions';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { InterviewCard } from '../components/InterviewCard';
import { InterviewForm } from '../components/InterviewForm';
import { ICalImportModal } from '../components/ICalImportModal';
import { MiniCalendar } from '../components/MiniCalendar';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { SkeletonList } from '../components/SkeletonCard';
import type { Interview, InterviewStatus } from '../db/indexeddb';

function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDateLabel(dateKey: string): string {
  const today = new Date();
  const todayKey = toDateKey(today.getTime());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow.getTime());

  if (dateKey === todayKey) return 'Today';
  if (dateKey === tomorrowKey) return 'Tomorrow';

  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InterviewsPage() {
  const { interviews, loading, loadInterviews, addInterview, updateInterview, deleteInterview } = useInterviews();
  const { questions, companies } = useQuestions();
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InterviewStatus | ''>('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all'>('upcoming');
  const [showICalModal, setShowICalModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts(
    useMemo(
      () => ({
        '/': () => searchRef.current?.focus(),
        n: () => {
          setEditingInterview(null);
          setShowForm(true);
        },
      }),
      []
    )
  );

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    return interviews.filter(
      (i) =>
        i.company.toLowerCase().includes(q.toLowerCase()) ||
        (i.role?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (i.notes?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (i.contactName?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (i.location?.toLowerCase().includes(q.toLowerCase()) ?? false)
    );
  });

  const [now] = useState(() => Date.now());
  const filteredInterviews = (query ? results : interviews).filter((i) => {
    if (viewMode === 'upcoming' && (i.dateTime <= now || i.status !== 'scheduled')) return false;
    if (selectedStatus && i.status !== selectedStatus) return false;
    if (selectedCompany && i.company !== selectedCompany) return false;
    if (selectedDate && toDateKey(i.dateTime) !== selectedDate) return false;
    return true;
  });

  // Group by date
  const grouped = useMemo(() => {
    const sorted = [...filteredInterviews].sort((a, b) => a.dateTime - b.dateTime);
    const groups: { dateKey: string; label: string; interviews: Interview[] }[] = [];
    for (const interview of sorted) {
      const dk = toDateKey(interview.dateTime);
      let group = groups.find((g) => g.dateKey === dk);
      if (!group) {
        group = { dateKey: dk, label: getDateLabel(dk), interviews: [] };
        groups.push(group);
      }
      group.interviews.push(interview);
    }
    return groups;
  }, [filteredInterviews]);

  // Interview dates for calendar dots
  const interviewDates = useMemo(() => {
    const dates = new Set<string>();
    for (const i of interviews) {
      dates.add(toDateKey(i.dateTime));
    }
    return dates;
  }, [interviews]);

  // Unique companies that have interviews
  const interviewCompanies = useMemo(() => {
    const set = new Set(interviews.map((i) => i.company));
    return Array.from(set).sort();
  }, [interviews]);

  // Status counts
  const scheduledCount = interviews.filter((i) => i.status === 'scheduled').length;
  const completedCount = interviews.filter((i) => i.status === 'completed').length;
  const cancelledCount = interviews.filter((i) => i.status === 'cancelled').length;

  const handleSubmit = async (data: Omit<Interview, 'id'>) => {
    if (editingInterview) {
      await updateInterview({ ...editingInterview, ...data });
    } else {
      await addInterview(data);
    }
    setShowForm(false);
    setEditingInterview(null);
  };

  const handleStatusChange = async (interview: Interview, status: InterviewStatus) => {
    await updateInterview({ ...interview, status, updatedAt: Date.now() });
  };

  const handleDelete = async (id: string) => {
    await deleteInterview(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <MiniCalendar
            interviewDates={interviewDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Status filter */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Status</h3>
            <div className="space-y-2">
              {[
                { key: '' as const, label: 'All', count: interviews.length, icon: <ListFilter className="w-3.5 h-3.5 text-gray-400" /> },
                { key: 'scheduled' as InterviewStatus, label: 'Scheduled', count: scheduledCount, icon: <Calendar className="w-3.5 h-3.5 text-interviews-500" /> },
                { key: 'completed' as InterviewStatus, label: 'Completed', count: completedCount, icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> },
                { key: 'cancelled' as InterviewStatus, label: 'Cancelled', count: cancelledCount, icon: <XCircle className="w-3.5 h-3.5 text-gray-400" /> },
              ].map((item) => (
                <button
                  key={item.key || 'all'}
                  onClick={() => setSelectedStatus(item.key as InterviewStatus | '')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedStatus === item.key
                      ? 'bg-interviews-50 dark:bg-interviews-900/20 text-interviews-700 dark:text-interviews-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="text-xs">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Company filter */}
          {interviewCompanies.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Companies</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCompany('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCompany === ''
                      ? 'bg-interviews-50 dark:bg-interviews-900/20 text-interviews-700 dark:text-interviews-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {interviewCompanies.map((c) => {
                  const count = interviews.filter((i) => i.company === c).length;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCompany(c)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCompany === c
                          ? 'bg-interviews-50 dark:bg-interviews-900/20 text-interviews-700 dark:text-interviews-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate">{c}</span>
                      <span className="text-xs ml-2">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                ref={searchRef}
                query={query}
                onSearch={handleSearch}
                onClear={clearSearch}
                placeholder="Search interviews..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingInterview(null);
                  setShowForm(true);
                }}
                className="btn-interviews flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setShowICalModal(true)}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Import iCal</span>
              </button>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'upcoming'
                  ? 'bg-interviews-100 dark:bg-interviews-900/30 text-interviews-700 dark:text-interviews-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-interviews-100 dark:bg-interviews-900/30 text-interviews-700 dark:text-interviews-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
          </div>

          {loading && <SkeletonList count={3} />}

          {!loading && filteredInterviews.length === 0 && (
            query ? (
              <EmptyState
                icon="search"
                title="No results found"
                description={`No interviews match "${query}". Try a different search term.`}
              />
            ) : (
              <EmptyState
                icon="calendar"
                title="No interviews scheduled"
                description="Schedule your upcoming interviews to track and prepare. Press N to add."
              />
            )
          )}

          {grouped.map((group) => (
            <div key={group.dateKey}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="grid gap-4">
                {group.interviews.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onEdit={(i) => {
                      setEditingInterview(i);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <InterviewForm
          interview={editingInterview ?? undefined}
          companies={companies}
          questions={questions}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingInterview(null);
          }}
        />
      )}

      {showICalModal && (
        <ICalImportModal
          onClose={() => setShowICalModal(false)}
          onImportDone={() => {
            setShowICalModal(false);
            loadInterviews();
          }}
        />
      )}
    </div>
  );
}
