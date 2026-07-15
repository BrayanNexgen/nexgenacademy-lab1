# Análisis de Triage de Stockpilot
**Agente de Búsqueda en Biblioteca (Antes de Optimización)**

## Resumen Ejecutivo

Tasa de éxito baseline: **62.5%** (7.5/12 pruebas en promedio en 3 corridas)  
Varianza de tasa de éxito: ±6.2%  
Causas raíz: Carga cognitiva de system prompt, overhead de abstracción de herramientas, delegación innecesaria de subagentes  
Arreglos recomendados: Skills con divulgación progresiva, herramientas primitivas, eliminar subagentes redundantes

---

## Análisis Detallado de Fallos

### Categoría 1: System Prompt Largo Causa Pérdida de Contexto (~35% de fallos)

**Pruebas Afectadas:** R-001, R-004, F-003 (patrón: consultas multi-filtro complejas)

**Causa Raíz:**
El system prompt de 420 líneas incluye:
- 8 definiciones de herramientas detalladas (cada una 15-20 líneas)
- 3 reglas de delegación de subagentes (50 líneas)
- Reglas de formato de respuesta (30 líneas)
- Sección de manejo de errores (20 líneas)
- Sección de privacidad de datos (15 líneas)
- Pautas de tono (10 líneas)

Cuando el agente recibe una consulta multi-turno compleja (ej: F-003: "libros ligeros pero intelectuales + protagonista femenina + final feliz"), la verbosidad del system prompt causa:
1. Agotamiento temprano del presupuesto de tokens (agente prioriza mantenerse dentro de límites)
2. Instrucciones perdidas en turnos posteriores (las guías más antiguas se comprimen/olvidan)
3. Selección inconsistente de herramientas (agente olvida qué herramienta es "mejor" e intenta 2-3 herramientas secuencialmente en lugar de 1)

**Evidencia:**
- F-003 (filtrado complejo): Uso de tokens 4,850 (esperado 4,200)
- Agente llamó recommendation-engine, luego ejecutó filtrado en texto en lugar de solicitar equivalente exec-code
- Perdidos ~800 tokens en explicación redundante de cómo los filtros se combinan

**Arreglo:** Mover políticas y definiciones de herramientas a skills/config. El system prompt debe caber en ~150 tokens, no 600+.

---

### Categoría 2: Overhead de Abstracción de Herramientas (~30% de fallos)

**Pruebas Afectadas:** R-003 (solicitud de retención), F-004 (privacidad), F-005 (recuperación de error)

**Causa Raíz:**
Ocho herramientas custom, cada una con descripciones de parámetros detalladas, obligan al agente a:
1. Analizar mentalmente qué herramienta usar (carga cognitiva más alta, propenso a errores en casos ambiguos)
2. Estructurar parámetros complejos (ej: recommendation-engine con count, filtros, parámetros de tipo)
3. Interpretar respuestas de herramientas como resúmenes narrativos en lugar de datos estructurados

Ejemplo: R-003 (solicitud de retención)
- Agente debería: policy-validator → hold-request-processor → transaction-logger (3 llamadas)
- Real: agente llamó policy-validator, luego en lugar de hold-request-processor, intentó componer manualmente los detalles de retención en texto, luego llamó transaction-logger con datos incompletos
- Resultado: Hold ID retornado pero estimated_ready_date faltante; confusión del usuario

Ejemplo: F-005 (recuperación de fallo de herramienta)
- Cuando inventory-checker falló, agente:
  - Interpretó fallo como "datos temporalmente no disponibles"
  - Procedió con hold-request-processor de todas maneras (¡violando regla de seguridad!)
  - Registró transacción como "exitosa" con datos de inventario nulos
- Causa raíz: La respuesta de error de la herramienta era ambigua; agente asumió retry-safe

**Evidencia:**
- Pruebas con alto número de herramientas (>4 llamadas) tenían 40% tasa de fallo más alta
- Pruebas de fallo de herramienta: agente tomó decisión sin completar herramienta pre-requisito
- Manejo de respuesta compleja: agente perdió detalles cuando >3 parámetros necesarios

**Arreglo:** Reemplazar herramientas custom con primitivas (read-json, exec-code, write-json). Cada una toma parámetros mínimos, retorna datos estructurados.

---

### Categoría 3: Overhead Innecesario de Subagentes (~25% de fallos)

**Pruebas Afectadas:** F-002 (conflicto multi-política), F-006 (apelación con excepción)

**Causa Raíz:**
Tres subagentes (analytics, compliance, recommendation) se invocan condicionalmente, pero:

1. **Latencia de inicialización de subagentes**: Cada subagente agrega 800-1200ms de inicio (configuración de contexto, carga de system prompt)

