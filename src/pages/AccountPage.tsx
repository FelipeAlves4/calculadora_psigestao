import { FormEvent, useState } from 'react';
import { api, ApiError, User } from '../auth/api';
import { useAuth } from '../auth/AuthContext';
import { AppPageShell } from '../components/AppPageShell';
import { FormField } from '../components/FormField';
import { formatBrazilianPhone } from '../utils/formatters';

export const AccountPage = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: formatBrazilianPhone(user?.phone || ''),
    email: user?.email || '',
    currentPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailChanged = form.email.trim().toLowerCase() !== user?.email;

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setMessage('');
    setErrors({});
    setSubmitting(true);
    try {
      const response = await api<{ message: string; user: User }>('/api/account', { method: 'PUT', body: JSON.stringify(form) });
      await refreshUser();
      setForm((current) => ({ ...current, currentPassword: '' }));
      setMessage(response.message);
    } catch (error) {
      const apiError = error as ApiError;
      setMessage(apiError.message);
      setErrors(apiError.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageShell eyebrow="PERFIL" title="Minha conta">
      <section className="settings-card">
        {message ? <div className={Object.keys(errors).length ? 'form-alert form-alert-error' : 'form-alert form-alert-success'}>{message}</div> : null}
        <form className="settings-form" onSubmit={submit}>
          <FormField label="Nome completo" name="name" value={form.name} onChange={(event) => update('name', event.target.value)} error={errors.name} autoComplete="name" required />
          <FormField label="Telefone com WhatsApp" name="phone" type="tel" value={form.phone} onChange={(event) => update('phone', formatBrazilianPhone(event.target.value))} error={errors.phone} autoComplete="tel" required />
          <FormField label="E-mail" name="email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} error={errors.email} autoComplete="email" required />
          {emailChanged ? <FormField label="Senha atual" name="currentPassword" type="password" value={form.currentPassword} onChange={(event) => update('currentPassword', event.target.value)} error={errors.currentPassword} hint="Necessária para confirmar a alteração do e-mail." autoComplete="current-password" required /> : null}
          <div className="readonly-details"><div><span>Perfil</span><strong>{user?.role === 'admin' ? 'Administrador' : 'Agente'}</strong></div><div><span>Status</span><strong>Ativo</strong></div></div>
          <button className="auth-submit settings-submit" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Salvar alterações'}</button>
        </form>
      </section>
    </AppPageShell>
  );
};
