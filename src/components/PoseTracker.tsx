import React, { useState, useEffect, useRef } from 'react';
import { FilesetResolver, PoseLandmarker, FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { EXERCISES } from '../data/exercises';
import { audioEngine } from '../utils/audio';
import { BiomechanicalSimulation } from './BiomechanicalSimulation';
import {
  getStoredAthleteProfile,
  extractBiometricVector,
  calculateFaceMatch
} from '../utils/faceBiometrics';
import type { AthleteProfile } from '../utils/faceBiometrics';
import {
  Camera,
  VideoOff,
  Volume2,
  VolumeX,
  RotateCcw,
  RefreshCw,
  Columns,
  Rows,
  Maximize2,
  Zap,
  Video,
  ListChecks,
  HelpCircle,
  Layers,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';

interface PoseTrackerProps {
  initialExerciseId?: string;
  onRepCountUpdate?: (exerciseId: string, completedReps: number) => void;
  onOpenProfileModal?: () => void;
  athleteProfile?: AthleteProfile | null;
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
  onRepCountUpdate,
  onOpenProfileModal,
  athleteProfile
}) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExerciseId);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [modelStatusText, setModelStatusText] = useState<string>('Iniciando red neuronal...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState<boolean>(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(true);

  // Biometric Facial Recognition State
  const [recognizedAthlete, setRecognizedAthlete] = useState<{
    name: string;
    similarity: number;
  } | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const faceFrameCountRef = useRef<number>(0);
  const hasGreetedAthleteRef = useRef<boolean>(false);
  const storedAthleteRef = useRef<AthleteProfile | null>(athleteProfile ?? getStoredAthleteProfile());

  useEffect(() => {
    storedAthleteRef.current = athleteProfile !== undefined ? athleteProfile : getStoredAthleteProfile();
    if (!storedAthleteRef.current) {
      setRecognizedAthlete(null);
    }
  }, [athleteProfile]);

  // Layout states: 'split' (Lado a lado), 'stacked' (Arriba y abajo), 'camera' (Solo cámara)
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked' | 'camera'>('split');
  // Reference guide mode: 'simulacion' | 'video' | 'tecnica'
  const [referenceMode, setReferenceMode] = useState<'simulacion' | 'video' | 'tecnica'>('simulacion');

  // Ghost reference skeleton overlay inside the same camera window
  const [showGhostOverlay, setShowGhostOverlay] = useState<boolean>(true);
  const [ghostMode, setGhostMode] = useState<'tempo' | 'target'>('tempo');
  const ghostOpacity = 0.65;
  const [matchScore, setMatchScore] = useState<number>(90);

  // Rep tracking state
  const [repCount, setRepCount] = useState<number>(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<BiomechanicalAnalysis>({
    kneeAngleDeg: 180,
    hipAngleDeg: 180,
    depthReached: false,
    kneeValgusWarning: false,
    torsoWarning: false,
    phase: 'ARRIBA',
    feedbackMessage: 'Haz clic en "Activar Cámara" para iniciar'
  });

  const [isBodyDetected, setIsBodyDetected] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastLandmarkTimestampRef = useRef<number>(-1);

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
  const initMediaPipe = async () => {
    if (poseLandmarkerRef.current) return;

    try {
      setModelStatusText('Descargando motor MediaPipe WASM...');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      setModelStatusText('Inicializando modelo PoseLandmarker...');

      let landmarker: PoseLandmarker | null = null;

      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
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
      } catch (gpuError) {
        console.warn('GPU delegate fallback to CPU:', gpuError);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
      }

      poseLandmarkerRef.current = landmarker;

      // Initialize FaceLandmarker for biometric facial recognition
      try {
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
        faceLandmarkerRef.current = faceLandmarker;
      } catch (fErr) {
        console.warn('FaceLandmarker GPU init failed, trying CPU:', fErr);
        try {
          const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1
          });
          faceLandmarkerRef.current = faceLandmarker;
        } catch (fCpuErr) {
          console.warn('FaceLandmarker load failed:', fCpuErr);
        }
      }

      setIsModelLoaded(true);
      setModelStatusText('Modelos IA listos (Cuerpo + Rostro)');
    } catch (err: unknown) {
      console.error('Failed to load MediaPipe model:', err);
      setModelStatusText('Error al cargar modelo IA');
      setErrorMessage(
        'No se pudo descargar el modelo de visión de MediaPipe. Revisa tu conexión a internet.'
      );
    }
  };

  useEffect(() => {
    initMediaPipe();

    return () => {
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  // Start webcam with robust permission handling
  const startCamera = async () => {
    setErrorMessage(null);
    setIsCameraStarting(true);

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isLocalhost) {
        setErrorMessage(
          'El navegador bloquea la cámara en conexiones HTTP no seguras. Abre la app usando HTTPS (https://localhost:5173).'
        );
        setShowPermissionHelp(true);
        setIsCameraStarting(false);
        return;
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(
        'Tu navegador no soporta o bloquea la cámara web. Abre la aplicación en Chrome o Edge moderno.'
      );
      setShowPermissionHelp(true);
      setIsCameraStarting(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('Fallback to basic video:true constraint', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            setIsCameraStarting(false);
            if (!poseLandmarkerRef.current) {
              initMediaPipe();
            }
          }).catch((playErr) => {
            console.error('Video play error:', playErr);
            setIsCameraStarting(false);
          });
        };
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setIsCameraStarting(false);
      setShowPermissionHelp(true);
      const errorObj = err as { name?: string; message?: string };

      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Permiso bloqueado: Haz clic en el ícono de candado/ajustes a la izquierda de la URL en la barra de direcciones de tu navegador y cambia Cámara a "Permitir".'
        );
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No se detectó ninguna cámara conectada.');
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        setErrorMessage('La cámara está en uso por otra app (Zoom, Teams, Meet).');
      } else {
        setErrorMessage(`Error de cámara: ${errorObj.message || 'Error desconocido'}`);
      }
    }
  };

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
    setIsCameraStarting(false);
  };

  const calculateJointAngle = (
    a: { x: number; y: number; z?: number },
    b: { x: number; y: number; z?: number },
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
          const currentTime = video.currentTime;
          if (currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = currentTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let nowMs = performance.now();
            if (nowMs <= lastLandmarkTimestampRef.current) {
              nowMs = lastLandmarkTimestampRef.current + 1;
            }
            lastLandmarkTimestampRef.current = nowMs;

            try {
              const results = landmarker.detectForVideo(video, nowMs);

              if (results.landmarks && results.landmarks.length > 0) {
                setIsBodyDetected(true);
                const landmarks = results.landmarks[0];
                const drawingUtils = new DrawingUtils(ctx);

                // Extract key anatomical landmarks
                const leftHip = landmarks[23];
                const rightHip = landmarks[24];
                const leftKnee = landmarks[25];
                const rightKnee = landmarks[26];
                const leftAnkle = landmarks[27];
                const rightAnkle = landmarks[28];
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];

                const isLeftSide = (leftKnee.visibility ?? 0) >= (rightKnee.visibility ?? 0);
                const hip = isLeftSide ? leftHip : rightHip;
                const knee = isLeftSide ? leftKnee : rightKnee;
                const ankle = isLeftSide ? leftAnkle : rightAnkle;
                const shoulder = isLeftSide ? leftShoulder : rightShoulder;

                const kneeAngle = calculateJointAngle(hip, knee, ankle);
                const hipAngle = calculateJointAngle(shoulder, hip, knee);

                // 1. GHOST REFERENCE SKELETON (Overlaid in same window)
                let currentMatchPercent = 90;

                if (showGhostOverlay) {
                  const userAnkleX = ankle.x * canvas.width;
                  const userAnkleY = ankle.y * canvas.height;
                  const userShoulderY = shoulder.y * canvas.height;
                  const userHeightPx = Math.max(120, userAnkleY - userShoulderY);

                  let ghostSinT = 1.0;
                  if (ghostMode === 'tempo') {
                    const cycleT = (performance.now() % 3800) / 3800;
                    ghostSinT = Math.sin(cycleT * Math.PI);
                  }

                  let ghostKneeX = userAnkleX + (isLeftSide ? 26 : -26) * (1 + 0.25 * ghostSinT);
                  let ghostKneeY = userAnkleY - userHeightPx * (0.28 - 0.05 * ghostSinT);
                  let ghostHipX = userAnkleX - (isLeftSide ? 18 : -18) * ghostSinT;
                  let ghostHipY = userAnkleY - userHeightPx * (0.52 - 0.24 * ghostSinT);
                  let ghostShoulderX = ghostHipX - (isLeftSide ? 12 : -12) * ghostSinT;
                  let ghostShoulderY = ghostHipY - userHeightPx * 0.38;
                  let ghostHeadX = ghostShoulderX;
                  let ghostHeadY = ghostShoulderY - userHeightPx * 0.12;

                  if (selectedExerciseId === 'romanian-deadlift') {
                    ghostHipX = userAnkleX - (isLeftSide ? 45 : -45) * ghostSinT;
                    ghostHipY = userAnkleY - userHeightPx * (0.52 - 0.06 * ghostSinT);
                    ghostKneeX = userAnkleX - (isLeftSide ? 12 : -12);
                    ghostKneeY = userAnkleY - userHeightPx * 0.28;
                    ghostShoulderX = ghostHipX - (isLeftSide ? 40 : -40) * ghostSinT;
                    ghostShoulderY = ghostHipY - userHeightPx * 0.38 * (1 - 0.45 * ghostSinT);
                    ghostHeadX = ghostShoulderX;
                    ghostHeadY = ghostShoulderY - userHeightPx * 0.12;
                  }

                  const ghostKneeAngle = calculateJointAngle(
                    { x: ghostHipX, y: ghostHipY },
                    { x: ghostKneeX, y: ghostKneeY },
                    { x: userAnkleX, y: userAnkleY }
                  );

                  const angleDiff = Math.abs(kneeAngle - ghostKneeAngle);
                  currentMatchPercent = Math.max(0, Math.min(100, Math.round(100 - angleDiff * 1.3)));
                  setMatchScore(currentMatchPercent);

                  // Draw Ghost Skeleton
                  ctx.save();
                  ctx.globalAlpha = ghostOpacity;
                  ctx.lineWidth = 6;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.strokeStyle = currentMatchPercent >= 80 ? '#10B981' : '#F59E0B';
                  ctx.setLineDash([8, 6]);

                  // Spine
                  ctx.beginPath();
                  ctx.moveTo(ghostShoulderX, ghostShoulderY);
                  ctx.lineTo(ghostHipX, ghostHipY);
                  ctx.stroke();

                  // Thigh
                  ctx.beginPath();
                  ctx.moveTo(ghostHipX, ghostHipY);
                  ctx.lineTo(ghostKneeX, ghostKneeY);
                  ctx.stroke();

                  // Shin
                  ctx.beginPath();
                  ctx.moveTo(ghostKneeX, ghostKneeY);
                  ctx.lineTo(userAnkleX, userAnkleY);
                  ctx.stroke();

                  // Foot
                  ctx.beginPath();
                  ctx.moveTo(userAnkleX - 12, userAnkleY);
                  ctx.lineTo(userAnkleX + 28, userAnkleY);
                  ctx.stroke();

                  // Head
                  ctx.beginPath();
                  ctx.arc(ghostHeadX, ghostHeadY, userHeightPx * 0.06, 0, 2 * Math.PI);
                  ctx.stroke();

                  // Ghost joints dots
                  ctx.fillStyle = '#F59E0B';
                  [
                    [ghostHeadX, ghostHeadY],
                    [ghostShoulderX, ghostShoulderY],
                    [ghostHipX, ghostHipY],
                    [ghostKneeX, ghostKneeY],
                    [userAnkleX, userAnkleY]
                  ].forEach(([gx, gy]) => {
                    ctx.beginPath();
                    ctx.arc(gx, gy, 5, 0, 2 * Math.PI);
                    ctx.fill();
                  });

                  ctx.setLineDash([]);
                  ctx.restore();
                }

                // 2. DRAW REAL USER SKELETON
                const realSkeletonColor = currentMatchPercent >= 80 ? '#10B981' : '#38BDF8';
                drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
                  color: realSkeletonColor,
                  lineWidth: 4
                });

                drawingUtils.drawLandmarks(landmarks, {
                  color: '#10B981',
                  fillColor: '#F59E0B',
                  lineWidth: 2,
                  radius: 5
                });

                // 3. FACIAL BIOMETRIC RECOGNITION (Evaluated every 10 frames)
                faceFrameCountRef.current++;
                if (faceLandmarkerRef.current && faceFrameCountRef.current % 10 === 0) {
                  try {
                    const faceResults = faceLandmarkerRef.current.detectForVideo(video, nowMs);
                    if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
                      const faceLms = faceResults.faceLandmarks[0];
                      const currentFaceVec = extractBiometricVector(faceLms);
                      const currentAthlete = storedAthleteRef.current || getStoredAthleteProfile();

                      if (currentAthlete && currentAthlete.biometricVector?.length > 0 && currentFaceVec.length > 0) {
                        const matchResult = calculateFaceMatch(currentAthlete.biometricVector, currentFaceVec);
                        if (matchResult.isMatch) {
                          setRecognizedAthlete({
                            name: currentAthlete.name,
                            similarity: matchResult.similarityPercent
                          });

                          if (!hasGreetedAthleteRef.current) {
                            hasGreetedAthleteRef.current = true;
                            speakFeedback(`Hola ${currentAthlete.name}, atleta identificado`, true);
                          }
                        } else {
                          setRecognizedAthlete(null);
                        }
                      }
                    } else {
                      setRecognizedAthlete(null);
                    }
                  } catch (faceErr) {
                    // skip frame
                  }
                }

                // Draw Biometric Reticle around Face on canvas
                if (landmarks[0]) {
                  const noseCanvasX = landmarks[0].x * canvas.width;
                  const noseCanvasY = landmarks[0].y * canvas.height;
                  const headBoxSize = Math.max(50, Math.min(100, Math.abs(ankle.y - shoulder.y) * canvas.height * 0.22));

                  ctx.save();
                  ctx.strokeStyle = recognizedAthlete ? '#10B981' : '#38BDF8';
                  ctx.lineWidth = 2;
                  const hx = noseCanvasX - headBoxSize / 2;
                  const hy = noseCanvasY - headBoxSize / 2 - 10;
                  const cLen = 12;

                  ctx.beginPath();
                  ctx.moveTo(hx, hy + cLen); ctx.lineTo(hx, hy); ctx.lineTo(hx + cLen, hy);
                  ctx.moveTo(hx + headBoxSize - cLen, hy); ctx.lineTo(hx + headBoxSize, hy); ctx.lineTo(hx + headBoxSize, hy + cLen);
                  ctx.moveTo(hx, hy + headBoxSize - cLen); ctx.lineTo(hx, hy + headBoxSize); ctx.lineTo(hx + cLen, hy + headBoxSize);
                  ctx.moveTo(hx + headBoxSize - cLen, hy + headBoxSize); ctx.lineTo(hx + headBoxSize, hy + headBoxSize); ctx.lineTo(hx + headBoxSize, hy + headBoxSize - cLen);
                  ctx.stroke();
                  ctx.restore();
                }

                const kneeValgus = Math.abs(leftKnee.x - rightKnee.x) < Math.abs(leftAnkle.x - rightAnkle.x) * 0.75;
                const torsoTooForward = hipAngle < 65;
                const depthReached = kneeAngle <= 95;

                // State Machine for Repetitions
                const stateRef = repStateRef.current;
                let currentPhase: 'ARRIBA' | 'DESCENDIENDO' | 'FONDO' | 'SUBIENDO' = 'ARRIBA';
                let message = 'Mantén la postura erguida';

                if (kneeAngle > 140) {
                  if (stateRef.state === 'GOING_UP' && stateRef.minKneeAngle <= 100) {
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

                // Highlight working knee joint on canvas
                const kneeCanvasX = knee.x * canvas.width;
                const kneeCanvasY = knee.y * canvas.height;

                ctx.beginPath();
                ctx.arc(kneeCanvasX, kneeCanvasY, 10, 0, 2 * Math.PI);
                ctx.fillStyle = depthReached ? '#10B981' : kneeValgus ? '#EF4444' : '#F59E0B';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();

                ctx.font = 'bold 16px monospace';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(`${kneeAngle}°`, kneeCanvasX + 16, kneeCanvasY + 5);
              } else {
                setIsBodyDetected(false);
              }
            } catch (detectionErr) {
              console.warn('Detection frame skipped:', detectionErr);
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
  }, [isCameraActive, isModelLoaded, selectedExerciseId, onRepCountUpdate, voiceFeedbackEnabled, showGhostOverlay, ghostMode, ghostOpacity]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Banner & Mode Selectors */}
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
            <span style={{ fontSize: 11, color: isModelLoaded ? '#10B981' : '#F59E0B' }}>
              ● {modelStatusText}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
            Entrenador IA: {currentExercise.name}
          </h2>
        </div>

        {/* Layout & Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Exercise Selector */}
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

          {/* Layout Mode Switcher */}
          <div style={{ display: 'flex', background: '#0F172A', border: '1px solid #334155', borderRadius: 4, padding: 2 }}>
            <button
              onClick={() => setLayoutMode('split')}
              title="Vista Lado a Lado (Guía + Cámara)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: layoutMode === 'split' ? '#1E293B' : 'transparent',
                color: layoutMode === 'split' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              <Columns size={13} />
              <span>Lado a Lado</span>
            </button>
            <button
              onClick={() => setLayoutMode('stacked')}
              title="Vista Arriba y Abajo (Móvil)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: layoutMode === 'stacked' ? '#1E293B' : 'transparent',
                color: layoutMode === 'stacked' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              <Rows size={13} />
              <span>Arriba/Abajo</span>
            </button>
            <button
              onClick={() => setLayoutMode('camera')}
              title="Solo Cámara Maximizado"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: layoutMode === 'camera' ? '#1E293B' : 'transparent',
                color: layoutMode === 'camera' ? '#38BDF8' : '#94A3B8',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontSize: 11
              }}
            >
              <Maximize2 size={13} />
              <span>Solo Cámara</span>
            </button>
          </div>

          {/* Voice Feedback Toggle */}
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

          {/* Camera On / Off Button */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              disabled={isCameraStarting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#0284C7',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: 4,
                cursor: isCameraStarting ? 'wait' : 'pointer',
                fontWeight: 600,
                fontSize: 13
              }}
            >
              {isCameraStarting ? <RefreshCw size={15} className="spin" /> : <Camera size={15} />}
              <span>{isCameraStarting ? 'Iniciando...' : 'Activar Cámara'}</span>
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

      {/* Permission troubleshooting box */}
      {(errorMessage || showPermissionHelp) && (
        <div
          style={{
            background: '#1E1B4B',
            border: '1px solid #4338CA',
            color: '#E0E7FF',
            padding: '14px 18px',
            borderRadius: 4,
            fontSize: 13,
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#A5B4FC' }}>
              <HelpCircle size={18} />
              <span>Cómo habilitar los permisos de cámara en tu navegador:</span>
            </div>
            <button
              onClick={() => {
                setShowPermissionHelp(false);
                setErrorMessage(null);
              }}
              style={{ background: 'transparent', border: 'none', color: '#A5B4FC', cursor: 'pointer', fontSize: 12 }}
            >
              Cerrar
            </button>
          </div>

          <p style={{ margin: 0, fontSize: 12 }}>
            {errorMessage || 'Para que la visión artificial funcione, el navegador necesita permiso para abrir la cámara.'}
          </p>

          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#CBD5E1' }}>
            <li>
              Asegúrate de estar en <strong>https://localhost:5173</strong>. Si tu navegador te mostró *"La conexión no es privada"*, haz clic en <strong>"Configuración avanzada" $\rightarrow$ "Continuar a localhost (no seguro)"</strong>.
            </li>
            <li>
              Haz clic en el <strong>ícono de candado o ajustes</strong> a la izquierda de la URL en la barra de direcciones de Chrome/Edge.
            </li>
            <li>
              Busca la opción <strong>Cámara</strong> y cámbiala de "Bloqueado" o "Preguntar" a <strong>"Permitir"</strong>.
            </li>
            <li>
              Recarga la página y vuelve a pulsar <strong>"Activar Cámara"</strong>.
            </li>
          </ol>
        </div>
      )}

      {/* Main Dual Work Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            layoutMode === 'split'
              ? 'minmax(320px, 1fr) minmax(320px, 1.2fr)'
              : '1fr',
          gap: 16
        }}
      >
        {/* LEFT / TOP PANEL: Exercise Guide (3D Simulation or Video) */}
        {layoutMode !== 'camera' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Guide Header & Tabs */}
            <div
              style={{
                background: '#090D16',
                border: '1px solid #1E293B',
                borderRadius: 4,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={15} color="#38BDF8" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
                  Técnica de Referencia
                </span>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', background: '#0F172A', border: '1px solid #334155', borderRadius: 4, padding: 2 }}>
                {[
                  { id: 'simulacion', label: 'Simulación 3D', icon: Zap },
                  { id: 'video', label: 'Video Real', icon: Video },
                  { id: 'tecnica', label: 'Checklist', icon: ListChecks }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = referenceMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setReferenceMode(tab.id as typeof referenceMode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        background: isActive ? '#1E293B' : 'transparent',
                        color: isActive ? '#38BDF8' : '#94A3B8',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500
                      }}
                    >
                      <Icon size={12} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Reference Content */}
            {referenceMode === 'simulacion' && (
              <BiomechanicalSimulation
                type={currentExercise.simulationType}
                exerciseName={currentExercise.name}
                tempo={currentExercise.tempo}
              />
            )}

            {referenceMode === 'video' && (
              <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${currentExercise.videoEmbedId}?rel=0&modestbranding=1`}
                    title={currentExercise.name}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {referenceMode === 'tecnica' && (
              <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#38BDF8', display: 'block', marginBottom: 4 }}>Protocolo de Respiración:</strong>
                  <p style={{ margin: 0, color: '#CBD5E1', lineHeight: 1.5 }}>{currentExercise.breathing}</p>
                </div>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#F59E0B', display: 'block', marginBottom: 4 }}>Puntos de Ejecución:</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#CBD5E1', lineHeight: 1.5 }}>
                    {currentExercise.execution.map((e, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT / BOTTOM PANEL: Real-time Camera Feed & Telemetry HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Video Canvas Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: layoutMode === 'stacked' ? 440 : 480,
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
                transform: 'scaleX(-1)'
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
              <div style={{ textAlign: 'center', color: '#64748B', padding: 24, zIndex: 10, maxWidth: 380 }}>
                <Camera size={48} style={{ margin: '0 auto 12px auto', strokeWidth: 1.5, color: '#334155' }} />
                <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#CBD5E1', fontWeight: 600 }}>
                  Tu cámara está desactivada
                </p>
                <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                  Actívala para compararte en vivo con la técnica de referencia de la izquierda.
                </p>
                <button
                  onClick={startCamera}
                  disabled={isCameraStarting}
                  style={{
                    padding: '10px 20px',
                    background: '#0284C7',
                    color: '#F8FAFC',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isCameraStarting ? 'wait' : 'pointer'
                  }}
                >
                  {isCameraStarting ? 'Solicitando Permisos...' : 'Activar Cámara Ahora'}
                </button>
              </div>
            )}

            {/* Top Ghost Skeleton Controls & Match Score */}
            {isCameraActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  zIndex: 25
                }}
              >
                {/* Left: Ghost Toggle & Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9, 13, 22, 0.9)', border: '1px solid #334155', borderRadius: 4, padding: '3px 8px' }}>
                  <button
                    onClick={() => setShowGhostOverlay(!showGhostOverlay)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: showGhostOverlay ? '#0284C7' : 'transparent',
                      color: showGhostOverlay ? '#F8FAFC' : '#94A3B8',
                      border: 'none',
                      borderRadius: 3,
                      padding: '3px 6px',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    <Layers size={13} />
                    <span>{showGhostOverlay ? 'Esqueleto Guía ON' : 'Esqueleto Guía OFF'}</span>
                  </button>

                  {showGhostOverlay && (
                    <button
                      onClick={() => setGhostMode(ghostMode === 'tempo' ? 'target' : 'tempo')}
                      style={{
                        background: '#1E293B',
                        color: '#38BDF8',
                        border: '1px solid #334155',
                        borderRadius: 3,
                        padding: '3px 6px',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      {ghostMode === 'tempo' ? 'Modo: Tempo (3s)' : 'Modo: Meta (90°)'}
                    </button>
                  )}
                </div>

                {/* Right side: Biometric Face Match & Ghost Calce Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {recognizedAthlete ? (
                    <div
                      style={{
                        background: 'rgba(6, 78, 59, 0.92)',
                        border: '1px solid #10B981',
                        borderRadius: 4,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <ShieldCheck size={13} color="#10B981" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>
                        {recognizedAthlete.name} ({recognizedAthlete.similarity}%)
                      </span>
                    </div>
                  ) : onOpenProfileModal ? (
                    <button
                      onClick={onOpenProfileModal}
                      style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: '#CBD5E1',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    >
                      <User size={12} color="#38BDF8" />
                      <span>Registrar Rostro</span>
                    </button>
                  ) : null}

                  {showGhostOverlay && isBodyDetected && (
                    <div
                      style={{
                        background: matchScore >= 80 ? 'rgba(6, 78, 59, 0.92)' : 'rgba(120, 53, 15, 0.92)',
                        border: '1px solid',
                        borderColor: matchScore >= 80 ? '#10B981' : '#F59E0B',
                        borderRadius: 4,
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Sparkles size={13} color={matchScore >= 80 ? '#10B981' : '#F59E0B'} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC' }}>
                        Calce: {matchScore}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Body detection guide badge */}
            {isCameraActive && !isBodyDetected && (
              <div
                style={{
                  position: 'absolute',
                  top: 52,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid #F59E0B',
                  color: '#F59E0B',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  zIndex: 20
                }}
              >
                Da unos pasos atrás para que la cámara detecte tus piernas y torso
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

          {/* Metrics & Rep Counter Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12 }}>
            {/* Rep Counter */}
            <div
              style={{
                background: '#090D16',
                border: '1px solid #1E293B',
                borderRadius: 4,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                  REPETICIONES VÁLIDAS
                </span>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#38BDF8', fontFamily: 'monospace', lineHeight: 1.1 }}>
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
                  gap: 4,
                  padding: '4px 8px',
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: '#94A3B8',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                <RotateCcw size={12} /> Reiniciar
              </button>
            </div>

            {/* Gauges */}
            <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: 4, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
              {/* Knee Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#94A3B8' }}>Rodilla (Profundidad):</span>
                  <strong style={{ color: currentAnalysis.depthReached ? '#10B981' : '#F59E0B' }}>
                    {currentAnalysis.kneeAngleDeg}° {currentAnalysis.depthReached ? '(Paralelo OK)' : ''}
                  </strong>
                </div>
                <div style={{ height: 6, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, ((180 - currentAnalysis.kneeAngleDeg) / 100) * 100))}%`,
                      height: '100%',
                      background: currentAnalysis.depthReached ? '#10B981' : '#38BDF8'
                    }}
                  />
                </div>
              </div>

              {/* Torso Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#94A3B8' }}>Cadera (Torso erguido):</span>
                  <strong style={{ color: currentAnalysis.torsoWarning ? '#EF4444' : '#F8FAFC' }}>
                    {currentAnalysis.hipAngleDeg}°
                  </strong>
                </div>
                <div style={{ height: 6, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, ((180 - currentAnalysis.hipAngleDeg) / 110) * 100))}%`,
                      height: '100%',
                      background: currentAnalysis.torsoWarning ? '#EF4444' : '#F59E0B'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
