import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AntennaRow, ReaderRow, ReaderStatus } from "../types/rfid.types";

// El backend reporta cada ~30s; si pasa más de esto, se considera detenido.
const STALE_AFTER_MS = 90_000;

/**
 * Estado en vivo de lectores y antenas (lo escribe el backend).
 * Lee `readers` + `antennas` y se suscribe a Realtime de ambas tablas.
 */
export const useReaderStatus = () => {
  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [antennas, setAntennas] = useState<AntennaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [readersRes, antennasRes] = await Promise.all([
      supabase.from("readers").select("*").order("id", { ascending: true }),
      supabase
        .from("antennas")
        .select("*")
        .order("reader_id", { ascending: true })
        .order("antenna_port", { ascending: true })
    ]);
    if (readersRes.error || antennasRes.error) {
      setError((readersRes.error ?? antennasRes.error)!.message);
    } else {
      setError(null);
      setReaders((readersRes.data as ReaderRow[]) ?? []);
      setAntennas((antennasRes.data as AntennaRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("reader_status_stream")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "readers" },
        (payload) => {
          const row = payload.new as ReaderRow;
          setReaders((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "antennas" },
        (payload) => {
          const row = payload.new as AntennaRow;
          setAntennas((prev) => prev.map((a) => (a.id === row.id ? row : a)));
        }
      )
      .subscribe();

    // Reloj para detectar heartbeat vencido aunque no lleguen eventos.
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(timer);
    };
  }, [load]);

  const statuses = useMemo<ReaderStatus[]>(
    () =>
      readers
        .filter((r) => r.is_active)
        .map((r) => ({
          ...r,
          antennas: antennas.filter((a) => a.reader_id === r.id && a.is_active),
          isStale:
            !r.last_seen_at ||
            now - new Date(r.last_seen_at).getTime() > STALE_AFTER_MS
        })),
    [readers, antennas, now]
  );

  // Problemas activos: lector sin conexión o antena desconectada.
  const issues = useMemo(() => {
    const list: string[] = [];
    for (const r of statuses) {
      if (r.isStale) continue;
      if (!r.is_online) {
        list.push(`${r.name} sin conexión`);
        continue;
      }
      for (const a of r.antennas) {
        if (a.connection_status === "disconnected") {
          list.push(
            `${r.name} · Antena ${a.antenna_port}${a.dock_door ? ` (${a.dock_door})` : ""} desconectada`
          );
        }
      }
    }
    return list;
  }, [statuses]);

  const backendStale = statuses.length > 0 && statuses.every((r) => r.isStale);

  return { readers: statuses, issues, backendStale, loading, error, reload: load };
};
