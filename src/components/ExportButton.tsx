import { useRef, useCallback } from 'react';
import { exportToPng, exportToCsv } from '../utils/export';

interface ExportButtonProps {
  /** Ref to the element to export as PNG */
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
  /** Optional CSV data: if provided, shows CSV export too */
  csvData?: { headers: string[]; rows: (string | number)[][] };
}

export function ExportButton({ targetRef, filename, csvData }: ExportButtonProps) {
  const handlePng = useCallback(() => {
    if (targetRef.current) {
      exportToPng(targetRef.current, filename);
    }
  }, [targetRef, filename]);

  const handleCsv = useCallback(() => {
    if (csvData) {
      exportToCsv(csvData.headers, csvData.rows, filename);
    }
  }, [csvData, filename]);

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      <button
        className="export-btn"
        onClick={handlePng}
        title="Export as PNG"
        aria-label="Export as PNG"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      {csvData && (
        <button
          className="export-btn"
          onClick={handleCsv}
          title="Export as CSV"
          aria-label="Export as CSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Hook to create a ref for export targets.
 */
export function useExportRef() {
  return useRef<HTMLDivElement>(null);
}
