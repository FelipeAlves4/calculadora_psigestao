import { IndicatorConfig } from '../types/financial';

export const INDICATOR_CONFIG: IndicatorConfig[] = [
  {
    key: 'cmv',
    label: 'CMV',
    description: 'Custo da mercadoria vendida.',
    min: 0,
    max: 50,
    step: 0.1,
    positiveWhenLower: true,
  },
  {
    key: 'waste',
    label: 'Desperdício',
    description: 'Perdas com alimentos, insumos, produção, vencimentos, sobras e descarte.',
    min: 0,
    max: 20,
    step: 0.1,
    positiveWhenLower: true,
  },
  {
    key: 'turnover',
    label: 'Rotatividade da equipe',
    description: 'Custos com desligamentos, contratações, treinamento, baixa produtividade e reposição.',
    min: 0,
    max: 20,
    step: 0.1,
    positiveWhenLower: true,
  },
  {
    key: 'payroll',
    label: 'Folha de pagamento',
    description: 'Salarios, beneficios, encargos e demais custos mensais da equipe.',
    min: 0,
    max: 50,
    step: 0.1,
    positiveWhenLower: true,
  },
  {
    key: 'operationalExpenses',
    label: 'Despesas fixas e operacionais',
    description: 'Custos mensais para manter a operação: aluguel, água, energia, sistemas e outras despesas.',
    min: 0,
    max: 50,
    step: 0.1,
    positiveWhenLower: true,
  },
  {
    key: 'taxes',
    label: 'Impostos',
    description: 'Total mensal pago em tributos.',
    min: 0,
    max: 30,
    step: 0.1,
    positiveWhenLower: true,
  },
];

export const REVENUE_DESCRIPTION = 'Receita bruta mensal do negócio.';
