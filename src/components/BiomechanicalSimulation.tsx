import React, { useState, useEffect, useRef } from 'react';
import type { SimulationType } from '../types/workout';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

interface BiomechanicalSimulationProps {
  type: SimulationType;
  exerciseName: string;
  tempo: string;
}

export const BiomechanicalSimulation: React.FC<BiomechanicalSimulationProps> = ({
  type,
  exerciseName,
  tempo
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0); // 0 to 1
  const [activePhase, setActivePhase] = useState<string>('Posición Inicial');
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Animation cycle loop (approx 4 seconds per rep at 1.0x)
  const cycleDurationMs = 3800;

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        setProgress((prev) => {
          const next = (prev + (delta * speed) / cycleDurationMs) % 1;
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed]);

  // Determine current phase from progress
  useEffect(() => {
    if (progress < 0.15) {
      setActivePhase('1. Setup & Inhalación Diafragmática');
    } else if (progress < 0.5) {
      setActivePhase('2. Fase Excéntrica (Descenso controlado)');
    } else if (progress < 0.6) {
      setActivePhase('3. Punto de Máxima Carga (Pausa isométrica)');
    } else if (progress < 0.9) {
      setActivePhase('4. Fase Concéntrica (Empuje explosivo)');
    } else {
      setActivePhase('5. Bloqueo Articular & Reajuste de Core');
    }
  }, [progress]);

  // Smooth sinusoidal factor between 0 (top/start) and 1 (bottom/inflection)
  // Progress goes 0 -> 0.5 (descending) -> 1.0 (ascending)
  const t = Math.sin(progress * Math.PI); // 0 at start, 1 at middle, 0 at end

  // Muscle tension values derived from t
  const primaryTension = Math.round(30 + t * 70); // 30% to 100%
  const stabilizerTension = Math.round(50 + t * 40); // 50% to 90%

  // Render kinematics based on simulation type
  const renderKinematics = () => {
    switch (type) {
      case 'goblet-squat': {
        // Center: x=200, floor at y=320
        const hipY = 190 + t * 85;
        const kneeX = 225 + t * 25;
        const kneeY = 245 + t * 20;
        const ankleX = 205;
        const ankleY = 320;
        const shoulderX = 185 - t * 15;
        const shoulderY = hipY - 75;
        const headX = shoulderX + 5;
        const headY = shoulderY - 24;

        // Dumbbell held at chest
        const dbX = shoulderX + 22;
        const dbY = shoulderY + 28;

        return (
          <g>
            {/* Ground line */}
            <line x1="80" y1="320" x2="320" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <text x="90" y="338" fill="#64748B" fontSize="10" fontFamily="monospace">PLANO DE APOYO (PIE COMPLETO)</text>

            {/* Depth guide line */}
            <line x1="120" y1="275" x2="280" y2="275" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity={0.4} />
            <text x="120" y="270" fill="#F59E0B" fontSize="9" opacity={0.7}>LÍNEA PARALELA (CADERA A NIVEL DE RODILLA)</text>

            {/* Force vector arrow under feet */}
            <line x1={ankleX} y1="320" x2={ankleX} y2="345" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* Body Rig */}
            {/* Spine & Torso */}
            <line
              x1={hipY ? 190 : 190}
              y1={hipY}
              x2={shoulderX}
              y2={shoulderY}
              stroke="#E2E8F0"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Head */}
            <circle cx={headX} cy={headY} r="14" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Thigh / Cuádriceps (Dynamic glow with load) */}
            <line
              x1={hipY ? 190 : 190}
              y1={hipY}
              x2={kneeX}
              y2={kneeY}
              stroke={t > 0.4 ? '#F59E0B' : '#38BDF8'}
              strokeWidth={14 + t * 4}
              strokeLinecap="round"
              opacity={0.9}
            />

            {/* Shin */}
            <line
              x1={kneeX}
              y1={kneeY}
              x2={ankleX}
              y2={ankleY}
              stroke="#94A3B8"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Foot */}
            <line x1={ankleX - 8} y1={ankleY} x2={ankleX + 28} y2={ankleY} stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />

            {/* Arms holding Goblet */}
            <path
              d={`M ${shoulderX} ${shoulderY} L ${dbX - 6} ${dbY + 12} L ${dbX} ${dbY}`}
              fill="none"
              stroke="#64748B"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Goblet Dumbbell */}
            <rect x={dbX - 8} y={dbY - 14} width="16" height="6" rx="2" fill="#38BDF8" />
            <rect x={dbX - 4} y={dbY - 8} width="8" height="18" rx="1" fill="#94A3B8" />
            <rect x={dbX - 8} y={dbY + 10} width="16" height="6" rx="2" fill="#38BDF8" />

            {/* Joint dots */}
            <circle cx={kneeX} cy={kneeY} r="4" fill="#0EA5E9" />
            <circle cx={190} cy={hipY} r="4.5" fill="#F59E0B" />
            <circle cx={shoulderX} cy={shoulderY} r="4" fill="#0EA5E9" />

            {/* Muscle callout tag */}
            <g transform={`translate(${kneeX + 16}, ${kneeY - 15})`}>
              <rect x="0" y="0" width="85" height="20" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="6" y="14" fill="#F8FAFC" fontSize="10" fontWeight="bold">CUÁDRICEPS: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      case 'romanian-deadlift': {
        // Hinge backwards: hip goes back (x decreases), torso leans forward, knees stay micro-flexed
        const hipX = 220 - t * 45;
        const hipY = 205 + t * 15;
        const kneeX = 210 - t * 10;
        const kneeY = 265;
        const ankleX = 205;
        const ankleY = 320;
        const shoulderX = hipX - 65 * Math.sin(0.4 + t * 0.9);
        const shoulderY = hipY - 65 * Math.cos(0.4 + t * 0.9);
        const headX = shoulderX - 16;
        const headY = shoulderY - 10;

        // Dumbbells hanging straight down from shoulder
        const dbX = shoulderX + 4;
        const dbY = shoulderY + 55 + t * 20;

        return (
          <g>
            <line x1="80" y1="320" x2="320" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <text x="90" y="338" fill="#64748B" fontSize="10" fontFamily="monospace">PLANO DE PISO</text>

            {/* Hip hinge horizontal trajectory arrow */}
            <path d={`M 220 205 L ${220 - 45} 205`} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="135" y="195" fill="#F59E0B" fontSize="9">RECESO DE CADERA (HIP HINGE)</text>

            {/* Torso & Neutral Spine indicator line */}
            <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
            <circle cx={headX} cy={headY} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Hamstrings / Isquios (Highlighting stretch) */}
            <line
              x1={hipX}
              y1={hipY}
              x2={kneeX}
              y2={kneeY}
              stroke={t > 0.5 ? '#F59E0B' : '#38BDF8'}
              strokeWidth={13 + t * 3}
              strokeLinecap="round"
            />

            {/* Shins (Fixed micro-flexion) */}
            <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" />
            <line x1={ankleX - 6} y1={ankleY} x2={ankleX + 26} y2={ankleY} stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />

            {/* Arms hanging */}
            <line x1={shoulderX} y1={shoulderY} x2={dbX} y2={dbY} stroke="#64748B" strokeWidth="5" strokeLinecap="round" />

            {/* Dumbbells hanging close to leg */}
            <rect x={dbX - 8} y={dbY - 5} width="16" height="10" rx="2" fill="#38BDF8" stroke="#0284C7" />
            <rect x={dbX - 14} y={dbY - 3} width="28" height="6" rx="2" fill="#0EA5E9" />

            {/* Callouts */}
            <g transform={`translate(${hipX - 10}, ${hipY + 30})`}>
              <rect x="0" y="0" width="105" height="20" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="6" y="14" fill="#F8FAFC" fontSize="10" fontWeight="bold">ISQUIOTIBIALES: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      case 'bulgarian-split-squat': {
        // Front leg descending, back leg resting on a bench (x=90, y=260)
        const frontFootX = 230;
        const frontFootY = 320;
        const frontKneeX = 230 + t * 15;
        const frontKneeY = 250 + t * 45;
        const hipX = 185;
        const hipY = 200 + t * 75;
        const backKneeX = 145 - t * 10;
        const backKneeY = 260 + t * 45;

        const shoulderX = hipX - 5;
        const shoulderY = hipY - 70;
        const headX = shoulderX;
        const headY = shoulderY - 22;

        return (
          <g>
            <line x1="60" y1="320" x2="320" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* Bench representation */}
            <rect x="70" y="270" width="50" height="50" fill="#1E293B" stroke="#475569" strokeWidth="2" rx="2" />
            <text x="73" y="300" fill="#94A3B8" fontSize="9">BANCO / SILLA</text>

            {/* Back elevated leg */}
            <line x1={hipX} y1={hipY} x2={backKneeX} y2={backKneeY} stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
            <line x1={backKneeX} y1={backKneeY} x2="95" y2="270" stroke="#64748B" strokeWidth="7" strokeLinecap="round" />

            {/* Torso */}
            <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
            <circle cx={headX} cy={headY} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Front working leg (Cuádriceps and Glúteo) */}
            <line
              x1={hipX}
              y1={hipY}
              x2={frontKneeX}
              y2={frontKneeY}
              stroke={t > 0.4 ? '#F59E0B' : '#38BDF8'}
              strokeWidth={13 + t * 3}
              strokeLinecap="round"
            />
            <line x1={frontKneeX} y1={frontKneeY} x2={frontFootX} y2={frontFootY} stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" />
            <line x1={frontFootX - 8} y1={frontFootY} x2={frontFootX + 24} y2={frontFootY} stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />

            {/* Dumbbells in hand */}
            <line x1={shoulderX} y1={shoulderY} x2={shoulderX + 5} y2={shoulderY + 55} stroke="#64748B" strokeWidth="4" />
            <rect x={shoulderX - 2} y={shoulderY + 50} width="14" height="12" rx="2" fill="#38BDF8" />

            {/* Callout */}
            <g transform={`translate(${frontKneeX + 15}, ${frontKneeY - 15})`}>
              <rect x="0" y="0" width="90" height="20" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="6" y="14" fill="#F8FAFC" fontSize="10" fontWeight="bold">CUÁDRICEPS: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      case 'calf-raise': {
        // Ankle extension: heel lifts off ground
        const heelLift = t * 45;
        const ankleX = 200;
        const ankleY = 300 - heelLift;
        const toeX = 220;
        const toeY = 320;
        const kneeY = 210 - heelLift;
        const hipY = 120 - heelLift;
        const shoulderY = 55 - heelLift;

        return (
          <g>
            <line x1="100" y1="320" x2="300" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* Step disc under toes */}
            <rect x="195" y="315" width="55" height="10" rx="2" fill="#334155" stroke="#64748B" strokeWidth="1" />
            <text x="120" y="338" fill="#64748B" fontSize="10">DISCO ELEVADOR (ESTIRAMIENTO NEGATIVO)</text>

            {/* Torso & Head */}
            <line x1="200" y1={hipY} x2="200" y2={shoulderY} stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
            <circle cx="200" cy={shoulderY - 20} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Thigh */}
            <line x1="200" y1={hipY} x2="200" y2={kneeY} stroke="#94A3B8" strokeWidth="9" strokeLinecap="round" />

            {/* Calf / Gemelos with dynamic bulging tension */}
            <line
              x1="200"
              y1={kneeY}
              x2={ankleX}
              y2={ankleY}
              stroke={t > 0.4 ? '#F59E0B' : '#38BDF8'}
              strokeWidth={11 + t * 7}
              strokeLinecap="round"
            />

            {/* Foot angled up */}
            <line x1={ankleX} y1={ankleY} x2={toeX} y2={toeY} stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />

            {/* Dumbbell held at side */}
            <line x1="200" y1={shoulderY} x2="180" y2={shoulderY + 50} stroke="#64748B" strokeWidth="4" />
            <rect x="172" y={shoulderY + 45} width="16" height="12" rx="2" fill="#38BDF8" />

            {/* Tension tag */}
            <g transform={`translate(${ankleX + 25}, ${ankleY - 25})`}>
              <rect x="0" y="0" width="85" height="20" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="6" y="14" fill="#F8FAFC" fontSize="10" fontWeight="bold">GEMELOS: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      case 'plank-pull-through': {
        // High plank horizontal posture
        const shoulderX = 140;
        const shoulderY = 200;
        const handX = 140;
        const handY = 280;
        const hipX = 230;
        const hipY = 205;
        const feetX = 310;
        const feetY = 280;

        // Pull through arm reaching under
        const dbCurrentX = 150 + t * 45;
        const movingArmX = dbCurrentX;
        const movingArmY = 250;

        return (
          <g>
            <line x1="80" y1="280" x2="340" y2="280" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* Fixed Supporting Arm */}
            <line x1={shoulderX} y1={shoulderY} x2={handX} y2={handY} stroke="#64748B" strokeWidth="7" strokeLinecap="round" />

            {/* Moving arm pulling dumbbell across */}
            <line x1={shoulderX + 15} y1={shoulderY} x2={movingArmX} y2={movingArmY} stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" />

            {/* Dumbbell sliding across floor */}
            <rect x={dbCurrentX - 8} y="268" width="16" height="12" rx="2" fill="#F59E0B" stroke="#B45309" />

            {/* Straight Core & Pelvis (Anti-rotation focus) */}
            <line
              x1={shoulderX}
              y1={shoulderY}
              x2={hipX}
              y2={hipY}
              stroke={t > 0.3 ? '#F59E0B' : '#38BDF8'}
              strokeWidth={14}
              strokeLinecap="round"
            />

            {/* Head */}
            <circle cx={shoulderX - 20} cy={shoulderY} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Legs extended back */}
            <line x1={hipX} y1={hipY} x2={feetX} y2={feetY} stroke="#94A3B8" strokeWidth="9" strokeLinecap="round" />

            {/* Anti-rotation lock label */}
            <g transform="translate(170, 150)">
              <rect x="0" y="0" width="125" height="22" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
              <text x="6" y="15" fill="#38BDF8" fontSize="10" fontWeight="bold">CORE ANTI-ROTACIÓN: 90%</text>
            </g>
          </g>
        );
      }

      case 'russian-twist': {
        // Seated V-sit posture
        const hipX = 180;
        const hipY = 270;
        const torsoAngle = 45; // degrees
        const shoulderX = hipX - 55 * Math.sin((torsoAngle * Math.PI) / 180);
        const shoulderY = hipY - 55 * Math.cos((torsoAngle * Math.PI) / 180);
        const headX = shoulderX - 12;
        const headY = shoulderY - 14;

        // Knees bent in air
        const kneeX = 240;
        const kneeY = 230;
        const feetX = 270;
        const feetY = 265;

        // Weight rotating side to side
        const rotOffset = (t - 0.5) * 40;
        const weightX = 180 + rotOffset;
        const weightY = 220;

        return (
          <g>
            <line x1="100" y1="285" x2="300" y2="285" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

            {/* Torso V-sit */}
            <line
              x1={hipX}
              y1={hipY}
              x2={shoulderX}
              y2={shoulderY}
              stroke={t > 0.3 ? '#F59E0B' : '#38BDF8'}
              strokeWidth="13"
              strokeLinecap="round"
            />
            <circle cx={headX} cy={headY} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Legs floating */}
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" />
            <line x1={kneeX} y1={kneeY} x2={feetX} y2={feetY} stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />

            {/* Arms holding weight */}
            <line x1={shoulderX} y1={shoulderY} x2={weightX} y2={weightY} stroke="#64748B" strokeWidth="4" />

            {/* Weight plate rotating */}
            <circle cx={weightX} cy={weightY} r="14" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <circle cx={weightX} cy={weightY} r="5" fill="#0F172A" />

            {/* Oblique tension callout */}
            <g transform="translate(130, 140)">
              <rect x="0" y="0" width="105" height="20" rx="3" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
              <text x="6" y="14" fill="#F8FAFC" fontSize="10" fontWeight="bold">OBLICUOS: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      case 'deadbug': {
        // Supine flat back on floor
        const hipX = 200;
        const hipY = 260;
        const shoulderX = 140;
        const shoulderY = 260;
        const headX = 115;
        const headY = 260;

        // One leg extending straight, other at 90 deg
        const extLegX = 200 + 40 + t * 65;
        const extLegY = 260 - 20 + t * 15;

        // Arms holding plate over chest
        const plateX = 155;
        const plateY = 175;

        return (
          <g>
            {/* Flat ground & Floor contact indicator */}
            <line x1="80" y1="275" x2="320" y2="275" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="130" y="268" width="80" height="4" fill="#10B981" />
            <text x="110" y="295" fill="#10B981" fontSize="9">ZONA LUMBAR 100% CONTACTO PLANO (CERO ARQUEO)</text>

            {/* Torso on floor */}
            <line
              x1={shoulderX}
              y1={shoulderY}
              x2={hipX}
              y2={hipY}
              stroke={t > 0.4 ? '#F59E0B' : '#38BDF8'}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <circle cx={headX} cy={headY} r="13" fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Vertical Arms holding disc */}
            <line x1={shoulderX} y1={shoulderY} x2={plateX} y2={plateY} stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
            <circle cx={plateX} cy={plateY} r="15" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
            <circle cx={plateX} cy={plateY} r="4" fill="#0F172A" />

            {/* Stable 90 degree leg */}
            <line x1={hipX} y1={hipY} x2={hipX} y2="210" stroke="#64748B" strokeWidth="7" strokeLinecap="round" />
            <line x1={hipX} y1="210" x2={hipX + 35} y2="210" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />

            {/* Dynamic extending leg */}
            <line x1={hipX} y1={hipY} x2={extLegX} y2={extLegY} stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" />

            {/* Core tension */}
            <g transform="translate(130, 125)">
              <rect x="0" y="0" width="135" height="22" rx="3" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
              <text x="6" y="15" fill="#10B981" fontSize="10" fontWeight="bold">TRANSVERSO ABDOMINAL: {primaryTension}%</text>
            </g>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, overflow: 'hidden' }}>
      {/* Simulation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: '#0F172A',
          borderBottom: '1px solid #1E293B'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="#38BDF8" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Simulación Biomecánica: {exerciseName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: 3,
              background: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #334155'
            }}
          >
            Tempo: {tempo.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050811' }}>
        <svg
          viewBox="0 0 400 370"
          style={{ width: '100%', height: '100%', maxHeight: 350 }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8" />
            </marker>
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0F172A" strokeWidth="0.8" />
          </pattern>
          <rect width="400" height="370" fill="url(#grid)" />

          {/* Render kinematic model */}
          {renderKinematics()}
        </svg>

        {/* Phase Pill Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #334155',
            padding: '5px 10px',
            borderRadius: 3,
            fontSize: 11,
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPlaying ? '#10B981' : '#F59E0B' }} />
          <span>{activePhase}</span>
        </div>

        {/* Muscle Load Indicators */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid #334155',
            padding: '8px 12px',
            borderRadius: 3,
            fontSize: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 140
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
            <span>Tensión Motora:</span>
            <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>{primaryTension}%</span>
          </div>
          <div style={{ height: 4, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${primaryTension}%`, height: '100%', background: '#F59E0B', transition: 'width 0.1s linear' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', marginTop: 2 }}>
            <span>Estabilidad Core:</span>
            <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>{stabilizerTension}%</span>
          </div>
          <div style={{ height: 4, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${stabilizerTension}%`, height: '100%', background: '#38BDF8', transition: 'width 0.1s linear' }} />
          </div>
        </div>
      </div>

      {/* Scrub & Playback Controls */}
      <div
        style={{
          padding: '12px 16px',
          background: '#0B0F19',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        {/* Scrubber slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', minWidth: 40 }}>
            {Math.round(progress * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => {
              setIsPlaying(false);
              setProgress(parseFloat(e.target.value));
            }}
            style={{
              flex: 1,
              accentColor: '#38BDF8',
              height: 4,
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: isPlaying ? '#1E293B' : '#0284C7',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </button>

            <button
              onClick={() => setProgress(0)}
              style={{
                padding: '6px 8px',
                background: '#0F172A',
                color: '#94A3B8',
                border: '1px solid #1E293B',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12
              }}
              title="Reiniciar ciclo"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Speed buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>Velocidad:</span>
            {[0.5, 1.0, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: '4px 8px',
                  background: speed === s ? '#38BDF8' : '#0F172A',
                  color: speed === s ? '#090D16' : '#94A3B8',
                  border: '1px solid',
                  borderColor: speed === s ? '#38BDF8' : '#1E293B',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: speed === s ? 700 : 500
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
