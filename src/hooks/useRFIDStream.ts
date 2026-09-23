import { useEffect, useMemo, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload
} from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { RFIDTagEvent, TagReadRow } from "../types/rfid.types";

const MAX_EVENTS = 500;

const mapRow = (row: TagReadRow): RFIDTagEvent => ({
  epc: row.epc,
  pallet: row.pallet ?? null,
  rssi: Number(row.rssi ?? 0),
  antenna: Number(row.antenna_port ?? 0),
  readerName: row.reader_name,
  dockDoor: row.dock_door,
  expectedDockDoor: row.expected_dock_door,
  timestamp: row.read_at,
  isValid: row.is_valid,
  reason: row.reason ?? undefined
});

export const useRFIDStream = () => {
  const [events, setEvents] = useState<RFIDTagEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pausedRef = useRef(isPaused);
  const bufferRef = useRef<RFIDTagEvent[]>([]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Al reanudar, vaciar el buffer acumulado durante la pausa
  useEffect(() => {
    if (!isPaused && bufferRef.current.length) {
      setEvents((prev) => {
        const merged = [...bufferRef.current, ...prev].slice(0, MAX_EVENTS);
        bufferRef.current = [];
        return merged;
      });
    }
  }, [isPaused]);

  // Carga inicial del histórico desde Supabase
  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("tag_reads")
        .select("*")
        .order("read_at", { ascending: false })
        .limit(MAX_EVENTS);

      if (error) {
        console.error("[RFID] Error cargando histórico", error);
        return;
      }
      setEvents((data as TagReadRow[]).map(mapRow));
    };

    loadHistory();
  }, []);

  // Suscripción Realtime a nuevas lecturas
  useEffect(() => {
    let channel: RealtimeChannel;

    const handleInsert = (
      payload: RealtimePostgresInsertPayload<TagReadRow>
    ) => {
      const event = mapRow(payload.new);
      if (pausedRef.current) {
        bufferRef.current = [event, ...bufferRef.current].slice(0, MAX_EVENTS);
        return;
      }
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
    };

    channel = supabase
      .channel("tag_reads_stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tag_reads" },
        handleInsert
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
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
