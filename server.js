const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

let lastEvents = [];

// -------------------------------
// 1) Recibir lecturas RFID
// -------------------------------
app.post("/rfid", (req, res) => {
    const p = req.body;

    const event = {
        epc: p.tagId || p.EPC || null,
        rssi: p.rssi || null,
        antenna: p.antennaPort || null,
        // 🔥 NUEVOS CAMPOS: Dejamos pasar la data del simulador
        expectedAntenna: p.expectedAntenna || p.antennaPort || null, 
        isValid: p.isValid !== undefined ? p.isValid : true,         
        timestamp: new Date().toISOString()
    };

    lastEvents.unshift(event);
    lastEvents = lastEvents.slice(0, 500);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
        }
    });

    res.json({ ok: true });
});

// -------------------------------
// 2) API para obtener histórico
// -------------------------------
app.get("/events", (req, res) => {
    res.json(lastEvents);
});

// -------------------------------
// WebSocket
// -------------------------------
const wss = new WebSocket.Server({ noServer: true });

const server = app.listen(4000, () => {
    console.log("📡 Servidor RFID en http://localhost:4000");
});

server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit("connection", ws, req);
    });
});