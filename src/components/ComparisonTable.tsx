import { ArrowRight, ArrowUp } from 'lucide-react';
import { ComparisonRow } from '../types/financial';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface ComparisonTableProps {
  rows: ComparisonRow[];
}

export const ComparisonTable = ({ rows }: ComparisonTableProps) => {
  const format = (row: ComparisonRow, value: number) => (row.format === 'percentage' ? formatPercentage(value) : formatCurrency(value));

  return (
    <>
      <div className="comparison-mobile-list">
        {rows.map((row) => (
          <article key={row.key} className="comparison-mobile-card">
            <div className="flex items-start justify-between gap-3">
              <h3>{row.label}</h3>
              <StatusBadge status={row.status} />
            </div>
            <div className="comparison-mobile-values">
              <div>
                <span>Atual</span>
                <strong>{format(row, row.current)}</strong>
              </div>
              <div>
                <span>Projetado</span>
                <strong>{format(row, row.projected)}</strong>
              </div>
            </div>
            <div className="comparison-mobile-difference">
              <span>Diferença</span>
              <strong className={row.status === 'positive' ? 'text-emerald-300' : row.status === 'negative' ? 'text-red-300' : 'text-slate-200'}>
                {format(row, row.difference)}
              </strong>
            </div>
          </article>
        ))}
      </div>

      <div className="comparison-table-shell">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Cenário atual</th>
              <th>Cenário projetado</th>
              <th>Diferença</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="font-semibold text-white">{row.label}</td>
                <td>{format(row, row.current)}</td>
                <td>{format(row, row.projected)}</td>
                <td className={row.status === 'positive' ? 'text-emerald-300' : row.status === 'negative' ? 'text-red-300' : 'text-slate-300'}>
                  {format(row, row.difference)}
                </td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const StatusBadge = ({ status }: { status: ComparisonRow['status'] }) => {
  if (status === 'negative') {
    return null;
  }

  if (status === 'neutral') {
    return (
      <span className="status-badge bg-slate-700/70 text-slate-200">
        <ArrowRight size={15} />
        Neutro
      </span>
    );
  }

  return (
    <span className="status-badge bg-emerald-500/15 text-emerald-300">
      <ArrowUp size={15} />
      Melhoria
    </span>
  );
};
