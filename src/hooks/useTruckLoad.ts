import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type {
  TruckLoadRow,
  TruckLoadGroup,
  TruckLoadHistoryEntry
} from "../types/rfid.types";

// Pallets cerrados que se traen para el historial (los más recientes).
const HISTORY_LIMIT = 3000;

/**
 * Módulo Carga Camión.
 *
 * Lee la tabla `truck_load` y se suscribe a cambios en Realtime. Separa:
 * - En carga: pallets aún no cerrados (loaded / closing / error), por placa.
 * - Historial: pallets cerrados, agrupados por ejecución (placa + closed_at).
 *
 * Para "Ejecutar carga camión" NO llama al WMS directamente: marca los pallets
 * de la placa como status='closing' en Supabase. El backend Python (único que
 * habla con el WMS) detecta ese estado, llama a POST /carga-camion/{placa}/close
 * y actualiza a 'closed' o 'error'.
 */
export const useTruckLoad = () => {
  const [activeRows, setActiveRows] = useState<TruckLoadRow[]>([]);
  const [closedRows, setClosedRows] = useState<TruckLoadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [activeRes, closedRes] = await Promise.all([
      supabase
        .from("truck_load")
        .select("*")
        .neq("status", "closed")
        .order("loaded_at", { ascending: false }),
      supabase
        .from("truck_load")
        .select("*")
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(HISTORY_LIMIT)
    ]);

    const qError = activeRes.error ?? closedRes.error;
    setError(qError ? qError.message : null);
    if (!activeRes.error) setActiveRows((activeRes.data as TruckLoadRow[]) ?? []);
    if (!closedRes.error) setClosedRows((closedRes.data as TruckLoadRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refrescamos ante cualquier cambio en truck_load.
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel("truck_load_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "truck_load" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Vista "En carga": solo pallets pendientes. Al cerrarse una placa, sus
  // pallets pasan a 'closed' y la tarjeta desaparece (queda en el historial).
  const groups = useMemo<TruckLoadGroup[]>(() => {
    const map = new Map<string, TruckLoadRow[]>();
    activeRows.forEach((row) => {
      const list = map.get(row.placa) ?? [];
      list.push(row);
      map.set(row.placa, list);
    });

    return Array.from(map.entries())
      .map(([placa, pallets]) => ({
        placa,
        pallets: pallets.sort((a, b) => (a.loaded_at < b.loaded_at ? 1 : -1)),
        pendingCount: pallets.filter(
          (p) => p.status === "loaded" || p.status === "error"
        ).length,
        isClosing: pallets.some((p) => p.status === "closing")
      }))
      .sort((a, b) => a.placa.localeCompare(b.placa));
  }, [activeRows]);

  // Historial: cada cierre marca todos los pallets de la placa con el mismo
  // closed_at, así que placa + closed_at identifica una ejecución.
  const history = useMemo<TruckLoadHistoryEntry[]>(() => {
    const map = new Map<string, TruckLoadRow[]>();
    closedRows.forEach((row) => {
      if (!row.closed_at) return;
      const key = `${row.placa}|${row.closed_at}`;
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    });

    return Array.from(map.entries())
      .map(([key, pallets]) => {
        const sorted = pallets.sort((a, b) =>
          a.loaded_at < b.loaded_at ? -1 : 1
        );
        const doors = Array.from(
          new Set(sorted.map((p) => p.dock_door).filter((d): d is string => !!d))
        ).sort();
        return {
          key,
          placa: sorted[0].placa,
          closedAt: sorted[0].closed_at as string,
          pallets: sorted,
          doors,
          firstLoadedAt: sorted[0].loaded_at
        };
      })
      .sort((a, b) => (a.closedAt < b.closedAt ? 1 : -1));
  }, [closedRows]);

  /**
   * Ejecuta el cierre de la carga de una placa: marca sus pallets abiertos
   * como 'closing'. El backend hace el cierre real en el WMS.
   */
  const executeClose = useCallback(async (placa: string) => {
    const { error: updateError } = await supabase
      .from("truck_load")
      .update({ status: "closing", close_error: null })
      .eq("placa", placa)
      .in("status", ["loaded", "error"]);

    if (updateError) {
      setError(updateError.message);
      return false;
    }
    await load();
    return true;
  }, [load]);

  /**
   * Cierra TODAS las cargas pendientes de una vez: marca como 'closing' todos
   * los pallets abiertos (de cualquier placa). El backend cierra placa por placa.
   */
  const executeCloseAll = useCallback(async () => {
    const { error: updateError } = await supabase
      .from("truck_load")
      .update({ status: "closing", close_error: null })
      .in("status", ["loaded", "error"]);

    if (updateError) {
      setError(updateError.message);
      return false;
    }
    await load();
    return true;
  }, [load]);

  // ¿Hay al menos una placa con pallets pendientes de cerrar?
  const hasPending = useMemo(
    () => groups.some((g) => g.pendingCount > 0),
    [groups]
  );

  return {
    groups,
    history,
    loading,
    error,
    reload: load,
    executeClose,
    executeCloseAll,
    hasPending
  };
};
