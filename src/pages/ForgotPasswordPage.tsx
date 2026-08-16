import { FormEvent, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../auth/api';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const response = await api<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setMessage(response.message);
    } catch (caught) {
      setError((caught as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="RECUPERAR ACESSO" title="Esqueceu sua senha?" description="Informe seu e-mail para receber um link temporário de redefinição.">
      {message ? <div className="form-alert form-alert-success" role="status">{message}</div> : null}
      {error ? <div className="form-alert form-alert-error" role="alert">{error}</div> : null}
      <form className="auth-form" onSubmit={submit}>
        <FormField label="E-mail" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar instruções'}</button>
      </form>
      <Link to="/login" className="auth-back-link"><ArrowLeft size={16} /> Voltar para o login</Link>
    </AuthShell>
  );
};
