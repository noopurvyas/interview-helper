import { useState, useRef } from 'react';
import { X, Upload, Link, AlertTriangle, Check } from 'lucide-react';
import ICAL from 'ical.js';
import { Modal } from './Modal';
import type { Interview, InterviewType } from '../db/indexeddb';
import {
  addInterview,
  getInterviewByIcalUid,
  getUniqueCompanies,
} from '../db/indexeddb';

interface ICalImportModalProps {
  onClose: () => void;
  onImportDone: () => void;
}

interface ParsedEvent {
  uid: string;
  summary: string;
  startTime: number;
  endTime: number;
  location?: string;
  description?: string;
  detectedCompany: string;
  isDuplicate: boolean;
  selected: boolean;
}

function detectCompany(text: string, existingCompanies: string[]): string {
  const lower = text.toLowerCase();

  // Check against existing companies
  for (const company of existingCompanies) {
    if (lower.includes(company.toLowerCase())) {
      return company;
    }
  }

  // Regex patterns for common interview naming
  const patterns = [
    /interview\s+(?:with|at|@)\s+(.+?)(?:\s*[-–—|]|$)/i,
    /(.+?)\s+interview/i,
    /(.+?)\s+(?:phone|video|onsite|technical|behavioral)\s+(?:screen|round|call)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return text.split(/[-–—|]/)[0].trim() || 'Unknown';
}

function detectInterviewType(text: string): InterviewType {
  const lower = (text || '').toLowerCase();
  if (lower.includes('phone') || lower.includes('call')) return 'phone';
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('in-person')) return 'onsite';
  if (lower.includes('take-home') || lower.includes('takehome') || lower.includes('assignment')) return 'take-home';
  return 'video';
}

async function parseICalData(icalData: string): Promise<ParsedEvent[]> {
  const existingCompanies = await getUniqueCompanies();
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  const events: ParsedEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const uid = event.uid;
    const summary = event.summary || 'Untitled Event';
    const startDate = event.startDate;
    const endDate = event.endDate;

    if (!startDate) continue;

    const startTime = startDate.toJSDate().getTime();
    const endTime = endDate ? endDate.toJSDate().getTime() : startTime + 60 * 60 * 1000;
    const location = vevent.getFirstPropertyValue('location') as string | null;
    const description = vevent.getFirstPropertyValue('description') as string | null;

    const isDuplicate = uid ? !!(await getInterviewByIcalUid(uid)) : false;

    events.push({
      uid,
      summary,
      startTime,
      endTime,
      location: location || undefined,
      description: description || undefined,
      detectedCompany: detectCompany(summary, existingCompanies),
      isDuplicate,
      selected: !isDuplicate,
    });
  }

  return events.sort((a, b) => a.startTime - b.startTime);
}

export function ICalImportModal({ onClose, onImportDone }: ICalImportModalProps) {
  const [tab, setTab] = useState<'url' | 'file'>('file');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ParsedEvent[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const parsed = await parseICalData(text);
      setEvents(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      if (message.includes('Failed to fetch') || message.includes('CORS') || message.includes('NetworkError')) {
        setError('Could not fetch the URL (likely blocked by CORS). Try downloading the .ics file and uploading it instead.');
      } else {
        setError(`Failed to fetch calendar: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const parsed = await parseICalData(text);
      setEvents(parsed);
    } catch {
      setError('Failed to parse the .ics file. Ensure it is a valid iCalendar file.');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleEvent = (idx: number) => {
    setEvents((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], selected: !next[idx].selected };
      return next;
    });
  };

  const updateCompany = (idx: number, company: string) => {
    setEvents((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], detectedCompany: company };
      return next;
    });
  };

  const handleImport = async () => {
    if (!events) return;
    const selected = events.filter((e) => e.selected && !e.isDuplicate);
    if (selected.length === 0) return;

    setImporting(true);
    try {
      for (const event of selected) {
        const duration = Math.round((event.endTime - event.startTime) / (60 * 1000));
        const now = Date.now();
        const interview: Omit<Interview, 'id'> = {
          company: event.detectedCompany,
          dateTime: event.startTime,
          duration: duration > 0 ? duration : 60,
          interviewType: detectInterviewType(event.summary + ' ' + (event.description || '')),
          status: event.startTime > now ? 'scheduled' : 'completed',
          notes: event.description || undefined,
          location: event.location || undefined,
          linkedQuestionIds: [],
          icalUid: event.uid,
          createdAt: now,
          updatedAt: now,
        };
        await addInterview(interview);
      }
      onImportDone();
    } catch {
      setError('Failed to import some events. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = events?.filter((e) => e.selected && !e.isDuplicate).length ?? 0;

  return (
    <Modal onClose={onClose} label="Import from iCal">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">Import from Calendar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!events ? (
            <>
              {/* Tab toggle */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setTab('file')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'file'
                      ? 'border-interviews-600 text-interviews-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setTab('url')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'url'
                      ? 'border-interviews-600 text-interviews-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  Paste URL
                </button>
              </div>

              {tab === 'file' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload an .ics file exported from Google Calendar, Outlook, Apple Calendar, or any calendar app.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".ics,.ical"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Select iCal file"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={loading}
                    className="btn-interviews w-full flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? 'Parsing...' : 'Choose .ics File'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paste an iCal URL (e.g. from Google Calendar's "Secret address in iCal format").
                  </p>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://calendar.google.com/calendar/ical/..."
                  />
                  <button
                    onClick={handleUrlFetch}
                    disabled={loading || !url.trim()}
                    className="btn-interviews w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Link className="w-4 h-4" />
                    {loading ? 'Fetching...' : 'Fetch Calendar'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Event list */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {events.length} event{events.length !== 1 ? 's' : ''} found
                </h3>
                <span className="text-sm text-gray-500">
                  {selectedCount} selected
                </span>
              </div>

              {events.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No events found in this calendar.
                </p>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {events.map((event, idx) => (
                    <div
                      key={event.uid || idx}
                      className={`p-3 rounded-lg border transition-colors ${
                        event.isDuplicate
                          ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 opacity-60'
                          : event.selected
                          ? 'border-interviews-300 dark:border-interviews-700 bg-interviews-50 dark:bg-interviews-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={event.selected}
                          disabled={event.isDuplicate}
                          onChange={() => toggleEvent(idx)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {event.summary}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.startTime).toLocaleString()} ({Math.round((event.endTime - event.startTime) / 60000)} min)
                          </p>
                          {event.isDuplicate && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Already imported
                            </p>
                          )}
                          <div className="mt-2">
                            <label className="text-xs text-gray-500 block mb-0.5">Company:</label>
                            <input
                              type="text"
                              value={event.detectedCompany}
                              onChange={(e) => updateCompany(idx, e.target.value)}
                              disabled={event.isDuplicate}
                              className="input-field text-sm py-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEvents(null)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0}
                  className="btn-interviews flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {importing ? 'Importing...' : `Import ${selectedCount} Event${selectedCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
