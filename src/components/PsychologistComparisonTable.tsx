import { ArrowDownRight, ArrowUpRight, Equal, Shuffle } from 'lucide-react';
import { PsychologistComparisonRow } from '../types/psychologist';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const format = (row: PsychologistComparisonRow, value: number) =>
  row.format === 'currency' ? formatCurrency(value) : row.format === 'percentage' ? formatPercentage(value) : row.format === 'hours' ? `${value.toLocaleString('pt-BR')} h` : value.toLocaleString('pt-BR');

const formatDifference = (row: PsychologistComparisonRow) => {
  if (Math.abs(row.difference) < 0.0001) return format(row, 0);
  return `${row.difference > 0 ? '+ ' : '− '}${format(row, Math.abs(row.difference))}`;
};

const Status = ({ row }: { row: PsychologistComparisonRow }) => {
  if (row.key === 'individualRevenue' && row.status === 'negative') {
    return <span className="status-badge status-badge-strategy"><Shuffle size={15} />Redistribuído</span>;
  }
  if (row.status === 'positive') return <span className="status-badge status-badge-positive"><ArrowUpRight size={15} />Melhor</span>;
  if (row.status === 'negative') return <span className="status-badge status-badge-negative"><ArrowDownRight size={15} />Atenção</span>;
  return <span className="status-badge status-badge-neutral"><Equal size={15} />Neutro</span>;
};

const differenceTone = (row: PsychologistComparisonRow) =>
  row.key === 'individualRevenue' && row.status === 'negative'
    ? 'text-[#f1cb79]'
    : row.status === 'positive'
      ? 'text-emerald-300'
      : row.status === 'negative'
        ? 'text-red-300'
        : 'text-slate-200';

export const PsychologistComparisonTable = ({ rows }: { rows: PsychologistComparisonRow[] }) => <>
  <div className="comparison-mobile-list">
    {rows.map((row) => <article key={row.key} className="comparison-mobile-card">
      <div className="flex items-start justify-between gap-3"><h3>{row.label}</h3><Status row={row} /></div>
      <div className="comparison-mobile-values"><div><span>Atual</span><strong>{format(row, row.current)}</strong></div><div><span>Projetado</span><strong>{format(row, row.projected)}</strong></div></div>
      <div className="comparison-mobile-difference"><span>Diferença</span><strong className={differenceTone(row)}>{formatDifference(row)}</strong></div>
    </article>)}
  </div>
  <div className="comparison-table-shell">
    <table className="min-w-full text-sm">
      <thead><tr><th>Indicador</th><th>Cenário atual</th><th>Cenário projetado</th><th>Diferença</th><th>Leitura</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.key}>
        <td className="font-semibold text-white">{row.label}</td>
        <td>{format(row, row.current)}</td>
        <td>{format(row, row.projected)}</td>
        <td className={`comparison-difference ${differenceTone(row)}`}>{formatDifference(row)}</td>
        <td><Status row={row} /></td>
      </tr>)}</tbody>
    </table>
  </div>
</>;
