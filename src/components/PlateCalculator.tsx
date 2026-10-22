import React, { useState, useEffect } from 'react';
import type { PlateInventory } from '../types/workout';
import {
  getStoredPlateInventory,
  savePlateInventory,
  calculatePlatesForDumbbell,
} from '../utils/storage';
import type { PlateCalculationResult } from '../utils/storage';
import { Sliders, CheckCircle2, AlertCircle, Dumbbell, Plus, Minus, Layers } from 'lucide-react';

interface PlateCalculatorProps {
  initialTargetKg?: number;
  onWeightSelect?: (weightKg: number) => void;
}

export const PlateCalculator: React.FC<PlateCalculatorProps> = ({
  initialTargetKg = 15,
  onWeightSelect
}) => {
  const [inventory, setInventory] = useState<PlateInventory>(getStoredPlateInventory());
  const [targetKg, setTargetKg] = useState<number>(initialTargetKg);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [result, setResult] = useState<PlateCalculationResult | null>(null);

  useEffect(() => {
    const res = calculatePlatesForDumbbell(targetKg, inventory);
    setResult(res);
  }, [targetKg, inventory]);

  const updateInventoryPairCount = (index: number, delta: number) => {
    const updated = { ...inventory };
    const newCount = Math.max(0, updated.availablePairs[index].countPairs + delta);
    updated.availablePairs[index].countPairs = newCount;
    setInventory(updated);
    savePlateInventory(updated);
  };

  const updateBarbellWeight = (newWeight: number) => {
    const updated = { ...inventory, barbellWeightKg: Math.max(0.5, newWeight) };
    setInventory(updated);
    savePlateInventory(updated);
  };

  const plateColorMap: Record<number, string> = {
    5: '#EF4444',    // Red
    2.5: '#3B82F6',  // Blue
    1.25: '#10B981', // Green
    0.5: '#F59E0B'   // Amber
  };

  return (
    <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={18} color="#38BDF8" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
            Calculadora de Mancuernas & Discos
          </h3>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: showConfig ? '#1E293B' : '#0F172A',
            border: '1px solid #334155',
            color: '#94A3B8',
            padding: '4px 8px',
            borderRadius: 3,
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          <Sliders size={13} />
          {showConfig ? 'Cerrar Inventario' : 'Ajustar Discos en Casa'}
        </button>
      </div>

      {/* Target weight selector / buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Peso objetivo por mancuerna:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setTargetKg(Math.max(inventory.barbellWeightKg, targetKg - 2.5))}
              style={{
                width: 28,
                height: 28,
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: 3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              step="0.5"
              min={inventory.barbellWeightKg}
              value={targetKg}
              onChange={(e) => setTargetKg(parseFloat(e.target.value) || inventory.barbellWeightKg)}
              style={{
                width: 70,
                textAlign: 'center',
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#38BDF8',
                fontSize: 16,
                fontWeight: 700,
                padding: '4px 6px',
                borderRadius: 3
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>kg</span>
            <button
              onClick={() => setTargetKg(targetKg + 2.5)}
              style={{
                width: 28,
                height: 28,
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: 3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Quick weight pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25].map((w) => (
            <button
              key={w}
              onClick={() => {
                setTargetKg(w);
                if (onWeightSelect) onWeightSelect(w);
              }}
              style={{
                padding: '3px 8px',
                fontSize: 11,
                background: targetKg === w ? '#0284C7' : '#0F172A',
                color: targetKg === w ? '#F8FAFC' : '#94A3B8',
                border: '1px solid',
                borderColor: targetKg === w ? '#38BDF8' : '#1E293B',
                borderRadius: 3,
                cursor: 'pointer'
              }}
            >
              {w} kg
            </button>
          ))}
        </div>
      </div>

      {/* Visual Dumbbell Breakdown */}
      {result && (
        <div style={{ background: '#050811', border: '1px solid #1E293B', borderRadius: 4, padding: 14 }}>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {result.isExact ? (
                <>
                  <CheckCircle2 size={15} color="#10B981" />
                  <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                    Combinación exacta armada: {result.actualWeightKg} kg
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} color="#F59E0B" />
                  <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
                    Aproximación más cercana: {result.actualWeightKg} kg (Faltan discos)
                  </span>
                </>
              )}
            </div>

            <span style={{ fontSize: 11, color: '#64748B' }}>
              Barra base: {result.barbellKg} kg
            </span>
          </div>

          {/* SVG Dumbbell Graphic */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '14px 0' }}>
            <svg viewBox="0 0 340 100" style={{ width: '100%', maxWidth: 360, height: 90 }}>
              {/* Dumbbell bar */}
              <rect x="50" y="44" width="240" height="12" fill="#64748B" rx="2" />
              {/* Grip knurling */}
              <rect x="135" y="42" width="70" height="16" fill="#475569" stroke="#94A3B8" strokeWidth="1" rx="1" />
              <text x="170" y="54" fill="#E2E8F0" fontSize="9" textAnchor="middle" fontWeight="bold">AGARRE</text>

              {/* Collar collars */}
              <rect x="125" y="38" width="8" height="24" fill="#334155" rx="1" />
              <rect x="207" y="38" width="8" height="24" fill="#334155" rx="1" />

              {/* Left side plates (stacked inwards) */}
              {result.platesPerSide.map((plate, pIdx) => {
                const totalPlatesBefore = result.platesPerSide
                  .slice(0, pIdx)
                  .reduce((acc, curr) => acc + curr.count, 0);

                return Array.from({ length: plate.count }).map((_, cIdx) => {
                  const plateIndex = totalPlatesBefore + cIdx;
                  const x = 120 - (plateIndex + 1) * 11;
                  const height = 40 + plate.weightKg * 7;
                  const y = 50 - height / 2;
                  const color = plateColorMap[plate.weightKg] || '#38BDF8';

                  return (
                    <g key={`l-${pIdx}-${cIdx}`}>
                      <rect x={x} y={y} width="9" height={height} rx="2" fill={color} stroke="#0F172A" strokeWidth="1" />
                    </g>
                  );
                });
              })}

              {/* Right side plates (stacked outwards) */}
              {result.platesPerSide.map((plate, pIdx) => {
                const totalPlatesBefore = result.platesPerSide
                  .slice(0, pIdx)
                  .reduce((acc, curr) => acc + curr.count, 0);

                return Array.from({ length: plate.count }).map((_, cIdx) => {
                  const plateIndex = totalPlatesBefore + cIdx;
                  const x = 217 + plateIndex * 11;
                  const height = 40 + plate.weightKg * 7;
                  const y = 50 - height / 2;
                  const color = plateColorMap[plate.weightKg] || '#38BDF8';

                  return (
                    <g key={`r-${pIdx}-${cIdx}`}>
                      <rect x={x} y={y} width="9" height={height} rx="2" fill={color} stroke="#0F172A" strokeWidth="1" />
                    </g>
                  );
                });
              })}

              {/* Left weight text */}
              <text x="60" y="90" fill="#94A3B8" fontSize="10" textAnchor="middle">
                LADO IZQUIERDO
              </text>
              {/* Right weight text */}
              <text x="280" y="90" fill="#94A3B8" fontSize="10" textAnchor="middle">
                LADO DERECHO
              </text>
            </svg>
          </div>

          {/* Text Recipe */}
          <div style={{ background: '#0F172A', padding: '10px 12px', borderRadius: 3, border: '1px solid #1E293B' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
              RECETA POR CADA LADO DE LA MANCUERNA:
            </span>
            {result.platesPerSide.length === 0 ? (
              <span style={{ fontSize: 12, color: '#CBD5E1' }}>Solo la barra sin discos ({result.barbellKg} kg)</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.platesPerSide.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#1E293B',
                      border: '1px solid #334155',
                      padding: '3px 8px',
                      borderRadius: 3,
                      color: plateColorMap[p.weightKg] || '#38BDF8'
                    }}
                  >
                    {p.count}x disco de {p.weightKg} kg
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Configuration Modal / Subpanel */}
      {showConfig && (
        <div style={{ marginTop: 14, padding: 12, background: '#0F172A', border: '1px solid #334155', borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Layers size={14} color="#38BDF8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>
              Inventario de Discos Disponibles en Casa
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#94A3B8' }}>
              <span>Peso de la barra de mancuerna vacía:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[1.5, 2, 2.5].map((b) => (
                  <button
                    key={b}
                    onClick={() => updateBarbellWeight(b)}
                    style={{
                      padding: '2px 6px',
                      fontSize: 11,
                      background: inventory.barbellWeightKg === b ? '#38BDF8' : '#1E293B',
                      color: inventory.barbellWeightKg === b ? '#090D16' : '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                  >
                    {b} kg
                  </button>
                ))}
              </div>
            </div>

            {inventory.availablePairs.map((pair: { weightKg: number; countPairs: number }, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: '#090D16',
                  borderRadius: 3,
                  border: '1px solid #1E293B'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: plateColorMap[pair.weightKg] || '#38BDF8'
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
                    Discos de {pair.weightKg} kg:
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    ({pair.countPairs * 2} discos / {pair.countPairs} pares)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => updateInventoryPairCount(idx, -1)}
                    style={{
                      width: 24,
                      height: 24,
                      background: '#1E293B',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: 12, minWidth: 20, textAlign: 'center', color: '#38BDF8', fontWeight: 700 }}>
                    {pair.countPairs}
                  </span>
                  <button
                    onClick={() => updateInventoryPairCount(idx, 1)}
                    style={{
                      width: 24,
                      height: 24,
                      background: '#1E293B',
                      color: '#F8FAFC',
                      border: '1px solid #334155',
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
