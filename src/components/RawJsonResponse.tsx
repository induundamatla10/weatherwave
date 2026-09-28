import React, { useState } from 'react';
import { Copy, Check, ChevronRight, ChevronDown, Code } from 'lucide-react';

interface RawJsonResponseProps {
  data: Record<string, unknown> | null;
}

export const RawJsonResponse: React.FC<RawJsonResponseProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formatMode, setFormatMode] = useState<'unformatted' | 'formatted'>('unformatted');

  if (!data) return null;

  const rawString = formatMode === 'formatted'
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(data, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header bar button */}
      <div className="flex items-center justify-between p-4 sm:px-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-sm sm:text-base font-semibold text-white/90 hover:text-white transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg px-1.5 py-1"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
          )}
          <span>
            {isOpen ? '▼ Hide Raw JSON Response' : '▶ View Raw JSON Response'}
          </span>
        </button>

        {isOpen && (
          <div className="flex items-center gap-2">
            {/* Format toggle: unformatted vs formatted */}
            <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/15 text-xs text-white/80">
              <button
                type="button"
                onClick={() => setFormatMode('unformatted')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  formatMode === 'unformatted'
                    ? 'bg-white/25 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Unformatted
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('formatted')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  formatMode === 'formatted'
                    ? 'bg-white/25 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Pretty Print
              </button>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg transition-colors cursor-pointer"
              title="Copy JSON to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white/80" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-white/15 bg-black/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2 text-xs text-white/60">
            <span className="flex items-center gap-1.5 font-mono">
              <Code className="w-3.5 h-3.5" />
              open-meteo.com/v1/forecast payload ({rawString.length.toLocaleString()} bytes)
            </span>
          </div>
          <pre className="font-mono text-xs text-slate-200/90 overflow-x-auto p-4 bg-black/60 rounded-xl border border-white/10 max-h-96 leading-relaxed select-all">
            <code>{rawString}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
