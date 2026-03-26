import { toPng } from 'html-to-image';

/**
 * Export a DOM element as a PNG image download.
 */
export async function exportToPng(element: HTMLElement, filename: string) {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#fffdf8',
      pixelRatio: 2,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export PNG:', err);
  }
}

/**
 * Export tabular data as a CSV download.
 */
export function exportToCsv(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.download = `${filename}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}
