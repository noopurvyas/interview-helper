import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  interviewDates: Set<string>; // "YYYY-MM-DD" strings
  selectedDate: string | null;  // "YYYY-MM-DD" or null
  onSelectDate: (date: string | null) => void;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function MiniCalendar({ interviewDates, selectedDate, onSelectDate }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayKey = toDateKey(today);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleDayClick = (dayKey: string) => {
    if (selectedDate === dayKey) {
      onSelectDate(null);
    } else {
      onSelectDate(dayKey);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <table className="w-full text-center text-xs" role="grid" aria-label="Calendar">
        <thead>
          <tr>
            {dayNames.map((d) => (
              <th key={d} className="py-1 text-gray-500 dark:text-gray-400 font-medium">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
                if (day === null) {
                  return <td key={`empty-${i}`} className="py-1" />;
                }

                const dayKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dayKey === todayKey;
                const isSelected = dayKey === selectedDate;
                const hasInterview = interviewDates.has(dayKey);

                return (
                  <td key={day} className="py-0.5">
                    <button
                      onClick={() => handleDayClick(dayKey)}
                      className={`w-7 h-7 rounded-full text-xs relative transition-colors ${
                        isSelected
                          ? 'bg-interviews-600 text-white font-bold'
                          : isToday
                          ? 'bg-interviews-100 dark:bg-interviews-900/30 text-interviews-700 dark:text-interviews-300 font-bold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      aria-label={`${day}, ${hasInterview ? 'has interviews' : 'no interviews'}`}
                    >
                      {day}
                      {hasInterview && (
                        <span
                          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-interviews-500'
                          }`}
                        />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
