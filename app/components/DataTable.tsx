'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  maxHeight?: string;
  exportFilename?: string;
}

export function DataTable({ columns, data, maxHeight = '600px', exportFilename }: DataTableProps) {
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        const cmp = typeof va === 'number' ? va - vb : String(va || '').localeCompare(String(vb || ''));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleExport = () => {
    if (!exportFilename) return;
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row => columns.map(c => {
      const v = row[c.key];
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? '';
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {exportFilename && (
        <div className="flex justify-end mb-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-[#9b9bb0] hover:bg-white/[0.08] hover:text-white transition-colors">
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      )}
      <div className="table-container rounded-xl border border-white/[0.06] overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] sticky top-0 z-10">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-3 px-4 text-xs font-semibold text-[#9b9bb0] uppercase tracking-wider cursor-pointer hover:text-white transition-colors ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="py-8 text-center text-[#9b9bb0]">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > 0 && (
        <div className="mt-2 text-xs text-[#9b9bb0]">{sorted.length} rows</div>
      )}
    </div>
  );
}
