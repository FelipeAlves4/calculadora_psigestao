interface PercentageSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
}

export const PercentageSlider = ({ value, min, max, step, onChange, label }: PercentageSliderProps) => (
  <input
    className="slider"
    type="range"
    min={min}
    max={max}
    step={step}
    value={Math.min(Math.max(value, min), max)}
    style={{ '--slider-progress': `${((value - min) / (max - min || 1)) * 100}%` } as React.CSSProperties}
    onChange={(event) => onChange(Number(event.target.value))}
    aria-label={label}
  />
);
