import { useEffect, useMemo, useRef, useState } from "react";
import type { RFIDTagEvent } from "../types/rfid.types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000";
const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/events";

const normalizeEvent = (payload: Partial<RFIDTagEvent>) => ({
  epc: payload.epc ?? "",
  rssi: Number(payload.rssi ?? 0),
  antenna: Number(payload.antenna ?? 0),
  timestamp: payload.timestamp ?? new Date().toISOString(),
  isValid: Boolean(payload.isValid)
});

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
        setEvents(data.map(normalizeEvent));
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
          const data = JSON.parse(message.data) as RFIDTagEvent;
          const event = normalizeEvent(data);
          if (pausedRef.current) {
            bufferRef.current = [event, ...bufferRef.current].slice(0, 500);
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
