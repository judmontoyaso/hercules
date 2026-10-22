import React, { useState, useEffect } from 'react';
import type { Routine, Exercise, WorkoutSession, SetLog, ExerciseSessionLog } from '../types/workout';
import { EXERCISES } from '../data/exercises';
import { audioEngine } from '../utils/audio';
import { saveWorkoutSession } from '../utils/storage';
import { BiomechanicalSimulation } from './BiomechanicalSimulation';
import { PlateCalculator } from './PlateCalculator';
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Zap,
  Video,
  ListChecks,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

interface WorkoutRunnerProps {
  routine: Routine;
  onFinishWorkout: (session: WorkoutSession) => void;
  onExit: () => void;
}

export const WorkoutRunner: React.FC<WorkoutRunnerProps> = ({
  routine,
  onFinishWorkout,
  onExit
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSessionPaused, setIsSessionPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Rest Timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(90);

  // Active view inside runner (simulacion, video, tecnica, discos)
  const [exerciseViewMode, setExerciseViewMode] = useState<'simulacion' | 'video' | 'tecnica' | 'discos'>('simulacion');

  // Logs for current session
  const [sessionLogs, setSessionLogs] = useState<Record<string, ExerciseSessionLog>>(() => {
    const initial: Record<string, ExerciseSessionLog> = {};
    routine.exercises.forEach((item) => {
      const sets: SetLog[] = Array.from({ length: item.targetSets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: item.suggestedWeightKg || 12,
        reps: parseInt(item.targetReps.split('-')[0]) || 10,
        completed: false
      }));
      initial[item.exerciseId] = {
        exerciseId: item.exerciseId,
        sets
      };
    });
    return initial;
  });

  // Elapsed timer tick
  useEffect(() => {
    if (isSessionPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionPaused]);

  // Rest timer tick & audio cues
  useEffect(() => {
    if (restSecondsLeft === null) return;
    if (restSecondsLeft <= 0) {
      audioEngine.playCompleteChime();
      setRestSecondsLeft(null);
      return;
    }

    if (restSecondsLeft <= 3 && restSecondsLeft > 0) {
      audioEngine.playTick();
    }

    const timer = setTimeout(() => {
      setRestSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [restSecondsLeft]);

  const currentRoutineExercise = routine.exercises[currentExerciseIndex];
  const currentExerciseData: Exercise | undefined = EXERCISES.find(
    (e) => e.id === currentRoutineExercise.exerciseId
  );

  const currentLogs = sessionLogs[currentRoutineExercise.exerciseId]?.sets || [];

  const handleToggleSetComplete = (setIdx: number) => {
    const updated = { ...sessionLogs };
    const currentSets = [...updated[currentRoutineExercise.exerciseId].sets];
    const willBeCompleted = !currentSets[setIdx].completed;
    currentSets[setIdx].completed = willBeCompleted;
    updated[currentRoutineExercise.exerciseId].sets = currentSets;
    setSessionLogs(updated);

    if (willBeCompleted) {
      audioEngine.playSetComplete();
      // Start rest timer automatically
      const rest = currentExerciseData?.restSeconds || 90;
      setRestTotalSeconds(rest);
      setRestSecondsLeft(rest);
    }
  };

  const handleUpdateSetWeight = (setIdx: number, weightKg: number) => {
    const updated = { ...sessionLogs };
    updated[currentRoutineExercise.exerciseId].sets[setIdx].weightKg = weightKg;
    setSessionLogs(updated);
  };

  const handleUpdateSetReps = (setIdx: number, reps: number) => {
    const updated = { ...sessionLogs };
    updated[currentRoutineExercise.exerciseId].sets[setIdx].reps = reps;
    setSessionLogs(updated);
  };

  const handleAddSet = () => {
    const updated = { ...sessionLogs };
    const sets = updated[currentRoutineExercise.exerciseId].sets;
    const lastSet = sets[sets.length - 1];
    sets.push({
      setNumber: sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 12,
      reps: lastSet ? lastSet.reps : 10,
      completed: false
    });
    setSessionLogs(updated);
  };

  const handleRemoveSet = (setIdx: number) => {
    const updated = { ...sessionLogs };
    if (updated[currentRoutineExercise.exerciseId].sets.length <= 1) return;
    updated[currentRoutineExercise.exerciseId].sets.splice(setIdx, 1);
    // renumber
    updated[currentRoutineExercise.exerciseId].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setSessionLogs(updated);
  };

  // Calculate volume lifted
  const totalVolumeKg = Object.values(sessionLogs).reduce((acc, exerciseLog) => {
    const exSum = exerciseLog.sets
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    return acc + exSum;
  }, 0);

  const totalSetsCompleted = Object.values(sessionLogs).reduce((acc, exerciseLog) => {
    return acc + exerciseLog.sets.filter((s) => s.completed).length;
  }, 0);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const finishSession = () => {
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      routineId: routine.id,
      routineTitle: routine.title,
      startTime: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      exerciseLogs: sessionLogs,
      completed: true,
      totalVolumeKg
    };
    saveWorkoutSession(session);
    onFinishWorkout(session);
  };

  if (!currentExerciseData) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Session Status Bar */}
      <div
        style={{
          background: '#090D16',
          border: '1px solid #1E293B',
          borderRadius: 4,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color="#38BDF8" />
            <span style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, color: '#F8FAFC' }}>
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={() => setIsSessionPaused(!isSessionPaused)}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 3,
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            {isSessionPaused ? 'Reanudar' : 'Pausar'}
          </button>
        </div>

        {/* Volume & sets KPIs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dumbbell size={14} color="#F59E0B" />
            <span style={{ color: '#94A3B8' }}>Volumen:</span>
            <strong style={{ color: '#F8FAFC' }}>{totalVolumeKg} kg</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="#10B981" />
            <span style={{ color: '#94A3B8' }}>Series listas:</span>
            <strong style={{ color: '#F8FAFC' }}>{totalSetsCompleted}</strong>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              audioEngine.setSoundEnabled(next);
            }}
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              color: soundEnabled ? '#38BDF8' : '#64748B',
              padding: '4px 8px',
              borderRadius: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11
            }}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <button
            onClick={finishSession}
            style={{
              padding: '6px 14px',
              background: '#10B981',
              color: '#064E3B',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Finalizar Entrenamiento
          </button>

          <button
            onClick={onExit}
            style={{
              padding: '6px 10px',
              background: '#1E293B',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Rest Timer Floating/Sticky Bar (Active when rest timer running) */}
      {restSecondsLeft !== null && (
        <div
          style={{
            background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
            border: '1px solid #38BDF8',
            borderRadius: 4,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={20} color="#38BDF8" />
            <div>
              <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', display: 'block' }}>
                DESCANSO ENTRE SERIES
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', fontFamily: 'monospace' }}>
                  {formatTime(restSecondsLeft)}
                </span>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  / {restTotalSeconds}s
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setRestSecondsLeft((prev) => (prev !== null ? prev + 30 : 30))}
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#CBD5E1',
                padding: '6px 10px',
                borderRadius: 3,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              +30s
            </button>
            <button
              onClick={() => setRestSecondsLeft(null)}
              style={{
                background: '#0284C7',
                border: 'none',
                color: '#F8FAFC',
                padding: '6px 12px',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Iniciar Siguiente Serie
            </button>
          </div>
        </div>
      )}

      {/* Routine Progress Stepper */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
        {routine.exercises.map((item, idx) => {
          const ex = EXERCISES.find((e) => e.id === item.exerciseId);
          const isCurrent = idx === currentExerciseIndex;
          const sets = sessionLogs[item.exerciseId]?.sets || [];
          const isComplete = sets.length > 0 && sets.every((s) => s.completed);

          return (
            <button
              key={item.exerciseId}
              onClick={() => setCurrentExerciseIndex(idx)}
              style={{
                flex: '1 0 130px',
                padding: '8px 10px',
                background: isCurrent ? '#1E293B' : '#0B0F19',
                border: '1px solid',
                borderColor: isCurrent ? '#38BDF8' : isComplete ? '#065F46' : '#1E293B',
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace' }}>
                  {idx + 1}/{routine.exercises.length}
                </span>
                {isComplete && <Check size={12} color="#10B981" />}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#F8FAFC' : '#94A3B8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {ex?.name.split(' ')[0]} {ex?.name.split(' ')[1]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Exercise Work Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)', gap: 16 }}>
        {/* Left Column: Visual Guide / Simulation / Video */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header Card */}
          <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#38BDF8', fontWeight: 700 }}>
                Ejercicio {currentExerciseIndex + 1} de {routine.exercises.length}
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                Descanso recomendado: {currentExerciseData.restSeconds}s
              </span>
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: 19, fontWeight: 700, color: '#F8FAFC' }}>
              {currentExerciseData.name}
            </h2>

            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
              {currentRoutineExercise.notes || currentExerciseData.summary}
            </p>
          </div>

          {/* Sub-tabs for Exercise View Mode */}
          <div style={{ display: 'flex', background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 3, gap: 4 }}>
            {[
              { id: 'simulacion', label: 'Simulación 3D', icon: Zap },
              { id: 'video', label: 'Video Demo', icon: Video },
              { id: 'tecnica', label: 'Guía Técnica', icon: ListChecks },
              { id: 'discos', label: 'Armar Mancuerna', icon: Dumbbell }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = exerciseViewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setExerciseViewMode(tab.id as typeof exerciseViewMode)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    background: isActive ? '#1E293B' : 'transparent',
                    border: 'none',
                    borderRadius: 3,
                    color: isActive ? '#38BDF8' : '#94A3B8',
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Render selected view mode */}
          {exerciseViewMode === 'simulacion' && (
            <BiomechanicalSimulation
              type={currentExerciseData.simulationType}
              exerciseName={currentExerciseData.name}
              tempo={currentExerciseData.tempo}
            />
          )}

          {exerciseViewMode === 'video' && (
            <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentExerciseData.videoEmbedId}?rel=0&modestbranding=1`}
                  title={currentExerciseData.name}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {exerciseViewMode === 'tecnica' && (
            <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12 }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: 4 }}>Protocolo de Respiración:</strong>
                <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.5 }}>{currentExerciseData.breathing}</p>
              </div>

              <div style={{ fontSize: 12 }}>
                <strong style={{ color: '#F59E0B', display: 'block', marginBottom: 4 }}>Puntos de Ejecución:</strong>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#CBD5E1', lineHeight: 1.5 }}>
                  {currentExerciseData.execution.slice(0, 3).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {exerciseViewMode === 'discos' && (
            <PlateCalculator
              initialTargetKg={currentLogs[0]?.weightKg || currentRoutineExercise.suggestedWeightKg || 15}
            />
          )}
        </div>

        {/* Right Column: Sets Logger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  Registro de Series
                </h3>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  Meta: {currentRoutineExercise.targetSets} series x {currentRoutineExercise.targetReps}
                </span>
              </div>

              <button
                onClick={handleAddSet}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: 3,
                  color: '#38BDF8',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Agregar Serie
              </button>
            </div>

            {/* Set Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '45px 1fr 1fr 65px 35px', gap: 8, padding: '4px 8px', fontSize: 11, color: '#64748B' }}>
                <span>SERIE</span>
                <span>PESO (KG)</span>
                <span>REPETICIONES</span>
                <span style={{ textAlign: 'center' }}>ESTADO</span>
                <span></span>
              </div>

              {/* Rows */}
              {currentLogs.map((set, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '45px 1fr 1fr 65px 35px',
                    gap: 8,
                    alignItems: 'center',
                    padding: '8px',
                    background: set.completed ? '#0B1F17' : '#0F172A',
                    border: '1px solid',
                    borderColor: set.completed ? '#059669' : '#1E293B',
                    borderRadius: 3
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textAlign: 'center' }}>
                    #{set.setNumber}
                  </span>

                  {/* Weight input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={set.weightKg}
                      onChange={(e) => handleUpdateSetWeight(sIdx, parseFloat(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: '#090D16',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '4px 6px',
                        borderRadius: 3,
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  {/* Reps input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="number"
                      min="1"
                      value={set.reps}
                      onChange={(e) => handleUpdateSetReps(sIdx, parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: '#090D16',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        padding: '4px 6px',
                        borderRadius: 3,
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  {/* Checkbox button */}
                  <button
                    onClick={() => handleToggleSetComplete(sIdx)}
                    style={{
                      height: 30,
                      background: set.completed ? '#10B981' : '#1E293B',
                      border: '1px solid',
                      borderColor: set.completed ? '#10B981' : '#334155',
                      borderRadius: 3,
                      color: set.completed ? '#064E3B' : '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 11
                    }}
                  >
                    {set.completed ? <Check size={16} strokeWidth={3} /> : 'Listo'}
                  </button>

                  {/* Delete set */}
                  <button
                    onClick={() => handleRemoveSet(sIdx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Eliminar serie"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
              disabled={currentExerciseIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: currentExerciseIndex === 0 ? '#0B0F19' : '#1E293B',
                color: currentExerciseIndex === 0 ? '#475569' : '#CBD5E1',
                border: '1px solid #334155',
                borderRadius: 4,
                cursor: currentExerciseIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: 12
              }}
            >
              <ChevronLeft size={15} /> Anterior
            </button>

            <button
              onClick={() => setCurrentExerciseIndex(Math.min(routine.exercises.length - 1, currentExerciseIndex + 1))}
              disabled={currentExerciseIndex === routine.exercises.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: currentExerciseIndex === routine.exercises.length - 1 ? '#0B0F19' : '#0284C7',
                color: currentExerciseIndex === routine.exercises.length - 1 ? '#475569' : '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                cursor: currentExerciseIndex === routine.exercises.length - 1 ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Siguiente <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
