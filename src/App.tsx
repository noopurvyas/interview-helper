import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BehavioralQuestionsPage } from './pages/BehavioralQuestions';
import { TechnicalQuestionsPage } from './pages/TechnicalQuestions';
import { BookmarksPage } from './pages/Bookmarks';
import { DashboardPage } from './pages/Dashboard';
import { Header } from './components/Header';
import { InstallBanner } from './components/InstallBanner';
import { Navigation } from './components/Navigation';
import { useQuestions } from './hooks/useQuestions';
import { useBookmarks } from './hooks/useBookmarks';
import jsPDF from 'jspdf';

function App() {
  const { questions } = useQuestions();
  const { bookmarks } = useBookmarks();

  const handleExport = () => {
    const format = prompt('Export as (json or pdf)?', 'json');

    if (format === 'json') {
      const data = {
        exportDate: new Date().toISOString(),
        questions,
        bookmarks,
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-helper-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const pdf = new jsPDF();
      let yPos = 10;

      pdf.setFontSize(16);
      pdf.text('Interview Helper Export', 10, yPos);
      yPos += 10;

      pdf.setFontSize(12);
      pdf.text(`Export Date: ${new Date().toLocaleDateString()}`, 10, yPos);
      yPos += 10;

      // Questions by type
      pdf.setFontSize(14);
      pdf.text('Behavioral Questions', 10, yPos);
      yPos += 8;

      questions
        .filter((q: any) => q.type === 'behavioral')
        .slice(0, 10)
        .forEach((q: any) => {
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(`Q: ${q.question}`, 190);
          pdf.text(lines, 10, yPos);
          yPos += 5 + lines.length * 5;

          if (yPos > 270) {
            pdf.addPage();
            yPos = 10;
          }
        });

      const dataStr = pdf.output('dataurlstring');
      const blob = dataToBlob(dataStr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-helper-export-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <InstallBanner />
        <Header onExportClick={handleExport} />
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/behavioral" element={<BehavioralQuestionsPage />} />
            <Route path="/technical" element={<TechnicalQuestionsPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function dataToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

export default App;
