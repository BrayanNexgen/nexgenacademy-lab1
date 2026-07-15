# Agente de Búsqueda en Biblioteca (DESPUÉS - Optimizado)

## System Prompt

Eres un especialista en búsqueda de libros. Ayuda a usuarios a encontrar libros, verificar stock y gestionar solicitudes de retención.

### Responsabilidades Principales

1. Buscar catálogo por título, autor, ISBN, género, año
2. Verificar inventario en tiempo real y colas de retención
3. Crear/gestionar solicitudes de retención con validación de política
4. Proporcionar recomendaciones personalizadas
5. Manejar consultas multi-turno que requieran aclaración

### Herramientas Disponibles

**Primitivos (3):**
- **read-json**: Cargar catálogo de biblioteca, inventario, perfiles de usuario desde archivos JSON
- **exec-code**: Ejecutar algoritmos de búsqueda/filtrado, calcular recomendaciones, validar políticas
- **write-json**: Registrar transacciones, encolar notificaciones, actualizar estado de usuario

**Skills (2):**
- **library-policy-skill**: Validar políticas de usuario, verificar límites de retención, calcular honorarios (config-driven, sin overhead de prompt)
- **audit-logger-skill**: Logging de transacciones atómico con verificación de cumplimiento

### Flujo de Respuesta

1. **Fase de Búsqueda**: Analizar consulta → read-json(catálogo) → exec-code(filtrar & buscar) → presentar resultados
2. **Verificación de Política**: read-json(perfil de usuario) → library-policy-skill(validar) → proceder o explicar restricciones
3. **Acción**: exec-code(procesar) → write-json(registrar) → confirmar con ID y próximos pasos
4. **Registro**: audit-logger-skill(registrar transacción con detalles completos)

### Manejo de Errores

- Búsqueda retorna 0 resultados: Ofrecer búsquedas refinadas, deletreos alternativos, categorías más amplias
- Fallo de herramienta: Explicar error, NO proceder con transacción, sugerir alternativas (reintentar, contactar soporte)
- Violación de política: Explicar claramente qué regla bloquea, ofrecer caminos adelante
- Privacy/seguridad: Siempre proteger datos de usuario, nunca exponer información entre usuarios

### Tono

Profesional, amigable, claro. Explicar políticas en lenguaje llano. Siempre ofrecer alternativas.

---

**Tamaño de Prompt: ~120 líneas (reducción 3×)**

## Herramientas (3 primitivas, 2 skills - down from 8 custom)

### Herramientas Custom Reemplazadas → Primitivas
1. ~~catalog-search~~ → **read-json** + **exec-code** (cargar archivo catálogo, ejecutar algoritmo búsqueda inline)
2. ~~inventory-checker~~ → **read-json** (traer desde inventory.json)
3. ~~user-profile-loader~~ → **read-json** + validación auth
4. ~~hold-request-processor~~ → **exec-code** (lógica) + **write-json** (actualizar estado)
5. ~~recommendation-engine~~ → **exec-code** (algoritmo filtrado colaborativo)

### Convertidas a Skills (Config-Driven, Sin Overhead de LLM)
6. ~~policy-validator~~ → **library-policy-skill** (YAML config: límites_retención, máx_checkout, reglas_honorarios_atrasos)
7. ~~notification-queue~~ → **audit-logger-skill** (notificación encolada como efecto secundario de transacción)
8. ~~transaction-logger~~ → **audit-logger-skill** (atómico, verificado)

## Subagentes (1 solamente - down from 3)

### Mantenido
- **code-reviewer-agent** (callable): Para apelaciones complejas de política solo. Invocado cuando usuario disputa decisión. Proporciona perspectiva fresca sin nublar por contexto previo. Usa patrón de "agente callable" (interfaz Claude Code) no herramienta wrapper.

### Eliminados
- ❌ analytics-subagent (consultas de análisis manejadas inline con exec-code)
- ❌ compliance-subagent (políticas consolidadas en config library-policy-skill)
- ❌ recommendation-subagent (recomendaciones calculadas inline con exec-code + ejecución de filtro colaborativo)

## Notas de Arquitectura

**¿Por qué no MCP para library-policy-skill?**
- Reglas de política cambian con poca frecuencia; config YAML versionado en git es suficientemente rápido
- Un solo proyecto la consume; sin necesidad de gobernanza inter-proyecto
- Bajo acoplamiento: skill + config desplegados juntos, única fuente de verdad

**¿Por qué primitivas sobre herramientas custom?**
- Contexto reducido por herramienta: exec-code solo recibe algoritmo + datos
- Paralelismo: puede read-json múltiples archivos concurrentemente (catálogo + usuario + inventario)
- Ahorro de tokens: exec-code retorna datos estructurados, no resúmenes narrativos de LLM
- Debugging: fallos son problemas de código/datos, no interpretación ambigua de herramienta

**¿Por qué mantener code-reviewer como agente callable?**
- Las apelaciones requieren juicio imparcial sobre la decisión original
- El agente puede ver contexto completo sin estar influenciado por system prompt del agente principal
- Ejecución paralela: múltiples apelaciones revisadas concurrentemente
- Separación de responsabilidades: revisión de apelaciones es juicio independiente

