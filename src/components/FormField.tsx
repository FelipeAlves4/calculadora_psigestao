import { Eye, EyeOff } from 'lucide-react';
import { InputHTMLAttributes, useState } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = ({ label, error, hint, type = 'text', id, ...props }: FormFieldProps) => {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const fieldId = id || props.name;
  const describedBy = [error ? `${fieldId}-error` : '', hint ? `${fieldId}-hint` : ''].filter(Boolean).join(' ') || undefined;

  return (
    <label className="form-field" htmlFor={fieldId}>
      <span>{label}{props.required ? <small aria-hidden="true"> *</small> : null}</span>
      <div className={error ? 'text-input-shell text-input-error' : 'text-input-shell'}>
        <input {...props} id={fieldId} type={password && visible ? 'text' : type} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
        {password ? (
          <button type="button" className="password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : null}
      </div>
      {hint && !error ? <small id={`${fieldId}-hint`} className="field-hint">{hint}</small> : null}
      {error ? <small id={`${fieldId}-error`} className="field-error">{error}</small> : null}
    </label>
  );
};
