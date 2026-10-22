import React, { useState } from 'react';
import { Header } from './components/Header';
import type { TabType } from './components/Header';
import { RoutineOverview } from './components/RoutineOverview';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { PlateCalculator } from './components/PlateCalculator';
import { WorkoutHistory } from './components/WorkoutHistory';
import { WorkoutRunner } from './components/WorkoutRunner';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { PoseTracker } from './components/PoseTracker';
import { DEFAULT_ROUTINES } from './data/routines';
import type { Exercise, WorkoutSession } from './types/workout';
import { Trophy } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('rutina');
  const [selectedExerciseForCamera, setSelectedExerciseForCamera] = useState<string>('goblet-squat');
  const [isWorkoutRunning, setIsWorkoutRunning] = useState<boolean>(false);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  const [completedSessionResult, setCompletedSessionResult] = useState<WorkoutSession | null>(null);

  const mainRoutine = DEFAULT_ROUTINES[0];

  const handleStartWorkout = () => {
    setIsWorkoutRunning(true);
  };

  const handleFinishWorkout = (session: WorkoutSession) => {
    setIsWorkoutRunning(false);
    setCompletedSessionResult(session);
    setCurrentTab('historial');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#050811' }}>
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        isWorkoutActive={isWorkoutRunning}
        onReturnToWorkout={() => setIsWorkoutRunning(true)}
      />

      {/* Main Container */}
      <main style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1, boxSizing: 'border-box' }}>
        {isWorkoutRunning ? (
          <WorkoutRunner
            routine={mainRoutine}
            onFinishWorkout={handleFinishWorkout}
            onExit={() => setIsWorkoutRunning(false)}
          />
        ) : (
          <>
            {currentTab === 'rutina' && (
              <RoutineOverview
                routine={mainRoutine}
                onStartWorkout={handleStartWorkout}
                onOpenExerciseDetail={(ex) => setSelectedExerciseForModal(ex)}
              />
            )}

            {currentTab === 'camara' && (
              <PoseTracker
                initialExerciseId={selectedExerciseForCamera}
              />
            )}

            {currentTab === 'biblioteca' && (
              <ExerciseLibrary
                onSelectExercise={(ex) => setSelectedExerciseForModal(ex)}
              />
            )}

            {currentTab === 'calculadora' && (
              <div style={{ maxWidth: 650, margin: '0 auto' }}>
                <PlateCalculator initialTargetKg={15} />
              </div>
            )}

            {currentTab === 'historial' && (
              <WorkoutHistory
                onStartFirstWorkout={handleStartWorkout}
              />
            )}
          </>
        )}
      </main>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExerciseForModal}
        onClose={() => setSelectedExerciseForModal(null)}
        onOpenPoseTracker={(ex) => {
          setSelectedExerciseForCamera(ex.id);
          setCurrentTab('camara');
        }}
        onSelectExerciseForSession={() => {
          setSelectedExerciseForModal(null);
          setIsWorkoutRunning(true);
        }}
      />

      {/* Session Completed Celebratory Modal */}
      {completedSessionResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.88)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setCompletedSessionResult(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#0B0F19',
              border: '1px solid #10B981',
              borderRadius: 4,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#064E3B',
                color: '#10B981',
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trophy size={24} />
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}>
              Entrenamiento Completado
            </h2>

            <p style={{ margin: '0 0 20px 0', fontSize: 13, color: '#94A3B8' }}>
              Has finalizado la sesión de {completedSessionResult.routineTitle}.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: '#090D16',
                border: '1px solid #1E293B',
                borderRadius: 4,
                padding: 14,
                marginBottom: 20
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>
                  DURACIÓN
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                  {Math.floor(completedSessionResult.durationSeconds / 60)}m {completedSessionResult.durationSeconds % 60}s
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>
                  VOLUMEN TOTAL
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>
                  {completedSessionResult.totalVolumeKg} kg
                </span>
              </div>
            </div>

            <button
              onClick={() => setCompletedSessionResult(null)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#0284C7',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Ver en Historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
