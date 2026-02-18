import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FilterSidebarProps {
  companies?: string[];
  categories?: string[];
  selectedCompanies?: string[];
  selectedCategory?: string;
  onCompanyChange?: (companies: string[]) => void;
  onCategoryChange?: (category: string) => void;
  showFavoritesOnly?: boolean;
  onFavoritesChange?: (favorites: boolean) => void;
}

export function FilterSidebar({
  companies = [],
  categories = [],
  selectedCompanies = [],
  selectedCategory = '',
  onCompanyChange,
  onCategoryChange,
  showFavoritesOnly = false,
  onFavoritesChange,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    companies: true,
    categories: true,
    favorites: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCompany = (company: string) => {
    if (!onCompanyChange) return;
    const newCompanies = selectedCompanies.includes(company)
      ? selectedCompanies.filter((c) => c !== company)
      : [...selectedCompanies, company];
    onCompanyChange(newCompanies);
  };

  return (
    <div className="w-full md:w-64 space-y-4">
      {/* Companies Filter */}
      {companies.length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleSection('companies')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 dark:text-white"
          >
            <span>Companies</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.companies ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.companies && (
            <div className="mt-3 space-y-2">
              {companies.map((company) => (
                <label key={company} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company)}
                    onChange={() => toggleCompany(company)}
                    className="w-4 h-4 rounded border-gray-300 text-behavioral-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{company}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 dark:text-white"
          >
            <span>Categories</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.categories ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.categories && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === ''}
                  onChange={() => onCategoryChange?.('')}
                  className="w-4 h-4 text-behavioral-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
              </label>
              {categories.map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => onCategoryChange?.(category)}
                    className="w-4 h-4 text-behavioral-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites Filter */}
      {onFavoritesChange && (
        <div className="card">
          <button
            onClick={() => toggleSection('favorites')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 dark:text-white"
          >
            <span>Favorites</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.favorites ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.favorites && (
            <div className="mt-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => onFavoritesChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-behavioral-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Show only favorites
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
