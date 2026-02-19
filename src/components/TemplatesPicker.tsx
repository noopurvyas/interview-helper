import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { BEHAVIORAL_TEMPLATES } from '../db/indexeddb';

interface TemplatesPickerProps {
  onSelect: (question: string) => void;
  onClose: () => void;
}

export function TemplatesPicker({ onSelect, onClose }: TemplatesPickerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    BEHAVIORAL_TEMPLATES[0]?.category || null
  );

  return (
    <Modal onClose={onClose} label="Common Behavioral Questions">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">Common Behavioral Questions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {BEHAVIORAL_TEMPLATES.map((cat) => (
            <div key={cat.category}>
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === cat.category ? null : cat.category)
                }
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg font-semibold text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span>{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{cat.questions.length}</span>
                  {expandedCategory === cat.category ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {expandedCategory === cat.category && (
                <div className="ml-2 mt-1 space-y-1">
                  {cat.questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onSelect(q)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-behavioral-50 dark:hover:bg-behavioral-900/20 hover:text-behavioral-700 dark:hover:text-behavioral-300 transition-colors flex items-center gap-2 group"
                    >
                      <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-behavioral-500 shrink-0 transition-opacity" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
