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
  groupCount: 0,
  peoplePerGroup: 0,
  groupPrice: 0,
  groupMeetings: 4,
  groupDuration: 1.5,
  individualPrice: 180,
  individualPatients: 20,
  individualSessions: 4,
  individualDuration: 1,
  fixedIncome: 0,
  expenses: { rent: 1200, transport: 500, food: 400, taxes: 600, other: 300 },
});

export const exampleProjectedPsychologistScenario = (): PsychologistScenario => ({
  groupCount: 3,
  peoplePerGroup: 8,
  groupPrice: 90,
  groupMeetings: 4,
  groupDuration: 1.5,
  individualPrice: 180,
  individualPatients: 12,
  individualSessions: 4,
  individualDuration: 1,
  fixedIncome: 0,
  expenses: { rent: 1200, transport: 500, food: 400, taxes: 800, other: 300 },
});
