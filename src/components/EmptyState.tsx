interface EmptyStateProps {
  title: string;
  description: string;
  icon: 'questions' | 'bookmarks' | 'search';
}

function QuestionsIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto mb-4">
      <rect x="20" y="30" width="80" height="60" rx="8" className="fill-gray-200 dark:fill-gray-700" />
      <rect x="30" y="42" width="40" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="30" y="52" width="60" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="30" y="62" width="50" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="30" y="72" width="30" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <circle cx="85" cy="25" r="15" className="fill-behavioral-200 dark:fill-behavioral-800" />
      <text x="85" y="30" textAnchor="middle" className="fill-behavioral-600 dark:fill-behavioral-400" fontSize="16" fontWeight="bold">?</text>
    </svg>
  );
}

function BookmarksIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto mb-4">
      <rect x="30" y="20" width="60" height="80" rx="4" className="fill-gray-200 dark:fill-gray-700" />
      <path d="M45 20 L45 55 L60 45 L75 55 L75 20" className="fill-bookmarks-300 dark:fill-bookmarks-700" />
      <rect x="40" y="65" width="40" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="40" y="75" width="30" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
      <rect x="40" y="85" width="35" height="4" rx="2" className="fill-gray-300 dark:fill-gray-600" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto mb-4">
      <circle cx="52" cy="52" r="25" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="4" fill="none" />
      <line x1="70" y1="70" x2="90" y2="90" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="4" strokeLinecap="round" />
      <circle cx="52" cy="52" r="10" className="fill-gray-200 dark:fill-gray-700" />
    </svg>
  );
}

const icons = {
  questions: QuestionsIcon,
  bookmarks: BookmarksIcon,
  search: SearchIcon,
};

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className="text-center py-16 animate-fade-in">
      <Icon />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
