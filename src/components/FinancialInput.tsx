import { useEffect, useState } from 'react';
import { formatPlainNumber, parseBrazilianNumber } from '../utils/formatters';
import { PercentageSlider } from './PercentageSlider';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  ariaLabel: string;
  compact?: boolean;
}

export const NumericInput = ({ value, onChange, prefix, suffix, min = 0, max, ariaLabel, compact = false }: NumericInputProps) => {
  const [focused, setFocused] = useState(false);
  const [display, setDisplay] = useState(formatPlainNumber(value));

  useEffect(() => {
    if (!focused) {
      setDisplay(formatPlainNumber(value));
    }
  }, [focused, value]);

  const commit = (rawValue: string) => {
    const parsed = parseBrazilianNumber(rawValue);
    const limited = Math.min(Math.max(parsed, min), max ?? Number.POSITIVE_INFINITY);
    onChange(limited);
  };

  return (
    <label className={`field-shell ${compact ? 'field-shell-compact' : ''}`}>
      {prefix && <span className="field-affix">{prefix}</span>}
      <input
        className="field-input"
        value={display}
        inputMode="decimal"
        onFocus={() => {
          setFocused(true);
          setDisplay(String(value).replace('.', ','));
        }}
        onBlur={() => {
          setFocused(false);
          commit(display);
        }}
        onChange={(event) => {
          setDisplay(event.target.value);
          commit(event.target.value);
        }}
        aria-label={ariaLabel}
      />
      {suffix && <span className="field-affix">{suffix}</span>}
    </label>
  );
};

interface FinancialInputProps {
  label: string;
  description: string;
  amount: number;
  percentage: number;
  min: number;
  max: number;
  step: number;
  onAmountChange: (value: number) => void;
  onPercentageChange: (value: number) => void;
  children?: React.ReactNode;
}

export const FinancialInput = ({
  label,
  description,
  amount,
  percentage,
  min,
  max,
  step,
  onAmountChange,
  onPercentageChange,
  children,
}: FinancialInputProps) => (
  <div className="indicator-card">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-white">{label}</h4>
          {children}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {description} <span className="text-gold-500">Valor: R$ {formatPlainNumber(amount)}</span>
        </p>
      </div>
      <div className="grid w-28 shrink-0 grid-cols-[1fr_auto] items-center gap-1">
        <NumericInput
          value={percentage}
          min={min}
          max={max}
          onChange={onPercentageChange}
          ariaLabel={`${label} em percentual`}
          compact
        />
        <span className="text-sm font-bold text-gold-500">%</span>
      </div>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(180px,240px)_1fr] sm:items-center">
      <NumericInput value={amount} prefix="R$" onChange={onAmountChange} ariaLabel={`${label} em reais`} compact />
      <PercentageSlider value={percentage} min={min} max={max} step={step} onChange={onPercentageChange} label={label} />
    </div>
  </div>
);
