import type { Exercise } from '../types/workout';

export const EXERCISES: Exercise[] = [
  {
    id: 'goblet-squat',
    name: 'Goblet Squat con Mancuerna / Disco',
    muscleGroup: 'pierna',
    category: 'Fuerza',
    targetMuscles: ['Cuádriceps (Vasto externo, interno, recto femoral)', 'Glúteo Mayor'],
    secondaryMuscles: ['Core (Transverso, Recto abdominal)', 'Erectores espinales', 'Aductores'],
    equipment: 'Mancuerna o Disco',
    recommendedSets: 4,
    recommendedReps: '10 - 12 reps',
    restSeconds: 90,
    tempo: '3-1-1-0 (3s bajada, 1s pausa abajo, 1s subida explosiva)',
    difficulty: 'Intermedio',
    summary: 'El estándar de oro para hipertrofia de cuádriceps en casa. La carga anterior obliga a mantener el torso erguido y maximiza la profundidad articular sin flexión lumbar.',
    setup: [
      'Sostén una mancuerna verticalmente con ambas manos pegada a la parte superior del pecho (o un disco pesado abrazado al pecho).',
      'Pies separados al ancho de hombros, con las puntas ligeramente abiertas hacia afuera (15° a 25°).',
      'Retrae escápulas y mantén los codos apuntando hacia el suelo, no abiertos como alas.',
      'Activa el core tomando aire diafragmático y creando presión intraabdominal antes de descender.'
    ],
    execution: [
      'Inicia el movimiento desbloqueando caderas y flexionando rodillas simultáneamente.',
      'Baja de forma controlada en 3 segundos, permitiendo que las rodillas viajen en la misma dirección que las puntas de los pies.',
      'Alcanza al menos profundidad paralela (cadera al nivel de rodillas o inferior si la movilidad lo permite sin redondear el cóccix).',
      'Pausa 1 segundo en el punto más profundo para anular el rebote elástico.',
      'Empuja el piso con toda la planta del pie (trípode del pie) contrayendo cuádriceps y glúteos hasta la extensión completa sin hiperextender rodillas.'
    ],
    breathing: 'Inhala profundamente en la posición inicial llenando el abdomen de aire (brace). Retén durante el descenso y el punto de inversión. Exhala con fuerza superando el 60% de la fase concéntrica (subida).',
    commonMistakes: [
      'Colapso en valgo de rodillas (las rodillas se van hacia adentro al subir).',
      'Despegar los talones del piso por falta de dorsiflexión de tobillo.',
      'Inclinar excesivamente el torso hacia adelante perdiendo la posición de copa de la mancuerna.',
      'Acortar el rango de movimiento haciendo cuartos de sentadilla.'
    ],
    proTips: [
      'Si tus talones tienden a levantarse, coloca dos discos pequeños de 1.25 kg bajo tus talones para elevarlos ligeramente.',
      'Mantén los codos por dentro de las rodillas en el punto más bajo: sirve como guía de apertura y profundidad.'
    ],
    videoEmbedId: 'MeIiIdtwEl4', // Goblet Squat execution guide
    simulationType: 'goblet-squat'
  },
  {
    id: 'romanian-deadlift',
    name: 'Peso Muerto Rumano con Mancuernas',
    muscleGroup: 'pierna',
    category: 'Hipertrofia',
    targetMuscles: ['Isquiotibiales (Bíceps femoral, Semitendinoso, Semimembranoso)', 'Glúteo Mayor'],
    secondaryMuscles: ['Erectores de la columna', 'Dorsales (estabilización)', 'Antebrazos (agarre)'],
    equipment: 'Mancuerna',
    recommendedSets: 4,
    recommendedReps: '10 - 12 reps',
    restSeconds: 90,
    tempo: '3-1-1-0 (3s descenso controlado rozando piernas, 1s estiramiento, 1s contracción de glúteo)',
    difficulty: 'Intermedio',
    summary: 'El ejercicio más eficiente con mancuernas para desarrollar la cadena posterior. Aplica máxima tensión mecánica con los isquios en elongación completa.',
    setup: [
      'Ponte de pie sosteniendo una mancuerna en cada mano frente a tus muslos con agarre prono neutro.',
      'Pies colocados al ancho de las caderas (más estrechos que en sentadilla) con puntas al frente.',
      'Retracción escapular activa: imagina exprimir dos naranjas en tus axilas para encender los dorsales y fijar la columna.',
      'Micro-flexión de rodillas fija (15° a 20°): este ángulo de rodilla NO cambia durante todo el recorrido.'
    ],
    execution: [
      'Inicia el movimiento enviando la cadera hacia atrás (bisagra de cadera / hip hinge), como si quisieras tocar la pared detrás de ti con los glúteos.',
      'Las mancuernas deben descender rozando literalmente tus piernas (muslos, rótulas, espinillas) para reducir el brazo de palanca sobre la zona lumbar.',
      'Baja hasta que sientas una tensión elástica profunda en tus isquiotibiales (usualmente justo debajo de la rótula o mitad de espinilla).',
      'No fuerces bajar más si tu espalda comienza a redondearse: el límite lo dicta la flexibilidad de los isquios, no el suelo.',
      'Empuja la cadera hacia adelante contrayendo glúteos fuertemente para volver a la posición erguida.'
    ],
    breathing: 'Inhala arriba bloqueando el core. Mantén la presión abdominal intacta mientras flexionas la cadera hacia atrás. Exhala cuando la cadera termine de bloquear al frente.',
    commonMistakes: [
      'Convertir el ejercicio en sentadilla flexionando excesivamente las rodillas durante la bajada.',
      'Separar las mancuernas del cuerpo, lo que transfiere toda la carga nociva a las vértebras lumbares.',
      'Redondear la espalda dorsal/lumbar para buscar que las mancuernas toquen el piso.',
      'Hiperextender la espalda baja al final del movimiento en vez de bloquear con glúteos.'
    ],
    proTips: [
      'Enfócate en empujar las caderas hacia atrás, no en bajar el torso hacia abajo. El torso baja como consecuencia del retroceso de cadera.',
      'El peso del cuerpo debe distribuirse en el centro-talón del pie sin despegar los dedos.'
    ],
    videoEmbedId: 'jey_c68II9U', // Romanian Deadlift Dumbbells
    simulationType: 'romanian-deadlift'
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Sentadilla Búlgara Unilateral',
    muscleGroup: 'pierna',
    category: 'Fuerza',
    targetMuscles: ['Cuádriceps', 'Glúteo Mayor y Medio', 'Aductores'],
    secondaryMuscles: ['Isquiotibiales', 'Core (estabilidad lumbo-pélvica)', 'Gemelos'],
    equipment: 'Mancuerna',
    recommendedSets: 3,
    recommendedReps: '8 - 10 reps por pierna',
    restSeconds: 90,
    tempo: '3-1-1-0 (3s bajada estricta, 1s pausa, subida continua)',
    difficulty: 'Avanzado',
    summary: 'El ejercicio rey unilateral para tren inferior. Elimina asimetrías de fuerza entre piernas, genera hipertrofia brutal con peso moderado y no comprime la columna.',
    setup: [
      'Colócate de espaldas a un banco, silla firme o sofá a la altura de tu rodilla.',
      'Apoya el empeine del pie trasero sobre el soporte.',
      'Da un paso amplio con la pierna delantera (aproximadamente 3 pies de distancia).',
      'Sostén una mancuerna en cada mano con brazos extendidos a los lados del torso.',
      'Inclina levemente el torso hacia adelante (15°) para maximizar la alineación fémur-glúteo.'
    ],
    execution: [
      'Baja vertical y diagonalmente flexionando la pierna delantera hasta que la rodilla trasera quede a 2-3 cm del suelo.',
      'La pierna delantera soporta el 85-90% de la carga total; el pie trasero solo aporta equilibrio.',
      'Mantén la rodilla delantera alineada con el segundo dedo del pie (evita que se cierre hacia adentro).',
      'Haz una micropausa abajo y empuja con el mediopié/talón delantero para regresar al punto de partida sin bloquear bruscamente la articulación.'
    ],
    breathing: 'Inhala arriba contrayendo abdomen y glúteo. Mantén tensión durante el descenso. Exhala mientras impulsas con la pierna delantera de regreso.',
    commonMistakes: [
      'Paso delantero demasiado corto, lo que genera pinzamiento excesivo en la rótula.',
      'Empujar con la pierna trasera en vez de activar los cuádriceps y glúteo de la pierna delantera.',
      'Girar la pelvis o inclinarse lateralmente hacia el lado del apoyo.',
      'Rebotar la rodilla trasera contra el suelo.'
    ],
    proTips: [
      'Para enfocarte en glúteo: inclina el torso 20° hacia adelante y da un paso ligeramente más largo.',
      'Para enfocarte en cuádriceps: mantén el torso más vertical y permite un mayor avance de la rodilla delantera sobre la punta del pie.'
    ],
    videoEmbedId: '2C-uNgKwPLE', // Bulgarian Split Squat tutorial
    simulationType: 'bulgarian-split-squat'
  },
  {
    id: 'standing-calf-raises',
    name: 'Elevación de Talones de Pie con Mancuernas',
    muscleGroup: 'pierna',
    category: 'Hipertrofia',
    targetMuscles: ['Gastrocnemio (Gemelos externo e interno)', 'Sóleo'],
    secondaryMuscles: ['Tibial posterior', 'Flexor largo de los dedos'],
    equipment: 'Mancuerna o Disco',
    recommendedSets: 3,
    recommendedReps: '15 - 20 reps',
    restSeconds: 60,
    tempo: '2-2-1-2 (2s estiramiento profundo, 1s subida explosiva, 2s contracción isométrica máxima arriba)',
    difficulty: 'Principiante',
    summary: 'Aísla la musculatura de la pantorrilla. La clave de este ejercicio no es el peso desmedido sino la pausa isométrica en contracción y el estiramiento completo en la base.',
    setup: [
      'Párate sobre el borde de un escalón o sobre un disco pesado colocado en el suelo, con los metatarsos apoyados y los talones en el aire.',
      'Sostén una mancuerna pesada con una mano (o dos mancuernas) y utiliza la otra mano para estabilizar el equilibrio contra una pared.',
      'Mantén las rodillas casi bloqueadas (con una micro-flexión no perceptible para proteger la cápsula posterior).'
    ],
    execution: [
      'Baja los talones de manera controlada por debajo del nivel del disco/escalón hasta sentir un estiramiento marcado en los gemelos.',
      'Mantén esa posición de estiramiento durante 2 segundos completos para disipar la energía elástica del tendón de Aquiles.',
      'Elévate sobre la punta de los pies empujando principalmente con el primer y segundo metatarso (dedo gordo).',
      'Aprieta los gemelos en la cima durante 2 segundos completos antes de descender nuevamente.'
    ],
    breathing: 'Inhala mientras desciendes al estiramiento; exhala al contraer y elevar los talones en la cima.',
    commonMistakes: [
      'Rebotar rápidamente con rebote tendinoso sin darle estímulo muscular al gemelo.',
      'Cargar el peso hacia el borde externo del pie (dedo meñique), restando trabajo a la cabeza medial del gemelo.',
      'Flexionar las rodillas para ayudarse a subir.'
    ],
    proTips: [
      'El tendón de Aquiles almacena muchísima elasticidad: si no haces una pausa de 2 segundos en el fondo, estás entrenando el tendón, no el músculo.'
    ],
    videoEmbedId: 'gwLzBJYoWlI', // Standing Calf Raise
    simulationType: 'calf-raise'
  },
  {
    id: 'plank-pull-through',
    name: 'Plank Pull-Through con Mancuerna / Disco',
    muscleGroup: 'abdomen',
    category: 'Estabilidad de Core',
    targetMuscles: ['Transverso abdominal', 'Oblicuos internos y externos', 'Multífidos'],
    secondaryMuscles: ['Deltoides anterior', 'Pectoral', 'Serrato anterior', 'Glúteo mayor (estabilizador)'],
    equipment: 'Mancuerna o Disco',
    recommendedSets: 3,
    recommendedReps: '12 - 14 pases totales (6-7 por lado)',
    restSeconds: 60,
    tempo: '2-1-2-0 (2s arrastre controlado, 1s pausa con apoyo unilateral)',
    difficulty: 'Intermedio',
    summary: 'Ejercicio top de anti-rotación y estabilidad lumbo-pélvica. Al pasar la carga de un lado al otro en apoyo de tres extremidades, el core debe resistir la torsión axial del tronco.',
    setup: [
      'Colócate en posición de plancha alta con palmas apoyadas en el suelo directamente debajo de los hombros y brazos estirados.',
      'Pies separados al ancho de hombros (o ligeramente más anchos para mayor base de estabilidad pélvica).',
      'Coloca una mancuerna o un disco plano en el suelo, justo detrás de tu muñeca derecha.',
      'Aprieta glúteos y contrae el abdomen metiendo ligeramente la pelvis en retroversión neutra.'
    ],
    execution: [
      'Sin mover ni oscilar las caderas, levanta la mano IZQUIERDA y cruza por debajo de tu pecho para sujetar la mancuerna ubicada a la derecha.',
      'Arrastra la mancuerna de manera controlada por el suelo hasta posicionarla a la izquierda de tu cuerpo, detrás de donde apoyará la mano izquierda.',
      'Apoya la mano izquierda firmemente en el suelo.',
      'Ahora toma la mancuerna con la mano DERECHA cruzando por debajo y arrástrala de regreso a la derecha.',
      'Repite alternando lados manteniendo el nivel de las caderas completamente paralelo al suelo (como si tuvieras un vaso de agua en la espalda baja).'
    ],
    breathing: 'Respira rítmicamente sin hiperventilar ni bloquear la respiración por completo. Exhala en el momento en que despegas la mano y arrastras la carga.',
    commonMistakes: [
      'Girar y rotar la pelvis hacia el lado del movimiento (pierde toda la efectividad de anti-rotación).',
      'Dejar caer la cadera hacia el suelo perdiendo la alineación lumbar (lordosis forzada).',
      'Colocar las manos demasiado adelantadas con respecto a la línea de hombros.'
    ],
    proTips: [
      'Si sientes que tus caderas se mueven de lado a lado, separa aún más los pies. Una base ancha facilita el control pélvico.',
      'No lances la mancuerna; deslízala rozando el piso con velocidad constante.'
    ],
    videoEmbedId: 'r5cWbT67zFc', // Plank pull through
    simulationType: 'plank-pull-through'
  },
  {
    id: 'weighted-russian-twists',
    name: 'Russian Twists con Disco o Mancuerna',
    muscleGroup: 'abdomen',
    category: 'Hipertrofia',
    targetMuscles: ['Oblicuos externos e internos', 'Recto abdominal'],
    secondaryMuscles: ['Flexores de cadera (Iliopsoas)', 'Transverso del abdomen'],
    equipment: 'Mancuerna o Disco',
    recommendedSets: 3,
    recommendedReps: '16 - 20 giros totales (8-10 por lado)',
    restSeconds: 60,
    tempo: '2-1-2-0 (rotación controlada con toque suave)',
    difficulty: 'Intermedio',
    summary: 'Construye fuerza rotacional y grosor en la pared anterolateral del abdomen. Exige control estricto de la columna torácica evitando tirones en las lumbares.',
    setup: [
      'Siéntate en el suelo con rodillas flexionadas a 90° y los talones apoyados en el suelo (o flotando a 5 cm para mayor dificultad).',
      'Sostén un disco o mancuerna con ambas manos frente al pecho.',
      'Inclina el torso hacia atrás a 45° manteniendo la espalda plana y el pecho abierto (nunca jorobado).',
      'Activa el core antes de iniciar el giro.'
    ],
    execution: [
      'Gira el torso lentamente hacia la derecha llevando el disco o mancuerna hacia el suelo junto a tu cadera derecha.',
      'La rotación debe originarse en la caja torácica y los hombros, no simplemente moviendo los brazos de un lado a otro.',
      'Toca suavemente el suelo con el peso (o quédate a 2 cm sin rebotar).',
      'Regresa al centro de forma controlada y rota inmediatamente hacia la izquierda.',
      'Mantén las rodillas lo más estables posible, sin que bailen de lado a lado.'
    ],
    breathing: 'Exhala en cada giro hacia los lados contrayendo los oblicuos; inhala brevemente en la transición por el centro.',
    commonMistakes: [
      'Mover solo los brazos de izquierda a derecha sin rotar la columna torácica ni el tronco.',
      'Encorvar excesivamente la espalda baja perdiendo la postura neutral.',
      'Mover violentamente las piernas para compensar la falta de fuerza en el core.'
    ],
    proTips: [
      'Si sufres molestias en la espalda baja, mantén los talones firmemente apoyados en el suelo y reduce la inclinación a 60°.'
    ],
    videoEmbedId: 'wkD8rjkodUI', // Russian Twist tutorial
    simulationType: 'russian-twist'
  },
  {
    id: 'deadbug-weighted',
    name: 'Deadbug con Disco Isométrico',
    muscleGroup: 'abdomen',
    category: 'Estabilidad de Core',
    targetMuscles: ['Transverso abdominal (faja natural)', 'Recto abdominal anterior'],
    secondaryMuscles: ['Dorsal ancho', 'Pectoral menor', 'Psoas ilíaco'],
    equipment: 'Disco',
    recommendedSets: 3,
    recommendedReps: '10 - 12 reps controladas (5-6 por pierna)',
    restSeconds: 60,
    tempo: '3-1-3-0 (3s extensión de pierna, 1s máxima tensión isométrica baja, 3s regreso)',
    difficulty: 'Principiante',
    summary: 'El ejercicio de anti-extensión más seguro y con mayor transferencia a la salud de columna. Enseña al cerebro a disociar el movimiento de extremidades manteniendo el core blindado.',
    setup: [
      'Acuéstate boca arriba en el suelo con los brazos extendidos hacia el techo sosteniendo un disco liviano/moderado (2.5 a 5 kg) con ambas manos sobre tu pecho.',
      'Flexiona las caderas y rodillas a 90° (posición de mesa o triple flexión en el aire).',
      'PEGA la espalda baja completamente contra el suelo: no debe caber ni una hoja de papel entre tus vértebras lumbares y el suelo.'
    ],
    execution: [
      'Mantén el disco estable apuntando al techo (o llévalo ligeramente hacia atrás de tu cabeza para mayor palanca sobre los dorsales y abdomen superior).',
      'Sin despegar la espalda baja del suelo, extiende una pierna hacia adelante hasta que quede a 10 cm del piso en línea recta.',
      'Pausa 1 segundo con la pierna completamente extendida sintiendo cómo el transverso del abdomen arde para evitar que la pelvis se incline hacia adelante.',
      'Regresa la pierna a la posición de 90° y repite con la pierna opuesta.'
    ],
    breathing: 'Inhala en la posición de inicio. Exhala largamente por la boca (como soplando por un pitillo) mientras extiendes la pierna, vaciando el aire y pegando aún más el ombligo a la columna.',
    commonMistakes: [
      'Arquear la espalda baja separándola del suelo durante la extensión de la pierna.',
      'Mover la pierna rápido sin control excéntrico.',
      'Mover la pierna contraria que debería permanecer quieta a 90°.'
    ],
    proTips: [
      'Si sientes que la espalda baja se despega al estirar la pierna casi al ras del suelo, no la bajes tanto: extiéndela en diagonal hacia 45° hasta ganar mayor fuerza en el transverso.'
    ],
    videoEmbedId: '4XLEnwUr1d8', // Dead bug tutorial
    simulationType: 'deadbug'
  }
];
