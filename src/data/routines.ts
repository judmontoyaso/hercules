import type { Routine } from '../types/workout';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'routine-legs-abs-home',
    title: 'Pierna & Abdomen: Fuerza y Tensión Mecánica',
    subtitle: 'Entrenamiento completo en casa con mancuernas y discos',
    description: 'Rutina científicamente estructurada para generar hipertrofia muscular en el tren inferior y blindaje de la pared abdominal mediante ejercicios poliarticulares, unilaterales y patrones de anti-rotación y anti-extensión.',
    durationMinutes: 50,
    level: 'Intermedio / Pro',
    targetFocus: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Transverso y Oblicuos'],
    equipmentNeeded: ['Mancuernas ajustables', 'Discos (1.25, 2.5, 5 kg)', 'Banco o silla firme', 'Esterilla o toalla'],
    warmupNotes: [
      '5 min de movilidad articular de tobillos y caderas: Rotaciones pélvicas y 10 sentadillas profundas sin peso aguantando 2 segundos abajo.',
      'Activación de glúteo: 2 series de 12 repeticiones de puente de glúteos en el suelo.',
      'Serie de aproximación con el 40% del peso en Sentadilla Copa antes de iniciar las series efectivas.'
    ],
    exercises: [
      {
        exerciseId: 'goblet-squat',
        targetSets: 4,
        targetReps: '10 - 12 reps',
        suggestedWeightKg: 15,
        notes: 'Pausa isométrica de 1 segundo en el fondo. Máxima profundidad sin retroversión pélvica.'
      },
      {
        exerciseId: 'romanian-deadlift',
        targetSets: 4,
        targetReps: '10 - 12 reps',
        suggestedWeightKg: 20,
        notes: 'Cadera hacia atrás como bisagra. Las mancuernas van pegadas rozando las espinillas.'
      },
      {
        exerciseId: 'bulgarian-split-squat',
        targetSets: 3,
        targetReps: '8 - 10 reps / lado',
        suggestedWeightKg: 12,
        notes: 'La pierna delantera hace el 90% del esfuerzo. Torso ligeramente inclinado hacia adelante.'
      },
      {
        exerciseId: 'standing-calf-raises',
        targetSets: 3,
        targetReps: '15 - 20 reps',
        suggestedWeightKg: 16,
        notes: '2 segundos de pausa en estiramiento abajo y 2 segundos apretando en la cima.'
      },
      {
        exerciseId: 'plank-pull-through',
        targetSets: 3,
        targetReps: '12 pases totales',
        suggestedWeightKg: 8,
        notes: 'Bloquea las caderas: ni un centímetro de rotación lateral al pasar el peso.'
      },
      {
        exerciseId: 'weighted-russian-twists',
        targetSets: 3,
        targetReps: '16 giros totales',
        suggestedWeightKg: 5,
        notes: 'Rotación originada en la caja torácica, no en los brazos.'
      },
      {
        exerciseId: 'deadbug-weighted',
        targetSets: 3,
        targetReps: '10 - 12 reps',
        suggestedWeightKg: 5,
        notes: 'Espalda baja 100% pegada contra el suelo en todo momento sin que pase aire.'
      }
    ]
  }
];
