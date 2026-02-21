import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Zap, StickyNote, Calendar, Loader } from 'lucide-react';
import {
  getQuestionsByTypeAndCompany,
  getCompanyNote,
  saveCompanyNote,
  getInterviewsByCompany,
  type Question,
  type Interview,
} from '../db/indexeddb';
import { useQuestions } from '../hooks/useQuestions';
import { useInterviews } from '../hooks/useInterviews';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionForm } from '../components/QuestionForm';
import { InterviewCard } from '../components/InterviewCard';
import { InterviewForm } from '../components/InterviewForm';

type Tab = 'behavioral' | 'technical' | 'notes' | 'interviews';

export function CompanyDetailPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(companyName || '');

  const { companies, questions: allQuestions, updateQuestion, deleteQuestion, toggleFavorite, incrementPracticeCount, addQuestion } = useQuestions();
  const { addInterview, updateInterview: updateInterviewData, deleteInterview: deleteInterviewData } = useInterviews();

  const [activeTab, setActiveTab] = useState<Tab>('behavioral');
  const [behavioral, setBehavioral] = useState<Question[]>([]);
  const [technical, setTechnical] = useState<Question[]>([]);
  const [companyInterviews, setCompanyInterviews] = useState<Interview[]>([]);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!decodedName) return;
    setLoading(true);
    const [b, t, note, interviews] = await Promise.all([
      getQuestionsByTypeAndCompany('behavioral', decodedName),
      getQuestionsByTypeAndCompany('technical', decodedName),
      getCompanyNote(decodedName),
      getInterviewsByCompany(decodedName),
    ]);
    setBehavioral(b);
    setTechnical(t);
    setCompanyInterviews(interviews);
    if (note) setNotes(note.content);
    setLoading(false);
  }, [decodedName]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmit = async (data: Omit<Question, 'id'>) => {
    if (editingQuestion) {
      await updateQuestion({ ...editingQuestion, ...data });
    } else {
      await addQuestion({ ...data, company: decodedName });
    }
    setShowForm(false);
    setEditingQuestion(null);
    await loadQuestions();
  };

  const handleDelete = async (id: string) => {
    await deleteQuestion(id);
    await loadQuestions();
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    await loadQuestions();
  };

  const handlePractice = async (id: string) => {
    await incrementPracticeCount(id);
    await loadQuestions();
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);
  };

  const handleSaveNotes = async () => {
    await saveCompanyNote(decodedName, notes);
    setNotesSaved(true);
  };

  const questions = activeTab === 'behavioral' ? behavioral : technical;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'behavioral', label: 'Behavioral', icon: <BookOpen className="w-4 h-4" />, count: behavioral.length },
    { id: 'technical', label: 'Technical', icon: <Zap className="w-4 h-4" />, count: technical.length },
    { id: 'interviews', label: 'Interviews', icon: <Calendar className="w-4 h-4" />, count: companyInterviews.length },
    { id: 'notes', label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Back to companies"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{decodedName}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {behavioral.length + technical.length} questions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? tab.id === 'behavioral'
                  ? 'border-behavioral-600 text-behavioral-600'
                  : tab.id === 'technical'
                  ? 'border-technical-600 text-technical-600'
                  : tab.id === 'interviews'
                  ? 'border-interviews-600 text-interviews-600'
                  : 'border-bookmarks-600 text-bookmarks-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-behavioral-600" />
        </div>
      ) : activeTab === 'interviews' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingInterview(null);
                setShowInterviewForm(true);
              }}
              className="btn-interviews flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          </div>

          {companyInterviews.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No interviews scheduled</p>
              <p className="text-sm mt-2">Schedule your first interview with {decodedName}.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {companyInterviews
                .sort((a, b) => a.dateTime - b.dateTime)
                .map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onEdit={(i) => {
                      setEditingInterview(i);
                      setShowInterviewForm(true);
                    }}
                    onDelete={async (id) => {
                      await deleteInterviewData(id);
                      await loadQuestions();
                    }}
                    onStatusChange={async (interview, status) => {
                      await updateInterviewData({ ...interview, status, updatedAt: Date.now() });
                      await loadQuestions();
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      ) : activeTab === 'notes' ? (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={`Add prep notes for ${decodedName}...\n\nE.g. culture, values, team info, interview format, timeline...`}
            className="input-field min-h-[300px] font-mono text-sm"
            rows={12}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {notesSaved ? 'All changes saved' : 'Unsaved changes'}
            </span>
            <button
              onClick={handleSaveNotes}
              disabled={notesSaved}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                notesSaved
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default'
                  : 'bg-bookmarks-600 text-white hover:bg-bookmarks-700'
              }`}
            >
              Save Notes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowForm(true);
              }}
              className={`flex items-center gap-2 ${
                activeTab === 'behavioral' ? 'btn-behavioral' : 'btn-technical'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No {activeTab} questions yet</p>
              <p className="text-sm mt-2">Add your first {activeTab} question for {decodedName}.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onEdit={(q) => {
                    setEditingQuestion(q);
                    setShowForm(true);
                  }}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                  onPractice={handlePractice}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <QuestionForm
          question={editingQuestion ?? undefined}
          companies={companies}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingQuestion(null);
          }}
        />
      )}

      {showInterviewForm && (
        <InterviewForm
          interview={editingInterview ?? undefined}
          companies={companies}
          questions={allQuestions}
          defaultCompany={decodedName}
          onSubmit={async (data) => {
            if (editingInterview) {
              await updateInterviewData({ ...editingInterview, ...data });
            } else {
              await addInterview(data);
            }
            setShowInterviewForm(false);
            setEditingInterview(null);
            await loadQuestions();
          }}
          onCancel={() => {
            setShowInterviewForm(false);
            setEditingInterview(null);
          }}
        />
      )}
    </div>
  );
}
