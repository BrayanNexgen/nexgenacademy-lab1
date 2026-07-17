---
model: sonnet
---

# Code Health Analyzer & Verifier

**Propósito**: Analizar salud de código, proponer mejoras y verificar implementación.  
**Patrón**: Generador → PR draft → Crítico → Reporte  
**Versión**: 1.0.0

## Generador: Analizar y Proponer

1. Obtener cambios del repo desde hace N días:
   - `git log --since="7 days ago" --name-only --pretty=format:"%H"`
   - Filtrar JS/TS solamente
   
2. Leer archivos modificados y buscar antipatrones:
   - Funciones > 50 líneas (proponer split)
   - Props no tipados en componentes React (proponer tipos)
   - Duplicación de lógica (proponer abstracción)
   - Variables no utilizadas (proponer eliminación)
   
3. Generar PR en rama `chore/health-analysis-{TIMESTAMP}`:
   - Un commit por tipo de mejora
   - Mensajes tipo: "refactor: split large function X"
   - Body: explicar WHY (mejora testabilidad, legibilidad)
   
4. No mergear automáticamente — esperar verificación

## Crítico: Verificar y Reportar

1. Esperar PR en rama `chore/health-analysis-*`
   
2. Clonar rama y verificar:
   - ¿Las mejoras propuestas son sintácticamente válidas? (npm run build)
   - ¿Los tipos pasaron? (npm run type-check)
   - ¿El lint pasó? (npm run lint)
   - ¿El tamaño de bundle cambió? (si aumentó > 5%, flagear)
   
3. Contar hallazgos reales (antipatrones encontrados) vs falsos positivos
   
4. Producir reporte en `docs/code-health-{TIMESTAMP}.md`:
   - Hallazgos verificados (✓ real vs ✗ falso positivo)
   - Sugerencias para próxima iteración del generador
   - Métricas (líneas analizadas, % de cobertura del análisis)

## Ciclo de Mejora (Feedback Loop)

- **Semana 1**: Generador propone, crítico verifica, genera reporte
- **Semana 2**: Leer reporte anterior, ajustar heurísticas del generador
- **Semana 3+**: Loop cerrado — el generador se vuelve más preciso

## Configuración

| Parámetro | Default | Notas |
|-----------|---------|-------|
| `DAYS_BACK` | 7 | Cuántos días atrás analizar cambios |
| `MAX_FUNC_LINES` | 50 | Límite para "función grande" |
| `MIN_BUNDLE_DELTA_ALERT` | 5% | Alerta si bundle crece > X% |
| `VERIFY_TIMEOUT` | 5m | Timeout para build/lint/type-check |

## Logs & Métricas

- Cada ejecución genera: `logs/health-{timestamp}.json`
  - Archivos analizados
  - Hallazgos por tipo
  - Tiempos de ejecución
  - Errores (si los hay)
