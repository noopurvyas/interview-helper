import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div className="bg-gradient-to-r from-behavioral-500 to-technical-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Download className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium truncate">
            Install Interview Helper for offline access
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            className="px-3 py-1.5 text-sm font-semibold bg-white text-behavioral-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
