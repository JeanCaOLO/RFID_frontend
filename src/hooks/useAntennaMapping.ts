import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AntennaRow, ReaderRow } from "../types/rfid.types";

/**
 * Gestiona el mapeo antena -> puerta de despacho.
 * Lee `antennas` (con join a `readers`) y permite actualizar la puerta/zona.
 */
export const useAntennaMapping = () => {
  const [antennas, setAntennas] = useState<AntennaRow[]>([]);
  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [antennasRes, readersRes] = await Promise.all([
      supabase
        .from("antennas")
        .select("*, readers(name)")
        .order("reader_id", { ascending: true })
        .order("antenna_port", { ascending: true }),
      supabase.from("readers").select("*").order("id", { ascending: true })
    ]);

    if (antennasRes.error) {
      setError(antennasRes.error.message);
    } else {
      setAntennas((antennasRes.data as AntennaRow[]) ?? []);
    }
    if (readersRes.error) {
      setError((prev) => prev ?? readersRes.error!.message);
    } else {
      setReaders((readersRes.data as ReaderRow[]) ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateAntenna = useCallback(
    async (
      id: number,
      changes: Partial<
        Pick<
          AntennaRow,
          "dock_door" | "zone_name" | "wms_reader_id" | "is_active"
        >
      >
    ) => {
      const { error: updateError } = await supabase
        .from("antennas")
        .update(changes)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setAntennas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...changes } : a))
      );
      return true;
    },
    []
  );

  return { antennas, readers, loading, error, reload: load, updateAntenna };
};
