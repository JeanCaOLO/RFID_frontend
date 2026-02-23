# FXR90 RFID Dashboard System

Sistema completo para recibir lecturas RFID, simular antenas y visualizar eventos en tiempo real.

Este proyecto incluye:

 Servidor Node.js + WebSocket  
 Simulador de antena RFID  
 Dashboard web en tiempo real  
 Histórico y exportación a Excel  

---

#  Componentes del sistema

## 1 - Server (server.js)

Servidor Node.js que:

- Recibe lecturas RFID por HTTP
- Guarda historial en memoria
- Emite eventos en tiempo real por WebSocket
- Sirve el dashboard web

### Endpoints

**POST /rfid**  
Recibe lecturas RFID.

**GET /events**  
Devuelve el histórico.

**WebSocket**  
Transmite eventos en tiempo real.

---

## 2️ - Simulador (simulador.js)

Simula una antena RFID FXR90:

- Genera EPC aleatorios
- RSSI realista
- Antena aleatoria (1–4)
- Envía lecturas automáticamente

Intervalo actual: **2.5 segundos**

---

## 3️ - Dashboard (index.html)

Interfaz web que permite:

- Ver lecturas en tiempo real  
- Cargar histórico automáticamente  
- Filtrar por antena  
- Paginación automática  
- Exportar datos a Excel  
- Reconexión automática al servidor  
