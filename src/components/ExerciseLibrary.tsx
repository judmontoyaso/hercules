import React, { useState } from 'react';
import type { Exercise } from '../types/workout';
import { EXERCISES } from '../data/exercises';
import { Search, Zap } from 'lucide-react';

interface ExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ onSelectExercise }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [muscleFilter, setMuscleFilter] = useState<'todos' | 'pierna' | 'abdomen'>('todos');
  const [equipmentFilter, setEquipmentFilter] = useState<'todos' | 'mancuerna' | 'disco'>('todos');

  const filtered = EXERCISES.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.targetMuscles.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ex.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMuscle = muscleFilter === 'todos' || ex.muscleGroup === muscleFilter;

    const matchesEquip =
      equipmentFilter === 'todos' ||
      (equipmentFilter === 'mancuerna' && ex.equipment.toLowerCase().includes('mancuerna')) ||
      (equipmentFilter === 'disco' && ex.equipment.toLowerCase().includes('disco'));

    return matchesSearch && matchesMuscle && matchesEquip;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Search */}
      <div
        style={{
          background: '#090D16',
          border: '1px solid #1E293B',
          borderRadius: 4,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
              Biblioteca de Ejercicios Biomecánicos
            </h2>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              Guías completas con simulación 3D interactiva, video demostrativo y técnica paso a paso.
            </span>
          </div>

          <span style={{ fontSize: 12, color: '#38BDF8', fontFamily: 'monospace' }}>
            {filtered.length} ejercicios disponibles
          </span>
        </div>

        {/* Search input & filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.5fr) 1fr 1fr', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="#64748B"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Buscar ejercicio o músculo (ej. Cuádriceps, Isquios, Core)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 4,
                color: '#F8FAFC',
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Muscle filter */}
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value as typeof muscleFilter)}
            style={{
              padding: '8px 10px',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#F8FAFC',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos los grupos musculares</option>
            <option value="pierna">Pierna (Tren Inferior)</option>
            <option value="abdomen">Abdomen & Core</option>
          </select>

          {/* Equipment filter */}
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value as typeof equipmentFilter)}
            style={{
              padding: '8px 10px',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#F8FAFC',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <option value="todos">Cualquier equipamiento</option>
            <option value="mancuerna">Con Mancuernas</option>
            <option value="disco">Con Discos</option>
          </select>
        </div>
      </div>

      {/* Grid of Exercises */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map((ex) => (
          <div
            key={ex.id}
            onClick={() => onSelectExercise(ex)}
            style={{
              background: '#090D16',
              border: '1px solid #1E293B',
              borderRadius: 4,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38BDF8')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 2,
                    background: ex.muscleGroup === 'pierna' ? '#1E3A8A' : '#701A75',
                    color: ex.muscleGroup === 'pierna' ? '#93C5FD' : '#F472B6'
                  }}
                >
                  {ex.muscleGroup}
                </span>

                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {ex.equipment}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
                {ex.name}
              </h3>

              <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#94A3B8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ex.summary}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {ex.targetMuscles.map((m, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 10,
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
            </div>

            <div
              style={{
                borderTop: '1px solid #1E293B',
                paddingTop: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>
                <Zap size={13} />
                <span>Ver Simulación & Técnica</span>
              </div>

              <span style={{ fontSize: 11, color: '#64748B' }}>
                {ex.recommendedSets}s x {ex.recommendedReps}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
