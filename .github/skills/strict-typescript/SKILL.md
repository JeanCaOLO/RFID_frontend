---
name: strict-typescript
description: Reglas de tipado estricto. Úsalo SIEMPRE que escribas lógica de negocio, manipules estados en React o integres nuevos campos de una API o WebSocket.
---

# Strict TypeScript Enforcement

## Reglas Inquebrantables
1. **Prohibido el uso de `any`:** Bajo ninguna circunstancia puedes usar `any`. Debes crear `type` o `interface` específicos para cada estructura de datos.
2. **Parseo Defensivo:** Al recibir payloads externos (ej. WebSockets o Fetch), parsea explícitamente los datos primitivos (`Number()`, `Boolean()`, `String()`).
3. **Manejo de Undefined:** Trata todos los campos opcionales o propensos a fallos como `?`. Si una variable es potencialmente `undefined`, proporciona un valor por defecto lógico usando Nullish Coalescing (`??`).
4. **Cruce de Datos Matemático:** Si necesitas evaluar el estado de una entidad (ej. si una lectura es válida), prioriza derivar la lógica matemáticamente comparando campos (ej. `antenna === expectedAntenna`) en lugar de depender ciegamente de banderas booleanas enviadas por un servidor intermediario no confiable.