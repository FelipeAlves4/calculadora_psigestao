import { PsychologistScenario } from '../types/psychologist';

export const createEmptyPsychologistScenario = (): PsychologistScenario => ({
  groupCount: 0,
  peoplePerGroup: 0,
  groupPrice: 0,
  groupMeetings: 0,
  groupDuration: 0,
  individualPrice: 0,
  individualPatients: 0,
  individualSessions: 0,
  individualDuration: 0,
  fixedIncome: 0,
  expenses: { rent: 0, transport: 0, food: 0, taxes: 0, other: 0 },
});

export const exampleCurrentPsychologistScenario = (): PsychologistScenario => ({
  groupCount: 2,
  peoplePerGroup: 5,
  groupPrice: 200,
  groupMeetings: 4,
  groupDuration: 2,
  individualPrice: 160,
  individualPatients: 10,
  individualSessions: 4,
  individualDuration: 1.6,
  fixedIncome: 0,
  expenses: { rent: 1500, transport: 500, food: 400, taxes: 400, other: 200 },
});

export const exampleProjectedPsychologistScenario = (): PsychologistScenario => ({
  groupCount: 3,
  peoplePerGroup: 8,
  groupPrice: 150,
  groupMeetings: 4,
  groupDuration: 1.5,
  individualPrice: 120,
  individualPatients: 12,
  individualSessions: 2,
  individualDuration: 2,
  fixedIncome: 0,
  expenses: { rent: 1500, transport: 500, food: 400, taxes: 600, other: 200 },
});
