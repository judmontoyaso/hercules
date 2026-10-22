# Hercules - Plataforma de Entrenamiento, Fuerza & Biomecánica

**Hercules** es una aplicación web y PWA diseñada para entrenar de forma estructurada, científica y orientada a la hipertrofia y salud articular, especialmente optimizada para entrenamientos en casa utilizando mancuernas ajustables y discos.

Repositorio: [judmontoyaso/hercules](https://github.com/judmontoyaso/hercules)

---

## Características Principales

### 1. Simulador Biomecánico Interactivo
- **Cinemática en Tiempo Real**: Visualización interactiva en SVG/Canvas que reproduce la trayectoria articular, ángulos de flexión de rodilla, cadera y columna.
- **Mapa de Tensión Muscular Dinámica**: Identificación visual del porcentaje de activación en músculos agonistas y estabilizadores durante la fase excéntrica, isométrica y concéntrica.
- **Control de Cadencia & Scrubber**: Barra de desplazamiento interactiva (0% a 100%) para inspeccionar la postura en cualquier instante del levantamiento, junto con control de velocidad (0.5x, 1.0x, 1.5x) y tiempos de tempo.

### 2. Guía Técnica Paso a Paso y Videos Demostrativos
- Setup inicial, respiración diafragmática y maniobra de Valsalva.
- Checklist de ejecución concéntrica y excéntrica.
- Errores comunes letales y advertencias articulares.
- Videos de demostración integrados en alta definición.

### 3. Calculadora de Armado de Mancuernas y Discos
- Permite configurar el inventario de discos disponibles en casa (discos de 5 kg, 2.5 kg, 1.25 kg, 0.5 kg y peso de la barra de mancuerna).
- Al ingresar el peso objetivo deseado por mancuerna, genera el diagrama visual de distribución simétrica por lado y la receta exacta de discos.

### 4. Rutina Estructurada: Pierna & Abdomen en Casa
Entrenamiento completo enfocado en máxima tensión mecánica y estabilidad del core:
1. **Calentamiento & Activación de Glúteo** (5 min).
2. **Goblet Squat (Sentadilla Copa)**: 4 series x 10-12 reps (Énfasis en cuádriceps y postura torácica).
3. **Peso Muerto Rumano con Mancuernas (RDL)**: 4 series x 10-12 reps (Énfasis en cadena posterior: isquiotibiales y glúteos).
4. **Sentadilla Búlgara Unilateral**: 3 series x 8-10 reps/pierna (Sobrecarga unilateral sin comprimir columna vertebral).
5. **Elevación de Talones de Pie**: 3 series x 15-20 reps con pausa isométrica de 2 segundos.
6. **Plank Pull-Through**: 3 series x 12 pases totales (Anti-rotación del core y estabilidad lumbo-pélvica profunda).
7. **Russian Twists con Carga**: 3 series x 16 giros totales (Control rotacional y oblicuos).
8. **Deadbug con Disco Isométrico**: 3 series x 10-12 reps (Anti-extensión lumbar con espalda baja fija al suelo).

### 5. Modo de Entrenamiento en Vivo (Workout Runner)
- Registro interactivo de peso real levantado y repeticiones por serie.
- **Temporizador de Descanso Automático**: Al marcar una serie como completada, se activa el cronómetro con avisos audibles sintetizados en tiempo real mediante la **Web Audio API** (sin dependencias externas ni archivos de audio pesados).
- Métricas en vivo: Volumen total levantado (kg) y tiempo acumulado de sesión.
- Historial persistente guardado localmente en `localStorage`.

---

## Pila Tecnológica

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vitejs.dev/)
- **Iconografía**: [Lucide React](https://lucide.dev/) (sin emojis, estética sobria y técnica)
- **Audio**: Web Audio API nativo para beeps y alertas de descanso sin latencia.
- **Persistencia**: LocalStorage offline-first.

---

## Instalación y Ejecución

```bash
# Clonar el repositorio
git clone https://github.com/judmontoyaso/hercules.git
cd hercules

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción
npm run build
```

---

## Estándares de Diseño y UI

- Interfaz oscura técnica (`#050811`, `#090D16`, `#0F172A`, `#1E293B`, `#38BDF8`).
- Bordes rectilíneos y sobrios (`border-radius: 4px`).
- Cero emojis: navegación e indicadores puramente tipográficos y vectoriales con Lucide.


---

## 8. Capacidades Avanzadas de Visión Artificial en Hercules (Roadmap)

Con la arquitectura de MediaPipe Pose Landmarker en el cliente ($0 USD de infraestructura), las siguientes capacidades biomecánicas son técnicamente viables y escalables:

1. **Velocity Based Training (VBT) y Bar Path Tracking**:
   - Seguimiento por coordenadas de los extremos de la mancuerna o disco para trazar la línea de trayectoria vertical.
   - Cálculo de velocidad media concéntrica (m/s) mediante derivadas temporales entre fotogramas ($\Delta y / \Delta t$).
2. **Predicción Automática de RIR (Reps in Reserve)**:
   - Medición de la pérdida de velocidad concéntrica (*velocity loss threshold*): cuando la velocidad cae más del 25% respecto a la primera repetición, la IA infiere RIR $\le 2$.
3. **Análisis de Asimetrías Bilaterales**:
   - Comparación del ángulo de rodilla izquierda vs. rodilla derecha para alertar sobre dominancia unilateral y torsión pélvica.
4. **Validación Automática de Tempo (Time Under Tension - TUT)**:
   - Cronometrado exacto de los segundos en elongación excéntrica, pausa estática y aceleración concéntrica.
5. **Gamificación y Objetivos de Realidad Aumentada (AR targets)**:
   - Renderizado de puntos objetivo virtuales en el canvas que el usuario debe interceptar con las manos o pies para asegurar el rango completo de movimiento.
