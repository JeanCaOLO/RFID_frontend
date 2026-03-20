---
name: relentless-task-execution
description: Reglas de ejecución y entrega de código. Úsalo SIEMPRE que se te asigne una tarea de programación, refactorización o creación de una nueva feature.
---

# Relentless Task Execution

## Reglas de Entrega de Código
1. **Cero Placeholders:** NUNCA devuelvas fragmentos incompletos con comentarios como `// ... rest of the code` o `// implement logic here`. Debes entregar el archivo completo y funcional.
2. **Ejecución Completa:** No te detengas hasta que el requerimiento esté 100% implementado. Si la tarea requiere modificar varios archivos, indícalo paso a paso y entrega el código de todos ellos.
3. **Manejo de Errores Integrado:** Anticipa los fallos. Si consumes una API o un WebSocket, incluye siempre bloques `try/catch` y estados de error visuales.
4. **Programación Defensiva:** Valida siempre la existencia de los datos antes de procesarlos. Usa *Optional Chaining* (`?.`) y *Nullish Coalescing* (`??`) para evitar crashes en producción.