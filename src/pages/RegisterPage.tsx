import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../auth/api';
import { AuthShell } from '../components/AuthShell';
import { FormField } from '../components/FormField';
import { formatBrazilianPhone } from '../utils/formatters';

const initialForm = { name: '', phone: '', email: '', password: '', passwordConfirmation: '', acceptTerms: false };

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().split(/\s+/).length < 2) next.name = 'Informe seu nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.';
    if (![10, 11].includes(form.phone.replace(/\D/g, '').length)) next.phone = 'Informe um telefone brasileiro válido.';
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = 'Use 8 caracteres ou mais, com maiúscula, minúscula e número.';
    }
    if (form.password !== form.passwordConfirmation) next.passwordConfirmation = 'As senhas não coincidem.';
    if (!form.acceptTerms) next.acceptTerms = 'Você precisa aceitar os termos de uso e a política de privacidade.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setMessage('');
    setSubmitting(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      navigate('/login', {
        replace: true,
        state: { success: 'Cadastro realizado com sucesso. Entre para começar a usar a calculadora.' },
      });
    } catch (error) {
      const apiError = error as ApiError;
      setMessage(apiError.status === 409 ? 'Já existe uma conta com este e-mail.' : 'Não foi possível criar sua conta agora. Tente novamente em instantes.');
      setErrors(apiError.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell variant="register" eyebrow="CRIAR CONTA" title="Crie sua conta" description="Cadastre-se para começar a simular seus resultados profissionais.">
      {message ? <div className="form-alert form-alert-error" role="alert">{message}</div> : null}
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField label="Nome completo" name="name" placeholder="Seu nome completo" value={form.name} onChange={(event) => update('name', event.target.value)} error={errors.name} autoComplete="name" required />
        <FormField label="Telefone com WhatsApp" name="phone" type="tel" value={form.phone} onChange={(event) => update('phone', formatBrazilianPhone(event.target.value))} error={errors.phone} autoComplete="tel" inputMode="tel" required />
        <FormField label="E-mail profissional" name="email" type="email" placeholder="seuemail@exemplo.com" value={form.email} onChange={(event) => update('email', event.target.value)} error={errors.email} autoComplete="email" required />
        <FormField label="Senha" name="password" type="password" placeholder="Crie uma senha segura" value={form.password} onChange={(event) => update('password', event.target.value)} error={errors.password} hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número." autoComplete="new-password" required />
        <FormField label="Confirmação de senha" name="passwordConfirmation" type="password" placeholder="Digite sua senha novamente" value={form.passwordConfirmation} onChange={(event) => update('passwordConfirmation', event.target.value)} error={errors.passwordConfirmation} autoComplete="new-password" required />
        <label className="checkbox-field checkbox-terms">
          <input type="checkbox" checked={form.acceptTerms} onChange={(event) => update('acceptTerms', event.target.checked)} aria-invalid={Boolean(errors.acceptTerms)} />
          <span>Li e aceito os termos de uso e a política de privacidade.</span>
        </label>
        {errors.acceptTerms ? <small className="field-error">{errors.acceptTerms}</small> : null}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? <><span className="loading-spinner loading-spinner-dark" /> Criando conta…</> : 'Criar conta e acessar calculadora'}</button>
      </form>
      <p className="auth-alternate-action">Já possui uma conta? <Link to="/login">Entrar</Link></p>
    </AuthShell>
  );
};
