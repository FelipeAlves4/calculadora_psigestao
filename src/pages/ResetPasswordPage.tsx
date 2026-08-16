import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../auth/api';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState(token ? '' : 'Link de recuperação inválido ou expirado.');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || submitting) return;
    setMessage('');
    setSubmitting(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, passwordConfirmation: confirmation }),
      });
      navigate('/login', { replace: true, state: { success: 'Senha redefinida com sucesso. Entre com sua nova senha.' } });
    } catch (error) {
      setMessage((error as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="REDEFINIR SENHA" title="Crie uma nova senha" description="O link é temporário e poderá ser utilizado apenas uma vez.">
      {message ? <div className="form-alert form-alert-error" role="alert">{message}</div> : null}
      {token ? (
        <form className="auth-form" onSubmit={submit}>
          <FormField label="Nova senha" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número." autoComplete="new-password" required />
          <FormField label="Confirmação da nova senha" name="confirmation" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
          <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Redefinir senha'}</button>
        </form>
      ) : <Link to="/recuperar-senha" className="auth-submit auth-submit-link">Solicitar novo link</Link>}
    </AuthShell>
  );
};
