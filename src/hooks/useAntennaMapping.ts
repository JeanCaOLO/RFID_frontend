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

    // El backend actualiza estado y potencia aplicada: reflejarlo en vivo.
    const channel = supabase
      .channel("antenna_mapping_stream")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "antennas" },
        (payload) => {
          const row = payload.new as AntennaRow;
          setAntennas((prev) =>
            prev.map((a) => (a.id === row.id ? { ...row, readers: a.readers } : a))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "readers" },
        (payload) => {
          const row = payload.new as ReaderRow;
          setReaders((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const updateAntenna = useCallback(
    async (
      id: number,
      changes: Partial<
        Pick<
          AntennaRow,
          | "dock_door"
          | "zone_name"
          | "wms_reader_id"
          | "is_active"
          | "tx_power_dbm"
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
