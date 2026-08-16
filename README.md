# Calculadora de Resultados ASEX Educação

Aplicação web responsiva e protegida para os agentes de expansão compararem o cenário financeiro atual de um atendimento com um cenário projetado.

## Como executar

1. Copie `.env.example` para `.env`, preencha `AUTH_SECRET` e os dados do administrador inicial. O comando de desenvolvimento usa `LOCAL_DATABASE_URL=./data/asex.db`, mantendo o banco de produção separado.

2. Instale as dependências:

```bash
npm install
```

3. Rode o frontend e a API de desenvolvimento:

```bash
npm run dev
```

4. Gere a versão de produção e inicie o servidor:

```bash
npm run build
npm start
```

## Publicação na Vercel com Supabase

O desenvolvimento local usa SQLite. Na Vercel, configure o PostgreSQL do Supabase por meio das variáveis de ambiente do projeto:

- `DATABASE_URL`: URI **Transaction pooler** obtida em **Connect** no Supabase, já com a senha do banco no lugar de `[YOUR-PASSWORD]`.
- `APP_URL`: `https://calculadora-asex-educacao.vercel.app`
- `AUTH_SECRET`: segredo longo e aleatório, diferente de qualquer senha de usuário.
- `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PHONE`, `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD`: dados do primeiro administrador.
- `EMAIL_FROM` e `EMAIL_API_KEY`: opcionais; necessários para enviar a recuperação de senha por e-mail.

As tabelas são inicializadas automaticamente pelo servidor. A migração equivalente também fica versionada em `supabase/migrations/20260718_auth.sql`.

Nunca adicione a senha do banco, `AUTH_SECRET`, senha administrativa ou chaves de e-mail ao repositório.

## Recursos

- Dois cenários financeiros sincronizados: atual e projetado.
- Campos em reais, percentuais e sliders com atualização imediata.
- Cadastro detalhado de despesas fixas e operacionais.
- Cards comparativos, tabela de variações e gráficos em tempo real.
- Preenchimento com exemplo, limpeza dos dados, impressão/PDF, tela cheia e modo apresentação.
- Login seguro de agentes e administradores, cadastro separado e recuperação de senha.
- Painel administrativo para perfis e bloqueios de acesso.
- Conta e alteração de senha do usuário autenticado.

## Privacidade

Os valores da calculadora existem somente no estado em memória da página. Eles não são enviados à API, não são gravados no banco e não usam `localStorage`, `sessionStorage`, cookies ou outros mecanismos de persistência do navegador.

O banco armazena apenas usuários, sessões, tokens temporários de recuperação e dados técnicos de proteção contra abuso.
