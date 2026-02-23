#  FXR90 RFID Dashboard System

Guía rápida para iniciar y usar el sistema de lecturas RFID.

El sistema está compuesto por:

- Servidor RFID  
- Simulador de lecturas  
- Dashboard web en tiempo real  

---

# > Inicio rápido del flujo

Seguí estos pasos en orden.

---

## 1️ - Iniciar el servidor

Desde la carpeta del proyecto:

node server.js

Si el servidor inició correctamente verás:

 Servidor RFID en http://localhost:4000

El servidor queda escuchando lecturas RFID y enviando eventos en tiempo real.

2️ -- Abrir el dashboard

Con el servidor corriendo, abrir en el navegador:

http://localhost:4000

En pantalla verás:

estado de conexión

tabla de lecturas

filtros y exportación

Cuando esté conectado mostrará:

Conectado

3 - Iniciar el simulador RFID

Abrir otra terminal y ejecutar:

node simulador.js

El simulador comenzará a enviar lecturas automáticamente.

Ejemplo de salida:

Simulador RFID iniciado...
Enviando lectura: { tagId: ..., rssi: ..., antennaPort: ... }
 Flujo de funcionamiento

Una vez iniciado:

El simulador genera lecturas RFID.

El servidor recibe las lecturas.

El servidor guarda el historial.

El servidor envía los eventos en tiempo real.

El dashboard muestra las lecturas instantáneamente.

 Qué deberías ver

- Nuevas lecturas apareciendo en tiempo real
- EPC, antena, RSSI y hora
- Estado conectado en verde
- Paginación automática
- Filtro por antena funcional

**⏹ Detener el sistema**

Para detener:

Presionar CTRL + C en la terminal del simulador.

Presionar CTRL + C en la terminal del servidor.

 ***Notas importantes***

El servidor debe iniciarse antes que el simulador.

Si el dashboard muestra “Desconectado”, verificar que el servidor esté corriendo.

El histórico se mantiene mientras el servidor esté activo.
