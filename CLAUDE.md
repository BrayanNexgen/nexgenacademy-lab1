# NexGen Academy Lab 1: Agentes & Evals

**Propósito**: Laboratorio educativo para construir, evaluar y iterar agentes proactivos con bucles de retroalimentación.

**Stack**: React + TypeScript + Vite | Node.js | Claude API (multi-agent orchestration)

## Estructura del Proyecto

- **`src/`** — Aplicación React principal
- **`agents/`** — Definiciones de agentes autónomos (generadores + críticos)
- **`evals/`** — Evaluación de salidas de agentes y rutinas
- **`prompts/`** — Prompts reutilizables para agentes
- **`docs/`** — Documentación: routines, diseño de agentes, reportes de verificación
- **`.claude/skills/`** — Skills automejorables versionadas por función (deploy, code-health, etc.)

## Rutinas en Ejecución

Las rutinas están diseñadas con el patrón **generador-crítico** (un agente propone, otro verifica):

1. **`code-health-analyzer`** (generador, semanal)
   - Analiza cambios recientes en el repo
   - Propone mejoras de calidad de código
   - Dispara PRs de mejora automáticas

2. **`code-health-verifier`** (crítico, por evento)
   - Verifica cambios propuestos por el generador
   - Produce reporte con hallazgos
   - Retroalimentación para mejorar el generador

## Skills Automejorables

- **`code-health/SKILL.md`** — Lógica compartida para análisis de código y verificación

## Configuración de Permisos

Admitidos:
- `Bash(npm run *)` — Comandos de construcción/test

Denegados:
- `Bash(git push *)` — Cambios se crean como borrador primero
- `Edit(package.json)` — Evita cambios accidentales de dependencias

Preguntas:
- `Bash(rm *)` — Requiere confirmación

## Conectores Necesarios

Idealmente conectados para producción:
- **GitHub** — PR, issues, webhooks
- **Slack** — Notificaciones de rutina
- **Datadog/Grafana** — Métricas de salud (para rutinas futuras)

## Contacto

Mantener por: Brayan Aviles (brayan.amav@nexgen.mx)
