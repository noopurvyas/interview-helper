import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BehavioralQuestionsPage } from './pages/BehavioralQuestions';
import { TechnicalQuestionsPage } from './pages/TechnicalQuestions';
import { BookmarksPage } from './pages/Bookmarks';
import { DashboardPage } from './pages/Dashboard';
import { CompanyHubPage } from './pages/CompanyHub';
import { CompanyDetailPage } from './pages/CompanyDetail';
import { InterviewsPage } from './pages/Interviews';
import { Header } from './components/Header';
import { InstallBanner } from './components/InstallBanner';
import { Navigation } from './components/Navigation';
import { ToastProvider } from './components/Toast';
import { ImportExportModal } from './components/ImportExportModal';
import { useQuestions } from './hooks/useQuestions';

function AppContent() {
  const { companies, loadQuestions } = useQuestions();
  const [showImportExport, setShowImportExport] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <InstallBanner />
      <Header onExportClick={() => setShowImportExport(true)} />
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/behavioral" element={<BehavioralQuestionsPage />} />
          <Route path="/technical" element={<TechnicalQuestionsPage />} />
          <Route path="/companies" element={<CompanyHubPage />} />
          <Route path="/companies/:companyName" element={<CompanyDetailPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Routes>
      </main>

      {showImportExport && (
        <ImportExportModal
          companies={companies}
          onClose={() => setShowImportExport(false)}
          onImportDone={() => {
            loadQuestions();
            setShowImportExport(false);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
