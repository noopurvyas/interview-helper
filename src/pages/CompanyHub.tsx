import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BookOpen, Zap, Clock } from 'lucide-react';
import { type CompanyStats, getCompanyStats } from '../db/indexeddb';

export function CompanyHubPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyStats().then((stats) => {
      setCompanies(stats);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-behavioral-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} in your prep
          </p>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-16 text-gray-600 dark:text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No companies yet</p>
          <p className="text-sm mt-2">Add questions from the Behavioral or Technical sections to see companies here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <button
              key={company.name}
              onClick={() => navigate(`/companies/${encodeURIComponent(company.name)}`)}
              className="card text-left hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-behavioral-100 to-technical-100 dark:from-behavioral-900/30 dark:to-technical-900/30">
                  <Building2 className="w-5 h-5 text-behavioral-600 dark:text-behavioral-400" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {company.total}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {company.name}
              </h3>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-behavioral-500" />
                  {company.behavioral}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-technical-500" />
                  {company.technical}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {company.lastPracticed
                    ? new Date(company.lastPracticed).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
