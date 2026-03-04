import { useEffect, useMemo, useRef, useState } from "react";
import type { RFIDTagEvent } from "../types/rfid.types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";
const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/events";

type IncomingRFIDPayload = Partial<RFIDTagEvent> & {
  tagId?: string;
  antennaPort?: number | string;
  expectedAntenna?: number | string;
  expectedAntennaPort?: number | string;
  expected_antenna?: number | string;
  isValid?: boolean | number | string;
  is_valid?: boolean | number | string;
  valid?: boolean | number | string;
  status?: boolean | number | string;
};

const normalizeEvent = (payload: IncomingRFIDPayload) => {
  const antenna = Number(payload.antenna ?? payload.antennaPort ?? 0);
  const expectedAntennaRaw =
    payload.expectedAntenna ??
    payload.expectedAntennaPort ??
    payload.expected_antenna;
  const hasExpectedAntenna =
    expectedAntennaRaw !== undefined &&
    expectedAntennaRaw !== null &&
    String(expectedAntennaRaw).trim() !== "";
  const expectedAntenna = hasExpectedAntenna
    ? Number(expectedAntennaRaw)
    : antenna;
  const isPhysicallyValid = antenna === expectedAntenna;
  return {
    epc: payload.epc ?? payload.tagId ?? "",
    rssi: Number(payload.rssi ?? 0),
    antenna,
    expectedAntenna,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    isValid: isPhysicallyValid
  };
};

export const useRFIDStream = () => {
  const [events, setEvents] = useState<RFIDTagEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(isPaused);
  const bufferRef = useRef<RFIDTagEvent[]>([]);
  const retryTimeout = useRef<number>();

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && bufferRef.current.length) {
      setEvents((prev) => {
        const merged = [...bufferRef.current, ...prev].slice(0, 500);
        bufferRef.current = [];
        return merged;
      });
    }
  }, [isPaused]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(API_URL);
        const data = (await response.json()) as RFIDTagEvent[];
        const normalized = data.map(normalizeEvent);
        console.info("[RFID] Loaded history - raw:", data);
        console.info("[RFID] Loaded history - normalized:", normalized);
        setEvents(normalized);
      } catch (error) {
        console.error("No se pudo cargar el histórico", error);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
        retryTimeout.current = window.setTimeout(connect, 2000);
      };

      socket.onmessage = (message) => {
        try {
          console.debug("[RFID] WS raw message:", message.data);
          const data = JSON.parse(message.data) as IncomingRFIDPayload;
          console.debug("[RFID] WS parsed data:", data);
          const event = normalizeEvent(data);
          console.debug("[RFID] WS normalized event:", event);
          if (pausedRef.current) {
            bufferRef.current = [event, ...bufferRef.current].slice(0, 500);
            console.debug("[RFID] Buffered event (paused)", event);
            return;
          }
          setEvents((prev) => [event, ...prev].slice(0, 500));
        } catch (error) {
          console.error("Evento inválido", error);
        }
      };
    };

    connect();

    return () => {
      if (retryTimeout.current) {
        window.clearTimeout(retryTimeout.current);
      }
      socket?.close();
    };
  }, []);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return useMemo(
    () => ({
      events,
      isConnected,
      isPaused,
      togglePause
    }),
    [events, isConnected, isPaused]
  );
};
