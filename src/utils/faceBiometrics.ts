export interface AthleteProfile {
  id: string;
  name: string;
  registeredAt: string;
  biometricVector: number[]; // Scale and rotation invariant facial geometric ratios
  trainingGoal?: string;
  customDumbbellWeightKg?: number;
}

const ATHLETE_STORAGE_KEY = 'hercules_athlete_profile_v1';

export function getStoredAthleteProfile(): AthleteProfile | null {
  try {
    const raw = localStorage.getItem(ATHLETE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAthleteProfile(profile: AthleteProfile): void {
  try {
    localStorage.setItem(ATHLETE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save athlete profile', e);
  }
}

export function deleteAthleteProfile(): void {
  try {
    localStorage.removeItem(ATHLETE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to delete athlete profile', e);
  }
}

// Distance between two 2D/3D points
function dist(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z ?? 0) - (p2.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Extract scale and position invariant biometric descriptor vector (28 dimensional)
export function extractBiometricVector(
  landmarks: { x: number; y: number; z?: number }[]
): number[] {
  if (!landmarks || landmarks.length < 468) {
    return [];
  }

  // Key landmarks from MediaPipe Face Mesh (478 landmarks):
  // 1: Nose tip
  // 10: Forehead top / Glabella
  // 152: Chin / Menton bottom
  // 33, 133: Left eye inner/outer corners
  // 362, 263: Right eye inner/outer corners
  // 468: Left iris center
  // 473: Right iris center
  // 61, 291: Mouth left/right corners
  // 0, 17: Upper/lower lip centers
  // 234, 454: Left/right zygomatic cheekbones
  // 58, 288: Jaw angles

  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const leftIris = landmarks[468] || landmarks[473] || landmarks[133];
  const rightIris = landmarks[473] || landmarks[468] || landmarks[362];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthTop = landmarks[0];
  const mouthBottom = landmarks[17];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const leftJaw = landmarks[58];
  const rightJaw = landmarks[288];

  // Base normalization anchor: Interpupillary distance (distance between eyes)
  const eyeDistance = Math.max(0.001, dist(leftIris, rightIris));

  // Compute scale-invariant normalized distance ratios
  const faceHeight = dist(forehead, chin) / eyeDistance;
  const cheekWidth = dist(leftCheek, rightCheek) / eyeDistance;
  const jawWidth = dist(leftJaw, rightJaw) / eyeDistance;
  const mouthWidth = dist(mouthLeft, mouthRight) / eyeDistance;
  const mouthHeight = dist(mouthTop, mouthBottom) / eyeDistance;
  const noseToChin = dist(noseTip, chin) / eyeDistance;
  const noseToForehead = dist(noseTip, forehead) / eyeDistance;
  const noseToMouth = dist(noseTip, mouthTop) / eyeDistance;
  const leftEyeWidth = dist(leftEyeOuter, landmarks[133]) / eyeDistance;
  const rightEyeWidth = dist(landmarks[362], rightEyeOuter) / eyeDistance;

  // Intermediate point ratios along jawline & nose bridge
  const midBridge = landmarks[168];
  const bridgeToNose = dist(midBridge, noseTip) / eyeDistance;
  const bridgeToForehead = dist(midBridge, forehead) / eyeDistance;

  const leftCheekToNose = dist(leftCheek, noseTip) / eyeDistance;
  const rightCheekToNose = dist(rightCheek, noseTip) / eyeDistance;
  const leftJawToChin = dist(leftJaw, chin) / eyeDistance;
  const rightJawToChin = dist(rightJaw, chin) / eyeDistance;

  const rawVector = [
    faceHeight,
    cheekWidth,
    jawWidth,
    mouthWidth,
    mouthHeight,
    noseToChin,
    noseToForehead,
    noseToMouth,
    leftEyeWidth,
    rightEyeWidth,
    bridgeToNose,
    bridgeToForehead,
    leftCheekToNose,
    rightCheekToNose,
    leftJawToChin,
    rightJawToChin,
    dist(leftIris, noseTip) / eyeDistance,
    dist(rightIris, noseTip) / eyeDistance,
    dist(leftIris, mouthLeft) / eyeDistance,
    dist(rightIris, mouthRight) / eyeDistance,
    dist(forehead, mouthBottom) / eyeDistance,
    dist(leftCheek, chin) / eyeDistance,
    dist(rightCheek, chin) / eyeDistance
  ];

  // L2 vector normalization for cosine similarity
  const magnitude = Math.sqrt(rawVector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return rawVector;

  return rawVector.map((val) => val / magnitude);
}

// Compare current face vector with registered athlete vector using Cosine Similarity
export function calculateFaceMatch(
  v1: number[],
  v2: number[]
): { isMatch: boolean; similarityPercent: number } {
  if (!v1 || !v2 || v1.length === 0 || v2.length === 0 || v1.length !== v2.length) {
    return { isMatch: false, similarityPercent: 0 };
  }

  // Dot product of normalized vectors = Cosine Similarity (-1 to 1)
  let dotProduct = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
  }

  // Cosine distance maps ~0.90 - 1.00 for identical face poses
  // Convert to intuitive 0 - 100% scale
  const similarityScore = Math.max(0, Math.min(1, dotProduct));
  const similarityPercent = Math.round(similarityScore * 100);

  // Threshold: > 88% represents the same facial structure
  const isMatch = similarityPercent >= 88;

  return { isMatch, similarityPercent };
}
