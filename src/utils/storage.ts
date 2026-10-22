import type { PlateInventory, WorkoutSession } from '../types/workout';

export type { PlateInventory };

const STORAGE_KEYS = {
  PLATE_INVENTORY: 'hercules_plate_inventory_v1',
  WORKOUT_SESSIONS: 'hercules_workout_sessions_v1',
  APP_SETTINGS: 'hercules_settings_v1'
};

export const DEFAULT_INVENTORY: PlateInventory = {
  barbellWeightKg: 2, // Peso estándar barra corta de mancuerna con roscas
  availablePairs: [
    { weightKg: 5, countPairs: 4 },    // 4 pares de 5kg (8 discos)
    { weightKg: 2.5, countPairs: 4 },  // 4 pares de 2.5kg (8 discos)
    { weightKg: 1.25, countPairs: 4 }, // 4 pares de 1.25kg (8 discos)
    { weightKg: 0.5, countPairs: 2 }   // 2 pares de 0.5kg (4 discos)
  ]
};

export function getStoredPlateInventory(): PlateInventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLATE_INVENTORY);
    if (!raw) return DEFAULT_INVENTORY;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INVENTORY;
  }
}

export function savePlateInventory(inventory: PlateInventory): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLATE_INVENTORY, JSON.stringify(inventory));
  } catch (e) {
    console.error('Failed to save plate inventory', e);
  }
}

export function getStoredWorkoutSessions(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWorkoutSession(session: WorkoutSession): void {
  try {
    const current = getStoredWorkoutSessions();
    const updated = [session, ...current.filter((s) => s.id !== session.id)];
    localStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save workout session', e);
  }
}

// Calculate the best plate configuration for a single dumbbell
export interface PlateCalculationResult {
  targetWeightKg: number;
  actualWeightKg: number;
  barbellKg: number;
  platesPerSide: { weightKg: number; count: number }[];
  isExact: boolean;
}

export function calculatePlatesForDumbbell(
  targetWeightKg: number,
  inventory: PlateInventory
): PlateCalculationResult {
  const barKg = inventory.barbellWeightKg;
  if (targetWeightKg <= barKg) {
    return {
      targetWeightKg,
      actualWeightKg: barKg,
      barbellKg: barKg,
      platesPerSide: [],
      isExact: targetWeightKg === barKg
    };
  }

  const weightNeededTotal = targetWeightKg - barKg;
  // Weight needed on each side of the dumbbell
  const weightNeededPerSide = weightNeededTotal / 2;

  // Available plate weights sorted descending
  const sortedPairs = [...inventory.availablePairs]
    .filter((p) => p.countPairs > 0 && p.weightKg > 0)
    .sort((a, b) => b.weightKg - a.weightKg);

  let remaining = weightNeededPerSide;
  const platesPerSide: { weightKg: number; count: number }[] = [];

  for (const pair of sortedPairs) {
    if (remaining <= 0.001) break;
    const maxUsable = pair.countPairs;
    const needed = Math.floor((remaining + 0.0001) / pair.weightKg);
    const take = Math.min(needed, maxUsable);

    if (take > 0) {
      platesPerSide.push({ weightKg: pair.weightKg, count: take });
      remaining -= take * pair.weightKg;
    }
  }

  const actualPerSide = platesPerSide.reduce(
    (sum, p) => sum + p.weightKg * p.count,
    0
  );
  const actualWeightKg = barKg + actualPerSide * 2;
  const isExact = Math.abs(actualWeightKg - targetWeightKg) < 0.05;

  return {
    targetWeightKg,
    actualWeightKg,
    barbellKg: barKg,
    platesPerSide,
    isExact
  };
}
