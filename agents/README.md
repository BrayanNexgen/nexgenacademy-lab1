# Agents & Routines

Este directorio contiene agentes autónomos que ejecutan **rutinas complementarias** (generador-crítico) para mantener la salud de código del proyecto.

## Rutinas

### 1. Code Health Analyzer (Generador)

Detecta antipatrones en cambios recientes y propone mejoras.

**Archivo**: `analyzer-generator.js`

**Ejecutar manualmente**:
```bash
node agents/analyzer-generator.js
```

**Ejecutar en schedule (semanal, lunes 9 AM)**:
```
/schedule "node agents/analyzer-generator.js" 0 9 * * 1
```

**Ejecutar en loop (cada 7 días)**:
```
/loop 7d node agents/analyzer-generator.js
```

**Salida**:
- Rama: `chore/health-analysis-{TIMESTAMP}`
- Análisis: `docs/analysis-{TIMESTAMP}.json`
- Log: `logs/analyzer-{TIMESTAMP}.json`

### 2. Code Health Verifier (Crítico)

Verifica que cambios propuestos son válidos y genera reporte.

**Archivo**: `verifier-critic.js`

**Ejecutar manualmente** (automáticamente detecta rama del generador):
```bash
node agents/verifier-critic.js
```

**Ejecutar después del generador**:
```bash
node agents/analyzer-generator.js && node agents/verifier-critic.js
```

**Salida**:
- Reporte Markdown: `docs/code-health-verification-{TIMESTAMP}.md`
- Reporte JSON: `logs/verifier-{TIMESTAMP}.json`

## Flujo Típico

```
Lunes 9 AM (automático con /schedule)
  ↓
1. analyzer-generator.js corre
   - Analiza cambios de última semana
   - Crea rama chore/health-analysis-*
   - Output: docs/analysis-*.json
  ↓
2. verifier-critic.js corre (manual o automático)
   - Verifica cambios
   - Genera reporte en docs/code-health-verification-*.md
   - Output: logs/verifier-*.json
  ↓
3. Humano lee reporte
   - Si hallazgos son reales → refactor
   - Si son falsos positivos → ajustar heurísticas
  ↓
4. SKILL.md se actualiza con nuevas heurísticas
   - Generador v1.1 hace menos falsos positivos
   - Loop cierra
```

## Configuración

### analyzer-generator.js

```javascript
const CONFIG = {
  daysBack: 7,           // Analizar últimos N días
  maxFuncLines: 50,      // Función > N líneas es "grande"
  maxNestingDepth: 4,    // Profundidad máxima de nesting
  skipDirs: [...],       // Directorios a ignorar
  verifyBeforePR: true   // Ejecutar verificación antes de crear rama
};
```

### verifier-critic.js

```javascript
const CONFIG = {
  verifyTimeout: 300000,      // Timeout 5 minutos
  bundleSizeThreshold: 5,     // Alerta si bundle crece > 5%
  reportDir: 'docs',          // Dónde guardar reportes
  timestamp: '2026-07-17'
};
```

## Documentación Detallada

Ver `docs/routines-report.md` para:
- Decisiones de diseño por rutina
- Evidencia de ejecuciones
- Cómo mejora el sistema iterativamente
- Roadmap para v2.0

Ver `.claude/skills/code-health/SKILL.md` para:
- Lógica compartida
- Antipatrones buscados
- Configuración centralizada
- Iteraciones de mejora

## Integración Futura

- **GitHub Webhooks**: Trigger automático en push/PR
- **Slack**: Notificaciones de hallazgos
- **Auto-merge**: Si verificación pasa, mergear automáticamente
- **Grafana Dashboard**: Visualizar tendencias de salud de código

## Owner

Brayan Aviles (brayan.amav@nexgen.mx)
