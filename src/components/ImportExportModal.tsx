import { useRef, useState } from 'react';
import { X, Download, Upload, FileJson, FileText } from 'lucide-react';
import { Modal } from './Modal';
import type { Question, Bookmark } from '../db/indexeddb';
import { addQuestion, addBookmark, getAllQuestions, getAllBookmarks } from '../db/indexeddb';
import { useToast } from './Toast';
import jsPDF from 'jspdf';

interface ImportExportModalProps {
  companies: string[];
  onClose: () => void;
  onImportDone: () => void;
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportModal({ companies, onClose, onImportDone }: ImportExportModalProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportScope, setExportScope] = useState<'all' | 'behavioral' | 'technical' | 'bookmarks' | 'company'>('all');
  const [exportCompany, setExportCompany] = useState('');
  const [importing, setImporting] = useState(false);

  const handleExportJSON = async () => {
    const questions = await getAllQuestions();
    const bookmarks = await getAllBookmarks();

    let filteredQ = questions;
    let filteredB = bookmarks;

    if (exportScope === 'behavioral') {
      filteredQ = questions.filter((q) => q.type === 'behavioral');
      filteredB = [];
    } else if (exportScope === 'technical') {
      filteredQ = questions.filter((q) => q.type === 'technical');
      filteredB = [];
    } else if (exportScope === 'bookmarks') {
      filteredQ = [];
    } else if (exportScope === 'company' && exportCompany) {
      filteredQ = questions.filter((q) => q.company === exportCompany);
      filteredB = [];
    }

    const data = {
      exportDate: new Date().toISOString(),
      questions: filteredQ,
      bookmarks: filteredB,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const label = exportScope === 'company' ? exportCompany.toLowerCase().replace(/\s+/g, '-') : exportScope;
    downloadBlob(blob, `interview-helper-${label}-${Date.now()}.json`);
    toast(`Exported ${filteredQ.length} questions, ${filteredB.length} bookmarks`);
  };

  const handleExportPDF = async () => {
    const questions = await getAllQuestions();
    let filteredQ = questions;

    if (exportScope === 'behavioral') filteredQ = questions.filter((q) => q.type === 'behavioral');
    else if (exportScope === 'technical') filteredQ = questions.filter((q) => q.type === 'technical');
    else if (exportScope === 'company' && exportCompany) filteredQ = questions.filter((q) => q.company === exportCompany);

    const pdf = new jsPDF();
    let yPos = 10;

    pdf.setFontSize(16);
    pdf.text('Interview Helper Export', 10, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.text(`Exported: ${new Date().toLocaleDateString()} | ${filteredQ.length} questions`, 10, yPos);
    yPos += 12;

    for (const q of filteredQ) {
      if (yPos > 260) { pdf.addPage(); yPos = 10; }
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const prefix = q.company ? `[${q.company}] ` : '';
      const qLines = pdf.splitTextToSize(`${prefix}${q.question}`, 185);
      pdf.text(qLines, 10, yPos);
      yPos += qLines.length * 5 + 3;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      for (const a of q.answerVariations.slice(0, 2)) {
        if (yPos > 260) { pdf.addPage(); yPos = 10; }
        const text = a.star
          ? `S: ${a.star.situation}\nT: ${a.star.task}\nA: ${a.star.action}\nR: ${a.star.result}`
          : a.content;
        const aLines = pdf.splitTextToSize(text, 180);
        pdf.text(aLines, 15, yPos);
        yPos += aLines.length * 4 + 4;
      }
      yPos += 4;
    }

    const dataStr = pdf.output('dataurlstring');
    const blob = dataToBlob(dataStr);
    downloadBlob(blob, `interview-helper-export-${Date.now()}.pdf`);
    toast(`Exported ${filteredQ.length} questions to PDF`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let qCount = 0;
      let bCount = 0;

      if (Array.isArray(data.questions)) {
        for (const q of data.questions as Question[]) {
          const { id, ...rest } = q;
          await addQuestion(rest);
          qCount++;
        }
      }

      if (Array.isArray(data.bookmarks)) {
        for (const b of data.bookmarks as Bookmark[]) {
          const { id, ...rest } = b;
          await addBookmark(rest);
          bCount++;
        }
      }

      toast(`Imported ${qCount} questions, ${bCount} bookmarks`);
      onImportDone();
    } catch {
      toast('Failed to import file. Ensure it is a valid JSON export.', 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Modal onClose={onClose} label="Import & Export">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">Import & Export</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Download className="w-5 h-5 text-behavioral-500" />
              Export
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">Scope</label>
              <select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value as typeof exportScope)}
                className="input-field"
              >
                <option value="all">Everything</option>
                <option value="behavioral">Behavioral Questions</option>
                <option value="technical">Technical Questions</option>
                <option value="bookmarks">Bookmarks Only</option>
                {companies.length > 0 && <option value="company">By Company</option>}
              </select>
            </div>

            {exportScope === 'company' && (
              <select
                value={exportCompany}
                onChange={(e) => setExportCompany(e.target.value)}
                className="input-field"
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleExportJSON}
                disabled={exportScope === 'company' && !exportCompany}
                className="btn-behavioral flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={handleExportPDF}
                disabled={(exportScope === 'company' && !exportCompany) || exportScope === 'bookmarks'}
                className="btn-technical flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Import section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-bookmarks-500" />
              Import
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restore from a previously exported JSON file. Imported items will be added alongside existing data.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              aria-label="Select JSON file to import"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Choose JSON File'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
