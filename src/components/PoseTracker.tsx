import React, { useState, useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { EXERCISES } from '../data/exercises';
import { audioEngine } from '../utils/audio';
import {
  Camera,
  VideoOff,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface PoseTrackerProps {
  initialExerciseId?: string;
  onRepCountUpdate?: (exerciseId: string, completedReps: number) => void;
}

interface BiomechanicalAnalysis {
  kneeAngleDeg: number;
  hipAngleDeg: number;
  depthReached: boolean;
  kneeValgusWarning: boolean;
  torsoWarning: boolean;
  phase: 'ARRIBA' | 'DESCENDIENDO' | 'FONDO' | 'SUBIENDO';
  feedbackMessage: string;
}

export const PoseTracker: React.FC<PoseTrackerProps> = ({
  initialExerciseId = 'goblet-squat',
  onRepCountUpdate
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExerciseId);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(true);

  // Rep tracking state
  const [repCount, setRepCount] = useState<number>(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<BiomechanicalAnalysis>({
    kneeAngleDeg: 180,
    hipAngleDeg: 180,
    depthReached: false,
    kneeValgusWarning: false,
    torsoWarning: false,
    phase: 'ARRIBA',
    feedbackMessage: 'Párate frente a la cámara de cuerpo completo para iniciar'
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // State machine for rep counting
  const repStateRef = useRef<{
    state: 'TOP' | 'GOING_DOWN' | 'BOTTOM' | 'GOING_UP';
    minKneeAngle: number;
    lastRepTimestamp: number;
    lastVoiceTimestamp: number;
  }>({
    state: 'TOP',
    minKneeAngle: 180,
    lastRepTimestamp: 0,
    lastVoiceTimestamp: 0
  });

  const currentExercise = EXERCISES.find((e) => e.id === selectedExerciseId) || EXERCISES[0];

  // Voice feedback helper (Web Speech API)
  const speakFeedback = (text: string, force: boolean = false) => {
    if (!voiceFeedbackEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    // Throttle voice feedback to max once every 2.5 seconds unless forced (rep completed)
    if (!force && now - repStateRef.current.lastVoiceTimestamp < 2500) {
      return;
    }

    repStateRef.current.lastVoiceTimestamp = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initMediaPipe = async () => {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (isCancelled) return;
        poseLandmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err: unknown) {
        console.error('Failed to load MediaPipe model:', err);
        if (!isCancelled) {
          setModelError(
            'No se pudo cargar el modelo de visión. Verifica tu conexión a internet o intenta recargar.'
          );
          setIsLoadingModel(false);
        }
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  // Start webcam
  const startCamera = async () => {
    try {
      setModelError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setModelError('No se pudo acceder a la cámara web. Revisa los permisos en tu navegador.');
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsCameraActive(false);
  };

  // Compute 3D angle between three landmarks in degrees (e.g. Hip-Knee-Ankle)
  const calculateJointAngle = (
    a: { x: number; y: number; z?: number },
    b: { x: number; y: number; z?: number }, // Vertex (knee or hip)
    c: { x: number; y: number; z?: number }
  ): number => {
    const ba = { x: a.x - b.x, y: a.y - b.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };

    const dotProduct = ba.x * bc.x + ba.y * bc.y;
    const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
    const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);

    if (magBA === 0 || magBC === 0) return 180;

    const cosine = Math.max(-1, Math.min(1, dotProduct / (magBA * magBC)));
    const angleRad = Math.acos(cosine);
    return Math.round((angleRad * 180) / Math.PI);
  };

  // Main Detection Loop
  useEffect(() => {
    if (!isCameraActive || !poseLandmarkerRef.current) return;

    let isRunning = true;

    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = poseLandmarkerRef.current;

      if (video && canvas && landmarker && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const currentTime = video.currentTime;
          if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;

            const results = landmarker.detectForVideo(video, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0];
              const drawingUtils = new DrawingUtils(ctx);

              // 1. Draw Skeleton Connectors
              drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: '#38BDF8',
                lineWidth: 3
              });

              // 2. Extract key anatomical landmarks
              // Index 11/12: Shoulders, 23/24: Hips, 25/26: Knees, 27/28: Ankles
              const leftHip = landmarks[23];
              const rightHip = landmarks[24];
              const leftKnee = landmarks[25];
              const rightKnee = landmarks[26];
              const leftAnkle = landmarks[27];
              const rightAnkle = landmarks[28];
              const leftShoulder = landmarks[11];
              const rightShoulder = landmarks[12];

              // Pick the side with higher visibility/presence
              const isLeftSide = (leftKnee.visibility ?? 0) >= (rightKnee.visibility ?? 0);
              const hip = isLeftSide ? leftHip : rightHip;
              const knee = isLeftSide ? leftKnee : rightKnee;
              const ankle = isLeftSide ? leftAnkle : rightAnkle;
              const shoulder = isLeftSide ? leftShoulder : rightShoulder;

              // Calculate angles
              const kneeAngle = calculateJointAngle(hip, knee, ankle);
              const hipAngle = calculateJointAngle(shoulder, hip, knee);

              // Check Valgus (Knee x position relative to hip and ankle)
              const kneeValgus = Math.abs(leftKnee.x - rightKnee.x) < Math.abs(leftAnkle.x - rightAnkle.x) * 0.75;

              // Torso pitch warning (too forward in squat)
              const torsoTooForward = hipAngle < 65;

              // Determine Depth
              const depthReached = kneeAngle <= 95;

              // State Machine for Repetitions
              const stateRef = repStateRef.current;
              let currentPhase: 'ARRIBA' | 'DESCENDIENDO' | 'FONDO' | 'SUBIENDO' = 'ARRIBA';
              let message = 'Mantén la postura erguida';

              if (kneeAngle > 140) {
                if (stateRef.state === 'GOING_UP' && stateRef.minKneeAngle <= 100) {
                  // Repetition completed!
                  setRepCount((prev) => {
                    const next = prev + 1;
                    audioEngine.playSetComplete();
                    speakFeedback(`Repetición ${next}`, true);
                    if (onRepCountUpdate) onRepCountUpdate(selectedExerciseId, next);
                    return next;
                  });
                  stateRef.state = 'TOP';
                  stateRef.minKneeAngle = 180;
                } else {
                  stateRef.state = 'TOP';
                  currentPhase = 'ARRIBA';
                  message = 'Inicia el descenso controlado';
                }
              } else if (kneeAngle <= 140 && kneeAngle > 105) {
                if (stateRef.state === 'TOP' || stateRef.state === 'GOING_DOWN') {
                  stateRef.state = 'GOING_DOWN';
                  currentPhase = 'DESCENDIENDO';
                  message = 'Bajando... busca profundidad paralela';
                } else if (stateRef.state === 'BOTTOM' || stateRef.state === 'GOING_UP') {
                  stateRef.state = 'GOING_UP';
                  currentPhase = 'SUBIENDO';
                  message = 'Empuja el piso con fuerza';
                }
              } else if (kneeAngle <= 105) {
                stateRef.state = 'BOTTOM';
                currentPhase = 'FONDO';
                stateRef.minKneeAngle = Math.min(stateRef.minKneeAngle, kneeAngle);

                if (kneeAngle <= 90) {
                  message = 'Profundidad perfecta. ¡Sube!';
                } else {
                  message = 'Baja 3 cm más para romper el paralelo';
                  speakFeedback('Baja un poco más');
                }
              }

              if (kneeValgus) {
                message = 'Atención: Rodillas hacia afuera, no las juntes';
                speakFeedback('Abre las rodillas');
              } else if (torsoTooForward && selectedExerciseId === 'goblet-squat') {
                message = 'Levanta el pecho, torso más erguido';
                speakFeedback('Pecho arriba');
              }

              setCurrentAnalysis({
                kneeAngleDeg: kneeAngle,
                hipAngleDeg: hipAngle,
                depthReached,
                kneeValgusWarning: kneeValgus,
                torsoWarning: torsoTooForward,
                phase: currentPhase,
                feedbackMessage: message
              });

              // Highlight working joint on canvas
              const kneeCanvasX = knee.x * canvas.width;
              const kneeCanvasY = knee.y * canvas.height;

              ctx.beginPath();
              ctx.arc(kneeCanvasX, kneeCanvasY, 10, 0, 2 * Math.PI);
              ctx.fillStyle = depthReached ? '#10B981' : kneeValgus ? '#EF4444' : '#F59E0B';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#FFFFFF';
              ctx.stroke();

              // Draw angle text next to knee
              ctx.font = 'bold 16px monospace';
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(`${kneeAngle}°`, kneeCanvasX + 16, kneeCanvasY + 5);
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, selectedExerciseId, onRepCountUpdate, voiceFeedbackEnabled]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner */}
      <div
        style={{
          background: '#090D16',
          border: '1px solid #1E293B',
          borderRadius: 4,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
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
                background: '#1E3A8A',
                color: '#93C5FD',
                border: '1px solid #2563EB'
              }}
            >
              VISIÓN ARTIFICIAL ON-DEVICE (0$ USD)
            </span>
            <span style={{ fontSize: 11, color: '#64748B' }}>Google MediaPipe Pose</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
            Corrección en Vivo: {currentExercise.name}
          </h2>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedExerciseId}
            onChange={(e) => {
              setSelectedExerciseId(e.target.value);
              setRepCount(0);
            }}
            style={{
              padding: '6px 10px',
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#F8FAFC',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#0F172A',
              border: '1px solid #334155',
              color: voiceFeedbackEnabled ? '#38BDF8' : '#64748B',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer'
            }}
            title={voiceFeedbackEnabled ? 'Voz activa' : 'Voz desactivada'}
          >
            {voiceFeedbackEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{voiceFeedbackEnabled ? 'Voz On' : 'Voz Off'}</span>
          </button>

          {!isCameraActive ? (
            <button
              onClick={startCamera}
              disabled={isLoadingModel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: isLoadingModel ? '#1E293B' : '#0284C7',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                cursor: isLoadingModel ? 'wait' : 'pointer',
                fontWeight: 600,
                fontSize: 13
              }}
            >
              <Camera size={15} />
              <span>{isLoadingModel ? 'Cargando Modelo...' : 'Activar Cámara'}</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#EF4444',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13
              }}
            >
              <VideoOff size={15} />
              <span>Desactivar Cámara</span>
            </button>
          )}
        </div>
      </div>

      {/* Model Loading / Error alert */}
      {modelError && (
        <div
          style={{
            background: '#450A0A',
            border: '1px solid #991B1B',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: 4,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <AlertTriangle size={16} />
          <span>{modelError}</span>
        </div>
      )}

      {/* Main Video & HUD Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)', gap: 16 }}>
        {/* Video Canvas Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 480,
            background: '#030712',
            border: '1px solid #1E293B',
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scaleX(-1)' // Mirror for natural training feel
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scaleX(-1)'
            }}
          />

          {/* Fallback placeholder when camera is not on */}
          {!isCameraActive && (
            <div style={{ textAlign: 'center', color: '#64748B', padding: 24, zIndex: 10 }}>
              <Camera size={48} style={{ margin: '0 auto 12px auto', strokeWidth: 1.5, color: '#334155' }} />
              <p style={{ margin: '0 0 10px 0', fontSize: 14, color: '#94A3B8' }}>
                La cámara está apagada
              </p>
              <button
                onClick={startCamera}
                disabled={isLoadingModel}
                style={{
                  padding: '8px 16px',
                  background: '#0284C7',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Activar Cámara para Entrenar
              </button>
            </div>
          )}

          {/* Real-time HUD Pill Overlay (Bottom) */}
          {isCameraActive && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                background: 'rgba(9, 13, 22, 0.92)',
                border: '1px solid #334155',
                padding: '10px 14px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: currentAnalysis.depthReached
                      ? '#10B981'
                      : currentAnalysis.kneeValgusWarning
                      ? '#EF4444'
                      : '#F59E0B'
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                  {currentAnalysis.feedbackMessage}
                </span>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: 3,
                  background: '#1E293B',
                  color: '#38BDF8'
                }}
              >
                Fase: {currentAnalysis.phase}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Metrics & Biomechanical Feedback Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Big Rep Counter Hero */}
          <div
            style={{
              background: '#090D16',
              border: '1px solid #1E293B',
              borderRadius: 4,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                REPETICIONES VÁLIDAS DETECTADAS
              </span>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace', lineHeight: 1.1 }}>
                {repCount}
              </span>
            </div>

            <button
              onClick={() => {
                setRepCount(0);
                repStateRef.current.state = 'TOP';
                repStateRef.current.minKneeAngle = 180;
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#94A3B8',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <RotateCcw size={13} /> Reiniciar
            </button>
          </div>

          {/* Real-time Angle Gauges */}
          <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
              Telemetría Articular en Vivo
            </h4>

            {/* Knee Angle Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#94A3B8' }}>Ángulo de Rodilla (Profundidad):</span>
                <strong style={{ color: currentAnalysis.depthReached ? '#10B981' : '#F59E0B' }}>
                  {currentAnalysis.kneeAngleDeg}° {currentAnalysis.depthReached ? '(Paralelo OK)' : ''}
                </strong>
              </div>
              <div style={{ height: 8, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, ((180 - currentAnalysis.kneeAngleDeg) / 100) * 100))}%`,
                    height: '100%',
                    background: currentAnalysis.depthReached ? '#10B981' : '#38BDF8',
                    transition: 'width 0.08s linear'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginTop: 3 }}>
                <span>180° (De pie)</span>
                <span>90° (Profundidad reglamentaria)</span>
              </div>
            </div>

            {/* Hip Angle Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#94A3B8' }}>Bisagra de Cadera (Inclinación Torso):</span>
                <strong style={{ color: currentAnalysis.torsoWarning ? '#EF4444' : '#F8FAFC' }}>
                  {currentAnalysis.hipAngleDeg}°
                </strong>
              </div>
              <div style={{ height: 8, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, ((180 - currentAnalysis.hipAngleDeg) / 110) * 100))}%`,
                    height: '100%',
                    background: currentAnalysis.torsoWarning ? '#EF4444' : '#F59E0B',
                    transition: 'width 0.08s linear'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Quality Checklist */}
          <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 16 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
              Checklist de Seguridad
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentAnalysis.depthReached ? (
                  <CheckCircle2 size={16} color="#10B981" />
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #64748B' }} />
                )}
                <span style={{ color: currentAnalysis.depthReached ? '#F8FAFC' : '#94A3B8' }}>
                  Profundidad mínima alcanzada (rodilla a 90°)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!currentAnalysis.kneeValgusWarning ? (
                  <CheckCircle2 size={16} color="#10B981" />
                ) : (
                  <AlertTriangle size={16} color="#EF4444" />
                )}
                <span style={{ color: !currentAnalysis.kneeValgusWarning ? '#F8FAFC' : '#EF4444' }}>
                  {currentAnalysis.kneeValgusWarning ? 'Peligro: Colapso de rodillas en valgo' : 'Alineación de rodillas con puntas de pie'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!currentAnalysis.torsoWarning ? (
                  <CheckCircle2 size={16} color="#10B981" />
                ) : (
                  <AlertTriangle size={16} color="#EF4444" />
                )}
                <span style={{ color: !currentAnalysis.torsoWarning ? '#F8FAFC' : '#EF4444' }}>
                  {currentAnalysis.torsoWarning ? 'Alerta: Torso excesivamente inclinado al frente' : 'Postura de columna y torso neutro'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
