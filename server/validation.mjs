export const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const normalizeName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

export const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  return digits;
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export const isValidFullName = (name) => {
  const parts = name.split(' ').filter(Boolean);
  return name.length >= 5 && name.length <= 120 && parts.length >= 2 && parts.every((part) => part.length >= 2);
};

export const isValidBrazilianPhone = (phone) =>
  (phone.length === 10 || phone.length === 11) && /^[1-9]{2}9?\d{8}$/.test(phone);

export const passwordErrors = (password) => {
  const errors = [];
  if (typeof password !== 'string' || password.length < 8) errors.push('A senha deve ter pelo menos 8 caracteres.');
  if (!/[A-Z]/.test(password || '')) errors.push('Inclua ao menos uma letra maiúscula.');
  if (!/[a-z]/.test(password || '')) errors.push('Inclua ao menos uma letra minúscula.');
  if (!/\d/.test(password || '')) errors.push('Inclua ao menos um número.');
  return errors;
};

export const validateRegistration = (body) => {
  const name = normalizeName(body.name);
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const errors = {};

  if (!isValidFullName(name)) errors.name = 'Informe seu nome completo.';
  if (!isValidBrazilianPhone(phone)) errors.phone = 'Informe um telefone brasileiro válido.';
  if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.';
  const passwordValidation = passwordErrors(body.password);
  if (passwordValidation.length) errors.password = passwordValidation[0];
  if (body.password !== body.passwordConfirmation) errors.passwordConfirmation = 'As senhas não coincidem.';
  if (body.acceptTerms !== true) errors.acceptTerms = 'Você precisa aceitar os termos de uso e a política de privacidade.';

  return { data: { name, phone, email, password: body.password }, errors };
};