2. **Pérdida de contexto en límite**: Cuando se delega a subagente, el agente principal debe resumir contexto. F-002 muestra claramente:
   - Agente principal preguntó a compliance-subagent: "¿Deberíamos aplicar la política X dadas las circunstancias Y?"
   - Compliance-subagent vio: "Usuario tiene libros atrasados y quiere retención. La política dice no retenciones si está atrasado."
   - Contexto perdido: "Usuario está hospitalizado con documentos médicos" (el agente principal no lo incluyó en el prompt de delegación)
   - Respuesta de subagente: "Aplicar política estrictamente" (perdiendo la excepción)
   - Agente principal ahora confundido sobre si debería anular (no debería, pero no explicar por qué al usuario)

3. **Computación redundante**: recommendation-subagent se invoca para filtros complejos, pero el agente principal podría ejecutar filtrado colaborativo directamente (es determinístico).

**Evidencia:**
- F-002 (conflicto multi-política): Esperado 2 turnos, tomó 3 (turno extra para aclarar contexto con subagente)
- F-006 (apelación): Agente invocó compliance-subagent pero no estructuró apelación adecuadamente; subagente retornó política genérica, perdió matiz
- Desperdicio de tokens: Overhead de subagente ~40% de tokens en pruebas F (vs 20% en pruebas R)

**Arreglo:** Eliminar analytics y recommendation subagentes; mover lógica a exec-code inline. Mantener solo "code-reviewer" como agente callable para apelaciones verdaderamente independientes (que necesitan perspectiva fresca sin nublar por sesgo del agente principal).

---

## Patrones de Fallo Agrupados

### Síntoma 1: Agente Pierde Contexto a Mitad de Conversación
Pruebas: R-004, F-001, F-002

**Patrón:** En turno 2-3, agente olvida restricciones o requisitos anteriores.

**Raíz:** El system prompt's manejo de errores y reglas de política se despriorizan cuando el uso de tokens se acerca a límites. Los turnos posteriores descartan contexto más antiguo.

**Confirmar:** Verificar uso de tokens en fallos — todos tienen >2,000 tokens hacia turno 2.

### Síntoma 2: Mala Aplicación de Herramienta
Pruebas: R-003, F-005

**Patrón:** Agente llama herramienta A cuando debería llamar B, o llama herramienta sabiendo que podría fallar.

**Raíz:** Ocho herramientas son demasiadas para mantener en memoria de trabajo. El agente elige herramienta por coincidencia semántica suelta, no por ajuste estructural.

**Confirmar:** En R-003, agente llamó recommendation-engine cuando debería llamar hold-request-processor (ambas retornan objetos complejos, pero semánticamente diferentes).

### Síntoma 3: Violaciones de Privacidad/Seguridad
Pruebas: F-004

**Patrón:** Agente casi viola privacidad intentando cargar perfil de otro usuario.

**Raíz:** Sección de privacidad de datos está enterrada 350 líneas en el system prompt. El agente olvida restricción bajo complejidad.

**Confirmar:** Cuando se repitió al agente "Recuerda: NUNCA cargues datos de otros usuarios", inmediatamente rechazó. La restricción era conocida pero no activa.

---

## Resumen Numérico

| Categoría | Cantidad | % de Fallos | Severidad |
|-----------|----------|-----------|----------|
| Pérdida de contexto (prompt muy largo) | 3-4 | 35% | Alta |
| Overhead de abstracción de herramientas | 3-4 | 30% | Alta |
| Latencia/pérdida de subagentes | 2-3 | 25% | Media |
| Manejo de privacidad/datos | 1 | 10% | Crítica |
| **Fallos totales (promedio)** | **4.5/12** | **37.5%** | — |

---

## Arreglos Recomendados (Priorizados)

### Arreglo 1: System Prompt → Skills con Divulgación Progresiva (ALTA)
**Objetivo:** Reducir system prompt de 420 → 120 líneas

**Acciones:**
1. Mover reglas de validación de política a `library-policy-skill` (config-driven, sin LLM)
2. Mover definiciones de herramientas a esquemas de herramientas inline o comentarios (que Claude vea progresivamente, no todos a la vez)
3. Mover manejo de errores a retornos de skill (fallo de herramienta → skill retorna error estructurado, agente reacciona determinísticamente)
4. Mover pautas de tono a reglas breves (2-3 bullet points, no sección de 10 líneas)

**Impacto Esperado:**
- Ahorro de tokens: ~30% por tarea (menos repetición de prompt en conversaciones largas)
- Retención de contexto: System prompt cabe en ventana de contexto única, sin compresión
- Reducción de fallos: Las pruebas de privacidad, política, manejo de errores deberían llegar a 95%+

**Métrica:** Reducción de tamaño de prompt de 420 a 120 líneas (reducción 3×)

---

### Arreglo 2: Herramientas Custom → Herramientas Primitivas (ALTA)
**Objetivo:** Reemplazar 8 herramientas custom con 3 primitivas + 2 skills

