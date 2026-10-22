export type MuscleGroup = 'pierna' | 'abdomen' | 'cuerpo_completo';

export type SimulationType =
  | 'goblet-squat'
  | 'romanian-deadlift'
  | 'bulgarian-split-squat'
  | 'calf-raise'
  | 'plank-pull-through'
  | 'russian-twist'
  | 'deadbug';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: 'Fuerza' | 'Hipertrofia' | 'Estabilidad de Core' | 'Movilidad';
  targetMuscles: string[];
  secondaryMuscles: string[];
  equipment: 'Mancuerna' | 'Disco' | 'Mancuerna o Disco' | 'Peso Corporal';
  recommendedSets: number;
  recommendedReps: string;
  restSeconds: number;
  tempo: string; // e.g., "3-1-1-0"
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  summary: string;
  setup: string[];
  execution: string[];
  breathing: string;
  commonMistakes: string[];
  proTips: string[];
  videoEmbedId?: string; // YouTube video ID for real demonstration
  simulationType: SimulationType;
}

export interface RoutineExerciseConfig {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  suggestedWeightKg: number;
  notes?: string;
}

export interface Routine {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  durationMinutes: number;
  level: string;
  targetFocus: string[];
  equipmentNeeded: string[];
  warmupNotes: string[];
  exercises: RoutineExerciseConfig[];
}

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion (6-10)
}

export interface ExerciseSessionLog {
  exerciseId: string;
  sets: SetLog[];
  completedAt?: string;
  userNotes?: string;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineTitle: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  exerciseLogs: Record<string, ExerciseSessionLog>;
  completed: boolean;
  totalVolumeKg: number;
}

export interface PlateInventory {
  barbellWeightKg: number; // Peso de la barra vacía de la mancuerna (ej. 2kg)
  availablePairs: {
    weightKg: number;
    countPairs: number; // Número de pares disponibles (cada par sirve para 1 mancuerna con 2 lados)
  }[];
}
