import { PsychologistComparisonRow, PsychologistResults, PsychologistScenario } from '../types/psychologist';
import { roundMoney, roundPercentage } from './calculations';
import { toFiniteNumber } from './formatters';

const number = (value: unknown) => Math.max(0, toFiniteNumber(value));
const wholeNumber = (value: unknown) => Math.round(number(value));

export const sanitizePsychologistScenario = (scenario: PsychologistScenario): PsychologistScenario => ({
  ...scenario,
  groupCount: wholeNumber(scenario.groupCount), peoplePerGroup: wholeNumber(scenario.peoplePerGroup),
  groupPrice: number(scenario.groupPrice), groupMeetings: wholeNumber(scenario.groupMeetings), groupDuration: number(scenario.groupDuration),
  individualPrice: number(scenario.individualPrice), individualPatients: wholeNumber(scenario.individualPatients),
  individualSessions: wholeNumber(scenario.individualSessions), individualDuration: number(scenario.individualDuration),
  fixedIncome: number(scenario.fixedIncome),
  expenses: {
    rent: number(scenario.expenses.rent), transport: number(scenario.expenses.transport), food: number(scenario.expenses.food),
    taxes: number(scenario.expenses.taxes), other: number(scenario.expenses.other),
  },
});

export const calculatePsychologistScenario = (input: PsychologistScenario): PsychologistResults => {
  const scenario = sanitizePsychologistScenario(input);
  const groupRevenue = roundMoney(scenario.groupCount * scenario.peoplePerGroup * scenario.groupPrice * scenario.groupMeetings);
  const individualRevenue = roundMoney(scenario.individualPrice * scenario.individualPatients * scenario.individualSessions);
  const revenue = roundMoney(groupRevenue + individualRevenue + scenario.fixedIncome);
  const totalCosts = roundMoney(Object.values(scenario.expenses).reduce((total, value) => total + value, 0));
  const monthlyProfit = roundMoney(revenue - totalCosts);
  const groupHours = roundMoney(scenario.groupCount * scenario.groupMeetings * scenario.groupDuration);
  const individualHours = roundMoney(scenario.individualPatients * scenario.individualSessions * scenario.individualDuration);
  const totalHours = roundMoney(groupHours + individualHours);
  const groupLives = scenario.groupCount * scenario.peoplePerGroup;
  const individualLives = scenario.individualPatients;
  const livesImpacted = groupLives + individualLives;
  return {
    groupRevenue, individualRevenue, fixedIncome: scenario.fixedIncome, revenue, totalCosts, monthlyProfit,
    annualProfit: roundMoney(monthlyProfit * 12), groupHours, individualHours, totalHours, groupLives,
    individualLives, livesImpacted, hourlyGain: totalHours > 0 ? roundMoney(monthlyProfit / totalHours) : 0,
    profitMargin: revenue > 0 ? roundPercentage((monthlyProfit / revenue) * 100) : 0,
  };
};

const variation = (current: number, projected: number) => current === 0 ? (projected === 0 ? 0 : null) : roundPercentage(((projected - current) / Math.abs(current)) * 100);
const status = (difference: number, lowerIsBetter = false): PsychologistComparisonRow['status'] =>
  Math.abs(difference) < 0.0001 ? 'neutral' : ((difference > 0) !== lowerIsBetter ? 'positive' : 'negative');

export const buildPsychologistComparisonRows = (current: PsychologistResults, projected: PsychologistResults): PsychologistComparisonRow[] => {
  const definitions: Array<[string, string, keyof PsychologistResults, PsychologistComparisonRow['format'], boolean?]> = [
    ['groupRevenue', 'Receita com grupos', 'groupRevenue', 'currency'], ['individualRevenue', 'Receita individual', 'individualRevenue', 'currency'],
    ['revenue', 'Faturamento mensal', 'revenue', 'currency'], ['totalCosts', 'Custos mensais', 'totalCosts', 'currency', true],
    ['monthlyProfit', 'Resultado mensal', 'monthlyProfit', 'currency'], ['annualProfit', 'Resultado anual', 'annualProfit', 'currency'],
    ['totalHours', 'Horas trabalhadas', 'totalHours', 'hours', true], ['livesImpacted', 'Vidas impactadas', 'livesImpacted', 'number'],
    ['hourlyGain', 'Ganho por hora', 'hourlyGain', 'currency'], ['profitMargin', 'Margem de resultado', 'profitMargin', 'percentage'],
  ];
  return definitions.map(([key, label, resultKey, format, lowerIsBetter]) => {
    const currentValue = current[resultKey] as number;
    const projectedValue = projected[resultKey] as number;
    const difference = format === 'percentage' ? roundPercentage(projectedValue - currentValue) : roundMoney(projectedValue - currentValue);
    return { key, label, current: currentValue, projected: projectedValue, difference, variation: variation(currentValue, projectedValue), format, status: status(difference, lowerIsBetter) };
  });
};

export const projectionSummary = (current: PsychologistResults, projected: PsychologistResults) => {
  const monthlyDifference = projected.monthlyProfit - current.monthlyProfit;
  const hoursDifference = projected.totalHours - current.totalHours;
  const livesDifference = projected.livesImpacted - current.livesImpacted;
  if (!monthlyDifference && !hoursDifference && !livesDifference) return 'Com base nos valores informados, os dois cenários apresentam o mesmo resultado estimado.';
  const result = monthlyDifference >= 0 ? `aumentar seu resultado mensal em R$ ${monthlyDifference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `reduzir seu resultado mensal em R$ ${Math.abs(monthlyDifference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const hours = hoursDifference < 0 ? `trabalhar ${Math.abs(hoursDifference).toLocaleString('pt-BR')} horas a menos` : hoursDifference > 0 ? `trabalhar ${hoursDifference.toLocaleString('pt-BR')} horas a mais` : 'manter as mesmas horas de trabalho';
  const lives = livesDifference > 0 ? `impactar ${livesDifference} pessoas a mais por mês` : livesDifference < 0 ? `impactar ${Math.abs(livesDifference)} pessoas a menos por mês` : 'manter o mesmo impacto mensal';
  return `No cenário projetado, você pode ${result}, ${hours} e ${lives}, com base nos valores informados.`;
};