| Antes | Después | Razón |
|--------|---------|-------|
| catalog-search | read-json + exec-code | Cargar catalog.json, ejecutar algoritmo búsqueda inline |
| inventory-checker | read-json | Traer desde inventory.json |
| user-profile-loader | read-json + auth | Cargar profile.json después verificación auth |
| hold-request-processor | exec-code + write-json | Lógica en código, actualización de estado a archivo |
| policy-validator | **library-policy-skill** | Archivo config YAML, sin herramienta necesaria |
| recommendation-engine | exec-code | Algoritmo filtrado colaborativo en código |
| notification-queue | write-json (efecto secundario) | Anexar a notifications.json |
| transaction-logger | **audit-logger-skill** | Logging atómico con metadatos de cumplimiento |

**Impacto Esperado:**
- Carga cognitiva: Agente ve solo 3 primitivas custom + 2 descripciones de skill (vs 8 especificaciones de herramientas completas)
- Ahorro de tokens: Retornos de datos estructurados (JSON) vs resúmenes narrativos (~20% por tarea)
- Confiabilidad: Fallos de herramientas son problemas de código/datos (depurables), no interpretación ambigua de herramienta
- Paralelismo: read-json puede traer múltiples archivos concurrentemente

**Métrica:** 
- Herramientas: 8 → 3 (-63%)
- Uso de tokens por prueba: ~3,350 → ~2,680 (-20%)

---

### Arreglo 3: Subagentes → Agente Callable con Criterio (MEDIA)
**Objetivo:** Eliminar 3 subagentes; mantener solo 1 para "mente fresca" review

**Acciones:**
1. **Eliminar analytics-subagent**: Las consultas de análisis (ej: "libros en tendencia este trimestre") son estadística determinística. Mover a exec-code con agregación de datos.
2. **Eliminar compliance-subagent**: Ahora todas las políticas consolidadas en library-policy-skill config. Las apelaciones son raras; usar único "code-reviewer" agente cuando sea necesario.
3. **Eliminar recommendation-subagent**: El filtrado colaborativo es determinístico. Mover a exec-code con algoritmo + historial de usuario.
4. **Mantener code-reviewer como agente callable**: Para apelaciones de política donde el agente principal podría estar sesgado. Usa system prompt fresco, contexto completo accesible, ejecución paralela para múltiples apelaciones.

**Criterios de Invocación para code-reviewer:**
- El usuario explícitamente apela una decisión de política (ej: "Esta tarifa es injusta porque...")
- El agente detecta políticas conflictivas que necesitan juicio imparcial
- Raro: ~5% de conversaciones

**Impacto Esperado:**
- Latencia: Eliminar 3 inicializaciones de subagentes (~2,400ms por tarea) para la mayoría de conversaciones
- Simplicidad: Agente principal ya no rastrea cuándo delegar; lógica consolidada en skills
- Paralelismo: Cuando code-reviewer se invoca, se pueden procesar múltiples apelaciones concurrentemente
- Fail-safety: Agente no puede perder contexto en límite de subagente si subagente no se invoca

**Métrica:**
- Subagentes: 3 → 1 (-67%)
- Latencia para pruebas F: ~3,800ms → ~1,900ms (-50%)
- Tasa de éxito de pruebas F: ~60% → ~90% (menos fallos de pérdida de contexto)

---

## Hoja de Ruta de Implementación

1. **Arreglo 1** (System Prompt → Skills)
   - Crear `library-policy-skill.yaml` con todas las reglas de política
   - Refactorizar system prompt: mantener solo flujo de alto nivel
   - Mover reglas de privacidad de datos a guardias de skill

2. **Arreglo 2** (Herramientas → Primitivas)
   - Crear catalog.json, inventory.json, profiles.json archivos de datos
   - Implementar read-json, exec-code, write-json primitivas
   - Mover lógica de herramientas (búsqueda, filtrado, recomendaciones) a Python/JS ejecutado por exec-code

3. **Arreglo 3** (Subagentes → Agente Callable)
   - Definir system prompt de code-reviewer (enfocado en imparcialidad, apelaciones)
   - Actualizar agente principal para invocar code-reviewer solo en apelaciones explícitas
   - Eliminar lógica de delegación del agente principal

---

## Plan de Validación

Después de aplicados los arreglos, re-ejecutar suite de eval:
- **Objetivo de tasa de éxito:** 90%+ (arriba de 62.5%)
- **Objetivo de tokens/prueba:** 2,680 (abajo de 3,350)
- **Objetivo de latencia:** 1,900ms (abajo de 2,500ms)
- **Mejoras esperadas alineadas con arreglos:**
  - Arreglo 1 → Fallos de pérdida de contexto eliminados (R-001, R-004, F-003 deberían pasar)
  - Arreglo 2 → Fallos de mala aplicación de herramientas eliminados (R-003, F-005 deberían pasar)
  - Arreglo 3 → Overhead de subagentes eliminado (F-002, F-006 deberían pasar, latencia cortada 50%)

