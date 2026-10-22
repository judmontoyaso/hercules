import React, { useState } from 'react';
import type { Routine, Exercise } from '../types/workout';
import { EXERCISES } from '../data/exercises';
import {
  Play,
  Zap,
  ListChecks,
  Shield
} from 'lucide-react';

interface RoutineOverviewProps {
  routine: Routine;
  onStartWorkout: () => void;
  onOpenExerciseDetail: (exercise: Exercise) => void;
}

export const RoutineOverview: React.FC<RoutineOverviewProps> = ({
  routine,
  onStartWorkout,
  onOpenExerciseDetail
}) => {
  const [filterMuscle, setFilterMuscle] = useState<'todos' | 'pierna' | 'abdomen'>('todos');

  const filteredExercises = routine.exercises.filter((item) => {
    const ex = EXERCISES.find((e) => e.id === item.exerciseId);
    if (!ex) return false;
    if (filterMuscle === 'todos') return true;
    return ex.muscleGroup === filterMuscle;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Routine Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090D16 0%, #0F172A 100%)',
          border: '1px solid #1E293B',
          borderRadius: 4,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 2,
                  background: '#1E3A8A',
                  color: '#93C5FD',
                  border: '1px solid #2563EB'
                }}
              >
                RUTINA PRINCIPAL
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Nivel: <strong style={{ color: '#F8FAFC' }}>{routine.level}</strong>
              </span>
            </div>

            <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 800, color: '#F8FAFC', letterSpacing: -0.5 }}>
              {routine.title}
            </h1>
            <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#38BDF8', fontWeight: 500 }}>
              {routine.subtitle}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
              {routine.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
            <button
              onClick={onStartWorkout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#0284C7',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Play size={16} fill="#F8FAFC" />
              Comenzar Entrenamiento
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748B', padding: '0 4px' }}>
              <span>Duración estimada:</span>
              <strong style={{ color: '#CBD5E1' }}>~{routine.durationMinutes} min</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748B', padding: '0 4px' }}>
              <span>Total ejercicios:</span>
              <strong style={{ color: '#CBD5E1' }}>{routine.exercises.length} bloques</strong>
            </div>
          </div>
        </div>

        {/* Target muscles pills & Equipment requirements */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
            background: '#070A12',
            padding: 14,
            borderRadius: 4,
            border: '1px solid #1E293B'
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6 }}>
              GRUPOS MUSCULARES ESTIMULADOS:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {routine.targetFocus.map((f, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    background: '#1E293B',
                    color: '#F8FAFC',
                    padding: '3px 8px',
                    borderRadius: 2,
                    border: '1px solid #334155'
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6 }}>
              EQUIPAMIENTO EN CASA:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {routine.equipmentNeeded.map((eq, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    background: '#1E293B',
                    color: '#38BDF8',
                    padding: '3px 8px',
                    borderRadius: 2,
                    border: '1px solid #334155'
                  }}
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Warmup protocol */}
        <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 4, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Shield size={14} color="#10B981" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
              Protocolo de Calentamiento Articular & Activación (5 min)
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#CBD5E1', lineHeight: 1.6 }}>
            {routine.warmupNotes.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filter and List Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
          Bloques de Ejercicios ({filteredExercises.length})
        </h2>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['todos', 'pierna', 'abdomen'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMuscle(m)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: filterMuscle === m ? '#1E293B' : '#0B0F19',
                color: filterMuscle === m ? '#38BDF8' : '#94A3B8',
                border: '1px solid',
                borderColor: filterMuscle === m ? '#38BDF8' : '#1E293B',
                borderRadius: 3,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredExercises.map((item, idx) => {
          const ex = EXERCISES.find((e) => e.id === item.exerciseId);
          if (!ex) return null;

          return (
            <div
              key={item.exerciseId}
              style={{
                background: '#090D16',
                border: '1px solid #1E293B',
                borderRadius: 4,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'border-color 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#64748B'
                      }}
                    >
                      BLOQUE #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 2,
                        background: ex.muscleGroup === 'pierna' ? '#1E3A8A' : '#701A75',
                        color: ex.muscleGroup === 'pierna' ? '#93C5FD' : '#F472B6'
                      }}
                    >
                      {ex.muscleGroup}
                    </span>
                    <span style={{ fontSize: 11, color: '#38BDF8' }}>
                      {ex.equipment}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                    {ex.name}
                  </h3>

                  <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5, maxWidth: 680 }}>
                    {item.notes || ex.summary}
                  </p>
                </div>

                <div
                  style={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    padding: '8px 12px',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    textAlign: 'right',
                    minWidth: 120
                  }}
                >
                  <span style={{ fontSize: 11, color: '#64748B' }}>Dosis sugerida:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                    {item.targetSets} series x {item.targetReps}
                  </span>
                  <span style={{ fontSize: 11, color: '#F59E0B' }}>
                    Sugerido: ~{item.suggestedWeightKg} kg
                  </span>
                </div>
              </div>

              {/* Muscle pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>Músculos diana:</span>
                {ex.targetMuscles.map((m, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: '#1E293B',
                      color: '#CBD5E1',
                      padding: '2px 6px',
                      borderRadius: 2
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* Actions toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #1E293B',
                  paddingTop: 10
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onOpenExerciseDetail(ex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: 3,
                      color: '#38BDF8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={14} />
                    Simulación & Video
                  </button>

                  <button
                    onClick={() => onOpenExerciseDetail(ex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      background: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: 3,
                      color: '#94A3B8',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <ListChecks size={13} />
                    Técnica y Respiración
                  </button>
                </div>

                <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                  Tempo: {ex.tempo.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
