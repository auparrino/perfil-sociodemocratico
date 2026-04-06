import { useState, useRef, useEffect } from 'react';

const P = {
  navy: '#003049', cream: '#FDF0D5',
  border: 'rgba(0,48,73,0.12)', borderLight: 'rgba(0,48,73,0.08)',
  textMuted: 'rgba(0,48,73,0.50)', hover: 'rgba(0,48,73,0.06)',
};

interface DropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  maxWidth?: number;
}

export function Dropdown({ value, options, onChange, maxWidth }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', maxWidth }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '4px 12px 4px 12px', borderRadius: 100, cursor: 'pointer',
          fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          border: `1px solid ${P.border}`, background: 'transparent', color: P.navy,
          display: 'flex', alignItems: 'center', gap: 6, maxWidth,
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected?.label || value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0, opacity: 0.4 }}>
          <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
          background: P.cream, border: `1px solid ${P.border}`, borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,48,73,0.10)',
          minWidth: 220, maxHeight: 320, overflowY: 'auto',
          padding: '4px 0',
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '6px 12px', cursor: 'pointer', fontSize: 13,
                color: o.value === value ? P.cream : P.navy,
                background: o.value === value ? P.navy : 'transparent',
                fontWeight: o.value === value ? 600 : 400,
              }}
              onMouseEnter={e => { if (o.value !== value) (e.target as HTMLElement).style.background = P.hover; }}
              onMouseLeave={e => { if (o.value !== value) (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
