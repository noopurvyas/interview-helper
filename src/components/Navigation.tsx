import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Zap, Bookmark, BarChart3 } from 'lucide-react';

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Behavioral',
    path: '/behavioral',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'behavioral',
  },
  {
    label: 'Technical',
    path: '/technical',
    icon: <Zap className="w-5 h-5" />,
    color: 'technical',
  },
  {
    label: 'Bookmarks',
    path: '/bookmarks',
    icon: <Bookmark className="w-5 h-5" />,
    color: 'bookmarks',
  },
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'behavioral',
  },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const colorMap: Record<string, { active: string; inactive: string }> = {
              behavioral: {
                active: 'text-behavioral-600 border-behavior al-600 bg-behavioral-50 dark:bg-behavioral-900/20',
                inactive: 'text-gray-600 dark:text-gray-400 border-transparent hover:text-behavioral-600',
              },
              technical: {
                active: 'text-technical-600 border-technical-600 bg-technical-50 dark:bg-technical-900/20',
                inactive: 'text-gray-600 dark:text-gray-400 border-transparent hover:text-technical-600',
              },
              bookmarks: {
                active: 'text-bookmarks-600 border-bookmarks-600 bg-bookmarks-50 dark:bg-bookmarks-900/20',
                inactive: 'text-gray-600 dark:text-gray-400 border-transparent hover:text-bookmarks-600',
              },
            };

            const colors = colorMap[item.color] || colorMap.behavioral;
            const buttonClasses = isActive
              ? `border-b-2 ${colors.active} font-semibold`
              : `border-b-2 ${colors.inactive}`;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-4 py-4 text-sm whitespace-nowrap transition-colors ${buttonClasses}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
