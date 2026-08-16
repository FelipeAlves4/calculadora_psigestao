import { FormEvent, useState } from 'react';
import { api, ApiError } from '../auth/api';
import { AppPageShell } from '../components/AppPageShell';
import { FormField } from '../components/FormField';

export const ChangePasswordPage = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', passwordConfirmation: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setMessage('');
    setSuccess(false);
    setSubmitting(true);
    try {
      const response = await api<{ message: string }>('/api/account/change-password', { method: 'POST', body: JSON.stringify(form) });
      setMessage(response.message);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', passwordConfirmation: '' });
    } catch (error) {
      setMessage((error as ApiError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageShell eyebrow="SEGURANÇA" title="Alterar senha">
      <section className="settings-card">
        {message ? <div className={success ? 'form-alert form-alert-success' : 'form-alert form-alert-error'}>{message}</div> : null}
        <form className="settings-form" onSubmit={submit}>
          <FormField label="Senha atual" name="currentPassword" type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} autoComplete="current-password" required />
          <FormField label="Nova senha" name="newPassword" type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número." autoComplete="new-password" required />
          <FormField label="Confirmação da nova senha" name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} autoComplete="new-password" required />
          <button className="auth-submit settings-submit" type="submit" disabled={submitting}>{submitting ? 'Alterando…' : 'Alterar senha'}</button>
        </form>
      </section>
    </AppPageShell>
  );
};
