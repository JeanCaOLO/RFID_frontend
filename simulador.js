// ----------------------------------------
//  SIMULADOR DE ANTENA RFID - FXR90 (Fake)
// ----------------------------------------

const WebSocket = require("ws");
const axios = require("axios");

// CONFIGURACIÓN
const SERVER_HTTP = "http://localhost:4000/rfid";  // tu endpoint
const SERVER_WS = "ws://localhost:4000";           // tu websocket
const INTERVALO_MS = 2500;                         // cada 1 segundo

// WebSocket
let ws;

function conectarWS() {
    ws = new WebSocket(SERVER_WS);

    ws.on("open", () => console.log("WS conectado al servidor"));
    ws.on("close", () => {
        console.log("WS desconectado, reconectando...");
        setTimeout(conectarWS, 2000);
    });
}

// Generador de EPC aleatorio
function generarEPC() {
    let hex = "";
    const chars = "ABCDEF0123456789";
    for (let i = 0; i < 24; i++) hex += chars[Math.floor(Math.random() * chars.length)];
    return hex;
}

// Enviar lectura simulada
function enviarLectura() {
    const lectura = {
        tagId: generarEPC(),
        rssi: -40 - Math.floor(Math.random() * 30),
        antennaPort: Math.floor(Math.random() * 4) + 1
    };

    console.log("Enviando lectura:", lectura);

    // Enviar por HTTP
    axios.post(SERVER_HTTP, lectura).catch(() => {});

    // Enviar por WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            epc: lectura.tagId,
            rssi: lectura.rssi,
            antenna: lectura.antennaPort,
            timestamp: new Date().toISOString()
        }));
    }
}

// Iniciar simulación
conectarWS();
setInterval(enviarLectura, INTERVALO_MS);

console.log("Simulador RFID iniciado...");