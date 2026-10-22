import React, { useState, useRef, useEffect } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import {
  type AthleteProfile,
  getStoredAthleteProfile,
  saveAthleteProfile,
  deleteAthleteProfile,
  extractBiometricVector
} from '../utils/faceBiometrics';
import {
  User,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AthleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: AthleteProfile | null) => void;
}

export const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<AthleteProfile | null>(getStoredAthleteProfile());
  const [nameInput, setNameInput] = useState<string>(profile?.name || 'Juan Montoya');
  const [goalInput, setGoalInput] = useState<string>(profile?.trainingGoal || 'Hipertrofia & Fuerza');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const p = getStoredAthleteProfile();
      setProfile(p);
      if (p) {
        setNameInput(p.name);
        if (p.trainingGoal) setGoalInput(p.trainingGoal);
      }
    }
  }, [isOpen]);

  const initFaceLandmarker = async (): Promise<FaceLandmarker | null> => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;

    try {
      setStatusMessage('Cargando modelo facial...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      let landmarker: FaceLandmarker | null = null;
      try {
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
      } catch (gpuErr) {
        console.warn('GPU fallback to CPU for face landmarker:', gpuErr);
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
      }

      faceLandmarkerRef.current = landmarker;
      return landmarker;
    } catch (err: unknown) {
      console.error('Face landmarker init error:', err);
      setErrorMessage('No se pudo cargar el modelo facial de MediaPipe.');
      return null;
    }
  };

  const startScan = async () => {
    setErrorMessage(null);
    setScanSuccess(false);
    setScanProgress(0);
    setIsScanning(true);
    setStatusMessage('Iniciando cámara frontal...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const landmarker = await initFaceLandmarker();
      if (!landmarker) {
        stopScanStream();
        setIsScanning(false);
        return;
      }

      setStatusMessage('Mira fijamente a la cámara para escanear tu rostro...');

      const samples: number[][] = [];
      let startTime = performance.now();

      const captureLoop = () => {
        if (!videoRef.current || !landmarker) return;

        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(100, Math.round((elapsed / 2500) * 100));
        setScanProgress(progress);

        try {
          const results = landmarker.detectForVideo(videoRef.current, now);
          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const vec = extractBiometricVector(landmarks);
            if (vec.length > 0) {
              samples.push(vec);
              setStatusMessage(`Escaneando rasgos faciales: ${samples.length} muestras`);
            }
          } else {
            setStatusMessage('Centra tu rostro frente a la cámara...');
          }
        } catch (e) {
          console.warn('Frame detection skipped:', e);
        }

        if (elapsed < 2500 || samples.length < 15) {
          animFrameRef.current = requestAnimationFrame(captureLoop);
        } else {
          // Average the sampled vectors for a stable signature
          const vectorDim = samples[0].length;
          const avgVector: number[] = new Array(vectorDim).fill(0);

          samples.forEach((sample) => {
            sample.forEach((val, i) => {
              avgVector[i] += val;
            });
          });

          // Normalize
          const totalSamples = samples.length;
          for (let i = 0; i < vectorDim; i++) {
            avgVector[i] = avgVector[i] / totalSamples;
          }

          const magnitude = Math.sqrt(avgVector.reduce((sum, v) => sum + v * v, 0));
          const finalVector = avgVector.map((v) => v / magnitude);

          const newProfile: AthleteProfile = {
            id: `athlete_${Date.now()}`,
            name: nameInput.trim() || 'Atleta Hercules',
            registeredAt: new Date().toISOString(),
            biometricVector: finalVector,
            trainingGoal: goalInput.trim()
          };

          saveAthleteProfile(newProfile);
          setProfile(newProfile);
          onProfileUpdated(newProfile);

          setScanSuccess(true);
          setIsScanning(false);
          setStatusMessage('¡Rostro registrado y perfil biométrico guardado con éxito!');
          stopScanStream();
        }
      };

      startTime = performance.now();
      animFrameRef.current = requestAnimationFrame(captureLoop);
    } catch (err: unknown) {
      console.error('Scan camera error:', err);
      setIsScanning(false);
      setErrorMessage('Error al acceder a la cámara para el escaneo.');
      stopScanStream();
    }
  };

  const stopScanStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleDeleteProfile = () => {
    deleteAthleteProfile();
    setProfile(null);
    setScanSuccess(false);
    onProfileUpdated(null);
  };

  if (!isOpen) return null;

  return (
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
      onClick={() => {
        stopScanStream();
        onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#0B0F19',
          border: '1px solid #1E293B',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: '#0F172A',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#38BDF8" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase' }}>
              Perfil Biométrico de Atleta
            </h3>
          </div>

          <button
            onClick={() => {
              stopScanStream();
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Badge */}
          <div
            style={{
              padding: 12,
              background: profile ? '#064E3B' : '#0F172A',
              border: '1px solid',
              borderColor: profile ? '#10B981' : '#334155',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {profile ? <CheckCircle2 size={20} color="#10B981" /> : <User size={20} color="#94A3B8" />}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', display: 'block' }}>
                  {profile ? `Atleta Registrado: ${profile.name}` : 'Ningún atleta registrado'}
                </span>
                <span style={{ fontSize: 11, color: profile ? '#A7F3D0' : '#64748B' }}>
                  {profile
                    ? `Huella biométrica activa (${profile.biometricVector.length} dimensiones)`
                    : 'Registra tu rostro para autenticación automática sin manos'}
                </span>
              </div>
            </div>

            {profile && (
              <button
                onClick={handleDeleteProfile}
                title="Eliminar perfil registrado"
                style={{
                  background: '#7F1D1D',
                  border: '1px solid #B91C1C',
                  color: '#F8FAFC',
                  padding: '4px 8px',
                  borderRadius: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11
                }}
              >
                <Trash2 size={12} /> Borrar
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                Nombre del Atleta:
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ej. Juan Montoya"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#090D16',
                  border: '1px solid #334155',
                  borderRadius: 3,
                  color: '#F8FAFC',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                Objetivo de Entrenamiento:
              </label>
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Ej. Hipertrofia Tren Inferior & Core"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: '#090D16',
                  border: '1px solid #334155',
                  borderRadius: 3,
                  color: '#F8FAFC',
                  fontSize: 13,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Scan Camera Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 220,
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
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: isScanning ? 'block' : 'none'
              }}
            />

            {!isScanning && (
              <div style={{ textAlign: 'center', color: '#64748B', padding: 16 }}>
                <Camera size={36} style={{ margin: '0 auto 8px auto', color: '#334155' }} />
                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                  {scanSuccess
                    ? '¡Escaneo biométrico completado con éxito!'
                    : 'Haz clic en "Iniciar Escaneo Facial"'}
                </p>
              </div>
            )}

            {/* Scanning Target Crosshair overlay */}
            {isScanning && (
              <div
                style={{
                  position: 'absolute',
                  width: 140,
                  height: 170,
                  border: '2px dashed #38BDF8',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Progress bar overlay */}
            {isScanning && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 12,
                  right: 12,
                  background: 'rgba(9, 13, 22, 0.85)',
                  padding: '6px 10px',
                  borderRadius: 3,
                  border: '1px solid #334155',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ flex: 1, height: 4, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${scanProgress}%`, height: '100%', background: '#38BDF8' }} />
                </div>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{scanProgress}%</span>
              </div>
            )}
          </div>

          {/* Status & Error texts */}
          {statusMessage && (
            <span style={{ fontSize: 12, color: scanSuccess ? '#10B981' : '#38BDF8', textAlign: 'center' }}>
              {statusMessage}
            </span>
          )}

          {errorMessage && (
            <div
              style={{
                background: '#450A0A',
                border: '1px solid #991B1B',
                color: '#FCA5A5',
                padding: '8px 12px',
                borderRadius: 3,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <AlertTriangle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={startScan}
            disabled={isScanning}
            style={{
              padding: '10px 16px',
              background: isScanning ? '#1E293B' : '#0284C7',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: 4,
              cursor: isScanning ? 'wait' : 'pointer',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isScanning ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
            <span>
              {isScanning
                ? 'Escaneando Malla Facial 3D...'
                : profile
                ? 'Actualizar Escaneo Facial'
                : 'Iniciar Escaneo Facial de 2 Segundos'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
