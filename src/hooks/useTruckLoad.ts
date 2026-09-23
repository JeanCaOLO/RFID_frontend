import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { TruckLoadRow, TruckLoadGroup } from "../types/rfid.types";

/**
 * Módulo Carga Camión.
 *
 * Lee la tabla `truck_load` (pallets validados agrupados por placa) y se
 * suscribe a cambios en Realtime. Para "Ejecutar carga camión" NO llama al
 * WMS directamente: marca los pallets de la placa como status='closing' en
 * Supabase. El backend Python (único que habla con el WMS) detecta ese estado,
 * llama a POST /carga-camion/{placa}/close y actualiza a 'closed' o 'error'.
 */
export const useTruckLoad = () => {
  const [rows, setRows] = useState<TruckLoadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: qError } = await supabase
      .from("truck_load")
      .select("*")
      .order("loaded_at", { ascending: false })
      .limit(2000);

    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setError(null);
      setRows((data as TruckLoadRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refrescamos ante cualquier cambio en truck_load.
  useEffect(() => {
    let channel: RealtimeChannel;

    const applyChange = () => {
      load();
    };

    channel = supabase
      .channel("truck_load_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "truck_load" },
        applyChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Agrupa por placa para mostrar cada camión con su lista de pallets.
  const groups = useMemo<TruckLoadGroup[]>(() => {
    const map = new Map<string, TruckLoadRow[]>();
    rows.forEach((row) => {
      const list = map.get(row.placa) ?? [];
      list.push(row);
      map.set(row.placa, list);
    });

    return Array.from(map.entries())
      .map(([placa, pallets]) => {
        const loadedCount = pallets.filter(
          (p) => p.status === "loaded" || p.status === "closing"
        ).length;
        const closedCount = pallets.filter((p) => p.status === "closed").length;
        return {
          placa,
          pallets: pallets.sort((a, b) =>
            a.loaded_at < b.loaded_at ? 1 : -1
          ),
          loadedCount,
          closedCount,
          allClosed: pallets.length > 0 && pallets.every((p) => p.status === "closed")
        };
      })
      .sort((a, b) => a.placa.localeCompare(b.placa));
  }, [rows]);

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
    () =>
      rows.some((r) => r.status === "loaded" || r.status === "error"),
    [rows]
  );

  return {
    rows,
    groups,
    loading,
    error,
    reload: load,
    executeClose,
    executeCloseAll,
    hasPending
  };
};
