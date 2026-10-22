import React from 'react';
import type { WorkoutSession } from '../types/workout';
import { getStoredWorkoutSessions } from '../utils/storage';
import { EXERCISES } from '../data/exercises';
import { Calendar, Clock, Dumbbell, CheckCircle2, TrendingUp, Trophy } from 'lucide-react';

interface WorkoutHistoryProps {
  onStartFirstWorkout: () => void;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ onStartFirstWorkout }) => {
  const sessions: WorkoutSession[] = getStoredWorkoutSessions();

  const totalVolumeAllTime = sessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const totalCompletedSessions = sessions.filter((s) => s.completed).length;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12
        }}
      >
        <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Trophy size={16} color="#F59E0B" />
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>
              Sesiones Completadas
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC' }}>
            {totalCompletedSessions}
          </span>
        </div>

        <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Dumbbell size={16} color="#38BDF8" />
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>
              Volumen Total Levantado
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC' }}>
            {totalVolumeAllTime.toLocaleString()} kg
          </span>
        </div>

        <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <TrendingUp size={16} color="#10B981" />
            <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>
              Consistencia & Frecuencia
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>
            {sessions.length > 0 ? 'Activo' : 'Comienza hoy'}
          </span>
        </div>
      </div>

      {/* History Log List */}
      <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
          Registro Histórico de Sesiones
        </h3>

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: 13 }}>
              Aún no has registrado ningún entrenamiento completado.
            </p>
            <button
              onClick={onStartFirstWorkout}
              style={{
                padding: '8px 16px',
                background: '#0284C7',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12
              }}
            >
              Comenzar la Rutina de Pierna y Abdomen
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((sess) => {
              const completedSetsCount = Object.values(sess.exerciseLogs).reduce(
                (sum, e) => sum + e.sets.filter((s) => s.completed).length,
                0
              );

              return (
                <div
                  key={sess.id}
                  style={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: 4,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} /> {formatDate(sess.startTime)}
                      </span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
                        {sess.routineTitle}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CBD5E1' }}>
                        <Clock size={14} color="#38BDF8" />
                        <span>{formatDuration(sess.durationSeconds)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CBD5E1' }}>
                        <Dumbbell size={14} color="#F59E0B" />
                        <span>{sess.totalVolumeKg} kg volumen</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
                        <CheckCircle2 size={14} />
                        <span>{completedSetsCount} series</span>
                      </div>
                    </div>
                  </div>

                  {/* Exercises completed pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid #1E293B', paddingTop: 8 }}>
                    {Object.entries(sess.exerciseLogs).map(([exId, log]) => {
                      const ex = EXERCISES.find((e) => e.id === exId);
                      const doneSets = log.sets.filter((s) => s.completed);
                      if (doneSets.length === 0) return null;

                      const topWeight = Math.max(...doneSets.map((s) => s.weightKg));

                      return (
                        <span
                          key={exId}
                          style={{
                            fontSize: 11,
                            background: '#1E293B',
                            color: '#CBD5E1',
                            padding: '3px 8px',
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <strong style={{ color: '#F8FAFC' }}>{ex?.name.split(' ')[0]}</strong>
                          <span>({doneSets.length} series @ {topWeight}kg)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
