import { useState } from 'react';
import {
  Edit2,
  Trash2,
  MapPin,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Link2,
  Video,
  Phone,
  Building2,
  FileCode,
  HelpCircle,
} from 'lucide-react';
import type { Interview, InterviewStatus } from '../db/indexeddb';

interface InterviewCardProps {
  interview: Interview;
  onEdit: (interview: Interview) => void;
  onDelete: (id: string) => void;
  onStatusChange: (interview: Interview, status: InterviewStatus) => void;
}

const statusConfig: Record<InterviewStatus, { label: string; color: string }> = {
  scheduled: {
    label: 'Scheduled',
    color: 'bg-interviews-100 dark:bg-interviews-900/30 text-interviews-700 dark:text-interviews-300',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
};

const statusCycle: InterviewStatus[] = ['scheduled', 'completed', 'cancelled'];

const typeIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  onsite: <Building2 className="w-3.5 h-3.5" />,
  'take-home': <FileCode className="w-3.5 h-3.5" />,
  other: <HelpCircle className="w-3.5 h-3.5" />,
};

function getRelativeTime(dateTime: number): string {
  const now = Date.now();
  const diff = dateTime - now;
  const absDiff = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absDiff < 60 * 60 * 1000) {
    const minutes = Math.round(diff / (60 * 1000));
    return rtf.format(minutes, 'minute');
  }
  if (absDiff < 24 * 60 * 60 * 1000) {
    const hours = Math.round(diff / (60 * 60 * 1000));
    return rtf.format(hours, 'hour');
  }
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  return rtf.format(days, 'day');
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function InterviewCard({ interview, onEdit, onDelete, onStatusChange }: InterviewCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const status = statusConfig[interview.status];

  const cycleStatus = () => {
    const idx = statusCycle.indexOf(interview.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    onStatusChange(interview, next);
  };

  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(interview.dateTime));

  const relativeTime = getRelativeTime(interview.dateTime);

  return (
    <div className={`card-interviews animate-fade-in ${interview.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {interview.company}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{dateStr}</span>
            <span className="text-interviews-600 dark:text-interviews-400 font-medium">
              ({relativeTime})
            </span>
          </div>
        </div>
        <button
          onClick={cycleStatus}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${status.color}`}
          title={`Status: ${status.label} (click to change)`}
        >
          {status.label}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="badge badge-interviews flex items-center gap-1">
          {typeIcons[interview.interviewType]}
          {interview.interviewType}
        </span>
        {interview.round && (
          <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {interview.round}
          </span>
        )}
        {interview.role && (
          <span className="badge bg-interviews-50 dark:bg-interviews-900/20 text-interviews-700 dark:text-interviews-300">
            {interview.role}
          </span>
        )}
        <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          {interview.duration} min
        </span>
      </div>

      {interview.location && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {isUrl(interview.location) ? (
            <a
              href={interview.location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-behavioral-600 dark:text-behavioral-400 hover:underline truncate"
            >
              {interview.location}
            </a>
          ) : (
            <span className="truncate">{interview.location}</span>
          )}
        </div>
      )}

      {interview.contactName && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{interview.contactName}</span>
          {interview.contactEmail && (
            <span className="text-gray-400">({interview.contactEmail})</span>
          )}
        </div>
      )}

      {interview.linkedQuestionIds.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-interviews-600 dark:text-interviews-400 mb-2">
          <Link2 className="w-3.5 h-3.5" />
          <span>{interview.linkedQuestionIds.length} linked question{interview.linkedQuestionIds.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {interview.notes && (
        <div className="mb-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Notes
          </button>
          {showNotes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
              {interview.notes}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(interview)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Edit interview"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(interview.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="Delete interview"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
