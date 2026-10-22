import React, { useState } from 'react';
import type { Exercise } from '../types/workout';
import { BiomechanicalSimulation } from './BiomechanicalSimulation';
import { PlateCalculator } from './PlateCalculator';
import {
  X,
  Play,
  Zap,
  Video,
  ListChecks,
  AlertTriangle,
  Lightbulb,
  Wind,
  Shield,
  Dumbbell,
  Camera
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onSelectExerciseForSession?: (exercise: Exercise) => void;
  onOpenPoseTracker?: (exercise: Exercise) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onSelectExerciseForSession,
  onOpenPoseTracker
}) => {
  if (!exercise) return null;

  const [activeTab, setActiveTab] = useState<'simulacion' | 'video' | 'tecnica' | 'discos'>('simulacion');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          background: '#0B0F19',
          border: '1px solid #1E293B',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            background: '#0F172A',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 2,
                  background: exercise.muscleGroup === 'pierna' ? '#1E3A8A' : '#701A75',
                  color: exercise.muscleGroup === 'pierna' ? '#93C5FD' : '#F472B6',
                  border: '1px solid #334155'
                }}
              >
                {exercise.muscleGroup}
              </span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 2,
                  background: '#1E293B',
                  color: '#38BDF8',
                  border: '1px solid #334155'
                }}
              >
                {exercise.category}
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Nivel: {exercise.difficulty}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
              {exercise.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: 3,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            background: '#090D16',
            borderBottom: '1px solid #1E293B',
            padding: '0 12px'
          }}
        >
          {[
            { id: 'simulacion', label: 'Simulación Biomecánica', icon: Zap },
            { id: 'video', label: 'Video Demostrativo', icon: Video },
            { id: 'tecnica', label: 'Técnica & Respiración', icon: ListChecks },
            { id: 'discos', label: 'Armar Mancuerna', icon: Dumbbell }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #38BDF8' : '2px solid transparent',
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* TAB 1: SIMULACION */}
          {activeTab === 'simulacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <BiomechanicalSimulation
                type={exercise.simulationType}
                exerciseName={exercise.name}
                tempo={exercise.tempo}
              />

              {/* Anatomy Summary Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  background: '#0F172A',
                  padding: 12,
                  borderRadius: 4,
                  border: '1px solid #1E293B'
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    MÚSCULOS MOTORES PRIMARIOS:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {exercise.targetMuscles.map((m, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#F59E0B',
                          background: '#1E293B',
                          padding: '2px 6px',
                          borderRadius: 2
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                    ESTABILIZADORES & SINERGISTAS:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {exercise.secondaryMuscles.map((m, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#38BDF8',
                          background: '#1E293B',
                          padding: '2px 6px',
                          borderRadius: 2
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                {exercise.summary}
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO DEMO */}
          {activeTab === 'video' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {exercise.videoEmbedId ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%', // 16:9
                    height: 0,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid #1E293B'
                  }}
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${exercise.videoEmbedId}?rel=0&modestbranding=1`}
                    title={`Video: ${exercise.name}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: 30,
                    textAlign: 'center',
                    background: '#0F172A',
                    borderRadius: 4,
                    border: '1px solid #1E293B',
                    color: '#94A3B8'
                  }}
                >
                  Demostración en video no disponible. Consulta la simulación biomecánica interactiva.
                </div>
              )}

              <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC', display: 'block', marginBottom: 6 }}>
                  Puntos a observar en el video:
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                  <li>Trayectoria de la carga estrictamente vertical para minimizar torque lesivo.</li>
                  <li>Ritmo cadenciado: descenso controlado sin rebote en el punto inferior.</li>
                  <li>Posición del cuello alineada con la columna torácica durante todo el rango.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: TECNICA & RESPIRACION */}
          {activeTab === 'tecnica' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Setup */}
              <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Shield size={14} /> Posición Inicial & Setup
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>
                  {exercise.setup.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Execution */}
              <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Play size={14} /> Ejecución Paso a Paso
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#E2E8F0', lineHeight: 1.6 }}>
                  {exercise.execution.map((e, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{e}</li>
                  ))}
                </ul>
              </div>

              {/* Breathing */}
              <div style={{ background: '#090D16', border: '1px solid #1E3A8A', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Wind size={14} /> Protocolo de Respiración & Maniobra de Valsalva
                </span>
                <p style={{ margin: 0, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                  {exercise.breathing}
                </p>
              </div>

              {/* Common Mistakes */}
              <div style={{ background: '#0F172A', border: '1px solid #7F1D1D', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={14} /> Errores Frecuentes a Evitar
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#FCA5A5', lineHeight: 1.6 }}>
                  {exercise.commonMistakes.map((m, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Pro Tips */}
              <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 4, padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Lightbulb size={14} /> Pro-Tips de Hipertrofia
                </span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#A7F3D0', lineHeight: 1.6 }}>
                  {exercise.proTips.map((tip, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: CALCULADORA DE DISCOS */}
          {activeTab === 'discos' && (
            <PlateCalculator initialTargetKg={15} />
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 18px',
            background: '#0F172A',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Series recomendadas: <strong style={{ color: '#F8FAFC' }}>{exercise.recommendedSets}</strong> | Reps: <strong style={{ color: '#F8FAFC' }}>{exercise.recommendedReps}</strong> | Descanso: <strong style={{ color: '#F8FAFC' }}>{exercise.restSeconds}s</strong>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: '#1E293B',
                color: '#CBD5E1',
                border: '1px solid #334155',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Cerrar
            </button>
            {onOpenPoseTracker && (
              <button
                onClick={() => {
                  onOpenPoseTracker(exercise);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  background: '#1E293B',
                  color: '#38BDF8',
                  border: '1px solid #38BDF8',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <Camera size={14} />
                <span>Cámara IA</span>
              </button>
            )}
            {onSelectExerciseForSession && (
              <button
                onClick={() => {
                  onSelectExerciseForSession(exercise);
                  onClose();
                }}
                style={{
                  padding: '6px 14px',
                  background: '#0284C7',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Entrenar Este Ejercicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
