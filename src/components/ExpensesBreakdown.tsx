import { Plus, Trash2 } from 'lucide-react';
import { ExpenseItem } from '../types/financial';
import { formatCurrency } from '../utils/formatters';
import { NumericInput } from './FinancialInput';

interface ExpensesBreakdownProps {
  expenses: ExpenseItem[];
  onChange: (expenses: ExpenseItem[]) => void;
}

export const ExpensesBreakdown = ({ expenses, onChange }: ExpensesBreakdownProps) => {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const updateExpense = (id: string, patch: Partial<ExpenseItem>) => {
    onChange(expenses.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addExpense = () => {
    onChange([
      ...expenses,
      {
        id: `despesa-${Date.now()}`,
        name: 'Nova despesa',
        amount: 0,
        custom: true,
      },
    ]);
  };

  return (
    <div className="mt-3 rounded-md border border-dashed border-gold-500/30 bg-navy-900/45 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Detalhamento das despesas</h4>
          <p className="text-xs text-slate-300">Total aplicado no indicador: {formatCurrency(total)}</p>
        </div>
        <button type="button" className="icon-text-button" onClick={addExpense}>
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      <div className="grid gap-2">
        {expenses.map((expense) => (
          <div key={expense.id} className="grid gap-2 rounded-md border border-white/10 bg-[#142944] p-2 sm:grid-cols-[1fr_170px_36px]">
            <input
              className="rounded-md border border-white/10 bg-[#0b1b2d] px-3 py-2 text-sm font-medium text-white outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              value={expense.name}
              onChange={(event) => updateExpense(expense.id, { name: event.target.value })}
              aria-label="Nome da despesa"
            />
            <NumericInput
              value={expense.amount}
              prefix="R$"
              onChange={(amount) => updateExpense(expense.id, { amount })}
              ariaLabel={`Valor de ${expense.name}`}
              compact
            />
            <button
              type="button"
              className="icon-button text-red-300 hover:bg-red-500/10"
              onClick={() => onChange(expenses.filter((item) => item.id !== expense.id))}
              disabled={!expense.custom}
              title={expense.custom ? 'Excluir despesa' : 'Despesa inicial'}
              aria-label={`Excluir ${expense.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
