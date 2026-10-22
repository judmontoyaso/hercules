import React from 'react';
import { Dumbbell, ListOrdered, BookOpen, History, Sliders } from 'lucide-react';

interface HeaderProps {
  currentTab: 'rutina' | 'biblioteca' | 'calculadora' | 'historial';
  onSelectTab: (tab: 'rutina' | 'biblioteca' | 'calculadora' | 'historial') => void;
  isWorkoutActive: boolean;
  onReturnToWorkout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isWorkoutActive,
  onReturnToWorkout
}) => {
  return (
    <header
      style={{
        background: '#090D16',
        borderBottom: '1px solid #1E293B',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: '#0284C7',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8FAFC'
            }}
          >
            <Dumbbell size={18} />
          </div>
          <div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: 1.2,
                color: '#F8FAFC',
                textTransform: 'uppercase'
              }}
            >
              HERCULES
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 9,
                letterSpacing: 0.8,
                color: '#38BDF8',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              Fuerza & Biomecánica
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { id: 'rutina', label: 'Rutina', icon: ListOrdered },
            { id: 'biblioteca', label: 'Ejercicios 3D', icon: BookOpen },
            { id: 'calculadora', label: 'Armar Mancuernas', icon: Sliders },
            { id: 'historial', label: 'Historial', icon: History }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as typeof currentTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  background: isActive ? '#1E293B' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  color: isActive ? '#38BDF8' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live session active indicator */}
        <div>
          {isWorkoutActive && onReturnToWorkout && (
            <button
              onClick={onReturnToWorkout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#10B981',
                color: '#064E3B',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#064E3B' }} />
              Sesión Activa
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
