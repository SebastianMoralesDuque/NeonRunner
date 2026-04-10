# Neon Runner 🎮

Un **endless runner 3D** con estética cyberpunk/synthwave construido con React, Three.js y Zustand. Esquiva obstáculos, recoge power-ups y elige modificadores de dificultad en tiempo real mientras la velocidad y el entorno evolucionan sin parar.

## 📸 Capturas de Pantalla

| Pantalla Principal | Gameplay |
|---|---|
| ![Pantalla Principal](assets/screnshoots/pantalla-principal.png) | ![Gameplay](assets/screnshoots/image-gameplay.png) |

| Selector de Modificadores | Game Over |
|---|---|
| ![Modificadores](assets/screnshoots/selector-modifiers.png) | ![Game Over](assets/screnshoots/game-over.png) |

## ✨ Características

- **Escena 3D inmersiva** con galaxia de partículas, sol retro synthwave, niebla volumétrica y efectos de post-procesado (bloom)
- **4 carriles** con obstáculos generados proceduralmente que aumentan en velocidad y frecuencia
- **Sistema de modificadores**: cada 500 puntos el juego se pausa y debes elegir entre 3 cartas de dificultad (controles invertidos, pantalla girada 180°, obstáculos parpadeantes, nave invisible, delay de input, doble tap, velocidad x2…) que multiplican tu puntuación
- **Power-ups coleccionables**: armas (disparo de proyectiles) y escudos temporales
- **Temas dinámicos**: la paleta de colores del escenario cambia cada 600 puntos entre 10 temas (Cyan/Magenta, Emerald/Gold, Crimson/Orange, Toxic Green, Monochrome…)
- **Efectos visuales**: screen flash, camera shake, speed lines, explosiones, overlay de scanlines CRT
- **Audio procedural**: efectos de sonido generados con Web Audio API + Howler (disparo, impacto, power-up, escudo, game over)
- **Análisis de decisiones con IA (Ollama)**: al finalizar cada partida, un modelo local de Ollama analiza las elecciones de modificadores del jugador y genera un perfil de riesgo con personalidad cyberpunk cínica y burlona
- **Persistencia local**: high score y últimas elecciones de modificadores guardados en `localStorage`
- **HUD completo**: puntuación, high score, velocidad, indicador de power-up/escudo, modificador activo con countdown
- **Controles**: teclado (A/D, flechas), swipe táctil y botones en pantalla para móvil

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript |
| 3D / WebGL | Three.js + React Three Fiber + Drei |
| Post-procesado | @react-three/postprocessing |
| Estado | Zustand |
| UI | Tailwind CSS v4 + Motion (animaciones) + Lucide (iconos) |
| Audio | Howler + Web Audio API (procedural) |
| IA | Ollama (API compatible con OpenAI) — modelo `nemotron-3-super:cloud` para análisis de decisiones del jugador |
| Build | Vite 6 |

## 🚀 Cómo ejecutar localmente

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (puerto 3000)
npm run dev

# Build de producción
npm run build

# Previsualizar build
npm run preview

# Type-check
npm run lint
```

### Controles

| Acción | Teclado | Móvil |
|---|---|---|
| Mover izquierda | `A` / `←` | Swipe izquierda / botón |
| Mover derecha | `D` / `→` | Swipe derecha / botón |
| Disparar | `Espacio` | Botón de disparo |
| Pausar | `Esc` / `P` | — |
| Elegir modificador | `1` / `2` / `3` | Tap en la carta |

## 📂 Estructura del proyecto

```
src/
├── App.tsx                  # Componente raíz, Canvas Three.js, ErrorBoundary
├── main.tsx                 # Punto de entrada, global error handler
├── types.ts                 # Interfaces y tipos TypeScript compartidos
├── index.css                # Tailwind import + estilos globales
├── store/
│   └── gameStore.ts         # Zustand store (todo el estado + lógica del juego)
├── hooks/
│   └── useAudio.ts          # Hook de audio (Howler + Web Audio API)
├── audio/
│   └── sfx.ts               # SFX procedurales (shoot, hit, powerup, game over)
└── components/game/
    ├── Player.tsx           # Nave del jugador
    ├── Road.tsx             # Carretera con líneas de carril
    ├── Obstacles.tsx        # Obstáculos 3D
    ├── PowerUp.tsx          # Sistema de power-ups (arma + escudo)
    ├── Projectiles.tsx      # Proyectiles
    ├── Effects.tsx          # Post-procesado (bloom, etc.)
    ├── Galaxy.tsx           # Fondo de galaxia con partículas
    ├── Sun.tsx              # Sol retro estilo synthwave
    ├── HUD.tsx              # Interfaz de puntuación y estado
    ├── StartScreen.tsx      # Pantalla de inicio
    ├── ModifierCards.tsx    # Selector de modificadores
    ├── CameraShake.tsx      # Efecto de sacudida de cámara
    ├── Explosions.tsx       # Sistema de explosiones
    ├── SpeedLines.tsx       # Líneas de velocidad
    └── DecisionLog.tsx      # Log de decisiones de modificadores
```

## 📜 Cumplimiento de reglas de la Hackatón

- ✅ Proyecto nuevo (sin usuarios reales previos)
- ✅ Repositorio público con demo accesible
- ✅ Documentación completa: descripción, capturas de pantalla
- ✅ Proyecto funcional al momento de la revisión
