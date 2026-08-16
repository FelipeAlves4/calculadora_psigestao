import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';

export const LoginPage = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const successMessage = (location.state as { success?: string } | null)?.success;
  const sessionNotice = (location.state as { sessionNotice?: string } | null)?.sessionNotice ||
    (searchParams.get('reason') === 'session-expired' ? 'Sua sessão expirou. Entre novamente para continuar.' : '');

  if (!loading && user) return <Navigate to="/calculadora" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setMessage('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage('Informe um e-mail válido.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password, remember);
      navigate('/calculadora', { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) setMessage('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
      else if (apiError.status === 429) setMessage('Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.');
      else if (apiError.status === 403) setMessage('Seu acesso está indisponível. Entre em contato com o suporte para receber ajuda.');
      else setMessage('Não foi possível acessar sua conta agora. Tente novamente em instantes.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ACESSO À CALCULADORA"
      title="Acesse sua calculadora"
      description="Entre na sua conta para criar e visualizar suas simulações."
    >
      {successMessage ? <div className="form-alert form-alert-success" role="status">{successMessage}</div> : null}
      {sessionNotice ? <div className="form-alert form-alert-info" role="status">{sessionNotice}</div> : null}
      {message ? <div className="form-alert form-alert-error" role="alert"><strong>{message}</strong></div> : null}
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField label="E-mail" name="email" type="email" placeholder="seuemail@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        <FormField label="Senha" name="password" type="password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        <div className="form-options">
          <label className="checkbox-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Lembrar de mim</span></label>
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </div>
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? <><span className="loading-spinner loading-spinner-dark" /> Entrando…</> : 'Entrar na calculadora'}
        </button>
      </form>
      <p className="auth-alternate-action">Ainda não possui uma conta? <Link to="/cadastro">Criar conta</Link></p>
    </AuthShell>
  );
};
