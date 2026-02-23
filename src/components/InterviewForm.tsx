import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from './Modal';
import type {
  Interview,
  InterviewType,
  InterviewRound,
  InterviewStatus,
  Question,
} from '../db/indexeddb';
import { DEFAULT_COMPANIES } from '../db/indexeddb';

interface InterviewFormProps {
  interview?: Interview;
  companies: string[];
  questions?: Question[];
  defaultCompany?: string;
  onSubmit: (interview: Omit<Interview, 'id'>) => void;
  onCancel: () => void;
}

function toLocalDateTimeString(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function InterviewForm({
  interview,
  companies,
  questions = [],
  defaultCompany,
  onSubmit,
  onCancel,
}: InterviewFormProps) {
  const [company, setCompany] = useState(interview?.company || defaultCompany || '');
  const [dateTime, setDateTime] = useState(
    interview ? toLocalDateTimeString(interview.dateTime) : ''
  );
  const [interviewType, setInterviewType] = useState<InterviewType>(
    interview?.interviewType || 'video'
  );
  const [duration, setDuration] = useState(interview?.duration || 60);
  const [status, setStatus] = useState<InterviewStatus>(interview?.status || 'scheduled');
  const hasOptionalData = !!(interview?.role || interview?.round || interview?.location ||
    interview?.contactName || interview?.contactEmail || interview?.notes);
  const [showMore, setShowMore] = useState(hasOptionalData);
  const [role, setRole] = useState(interview?.role || '');
  const [round, setRound] = useState<InterviewRound | ''>(interview?.round || '');
  const [location, setLocation] = useState(interview?.location || '');
  const [contactName, setContactName] = useState(interview?.contactName || '');
  const [contactEmail, setContactEmail] = useState(interview?.contactEmail || '');
  const [notes, setNotes] = useState(interview?.notes || '');
  const [linkedQuestionIds, setLinkedQuestionIds] = useState<string[]>(
    interview?.linkedQuestionIds || []
  );
  const [questionSearch, setQuestionSearch] = useState('');

  const allCompanies = Array.from(
    new Set([...DEFAULT_COMPANIES, ...companies])
  ).sort();

  const companyQuestions = questions.filter(
    (q) => q.company?.toLowerCase() === company.toLowerCase()
  );
  const filteredQuestions = questionSearch
    ? companyQuestions.filter((q) =>
        q.question.toLowerCase().includes(questionSearch.toLowerCase())
      )
    : companyQuestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!company.trim() || !dateTime) {
      alert('Please fill in company and date/time');
      return;
    }

    const now = Date.now();
    onSubmit({
      company: company.trim(),
      dateTime: new Date(dateTime).getTime(),
      duration,
      interviewType,
      status,
      role: role || undefined,
      round: round || undefined,
      location: location || undefined,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      notes: notes || undefined,
      linkedQuestionIds,
      createdAt: interview?.createdAt || now,
      updatedAt: now,
    });
  };

  const toggleQuestion = (id: string) => {
    setLinkedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  return (
    <Modal onClose={onCancel} label={interview ? 'Edit Interview' : 'Schedule Interview'}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">
            {interview ? 'Edit Interview' : 'Schedule Interview'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Company */}
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <input
              type="text"
              list="company-suggestions-interview"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="input-field"
              placeholder="Type or select a company"
            />
            <datalist id="company-suggestions-interview">
              {allCompanies.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {company && companyQuestions.length > 0 && (
              <p className="text-xs text-interviews-600 dark:text-interviews-400 mt-1">
                {companyQuestions.length} question{companyQuestions.length !== 1 ? 's' : ''} prepared
              </p>
            )}
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Type + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                className="input-field"
              >
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="onsite">Onsite</option>
                <option value="take-home">Take-Home</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          {/* Status (only in edit mode) */}
          {interview && (
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InterviewStatus)}
                className="input-field"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* More Details toggle */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-sm text-interviews-600 dark:text-interviews-400 hover:text-interviews-700 dark:hover:text-interviews-300"
          >
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showMore ? 'Less Details' : 'More Details'}
          </button>

          {showMore && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role / Position</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Round</label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value as InterviewRound | '')}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="recruiter">Recruiter Screen</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="system-design">System Design</option>
                  <option value="hiring-manager">Hiring Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location / Meeting Link</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder="Zoom link, address, or phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input-field"
                    placeholder="Interviewer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="input-field"
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Prep notes, topics to review..."
                />
              </div>

              {/* Link Questions */}
              {company && companyQuestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link Questions ({linkedQuestionIds.length} selected)
                  </label>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="input-field mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                    {filteredQuestions.map((q) => (
                      <label
                        key={q.id}
                        className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={linkedQuestionIds.includes(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                          className="mt-0.5"
                        />
                        <span className="text-gray-700 dark:text-gray-300 line-clamp-2">
                          {q.question}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-interviews flex-1">
              {interview ? 'Update' : 'Schedule'} Interview
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
