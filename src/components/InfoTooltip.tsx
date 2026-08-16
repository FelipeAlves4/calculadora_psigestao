import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <span className="group relative inline-flex">
    <button
      type="button"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-navy-700 transition hover:bg-gold-500/15 hover:text-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
      aria-label={text}
    >
      <Info size={15} />
    </button>
    <span className="pointer-events-none absolute left-1/2 top-8 z-20 w-64 -translate-x-1/2 rounded-md bg-navy-900 px-3 py-2 text-xs font-medium leading-relaxed text-white opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100">
      {text}
    </span>
  </span>
);
