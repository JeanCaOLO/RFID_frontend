import { useState } from "react";
import { Check, Loader2, MapPin, Pencil, RefreshCw, X } from "lucide-react";
import { useAntennaMapping } from "../../hooks/useAntennaMapping";
import type { AntennaRow } from "../../types/rfid.types";

// Máximo si el backend aún no reportó el de la región del lector.
const DEFAULT_MAX_POWER = 24;

const STATUS_DOT: Record<AntennaRow["connection_status"], string> = {
  connected: "bg-emerald-500",
  disconnected: "bg-red-500 animate-pulse",
  unknown: "bg-slate-400"
};

const STATUS_LABEL: Record<AntennaRow["connection_status"], string> = {
  connected: "Conectada",
  disconnected: "Desconectada",
  unknown: "Sin datos"
};

/**
 * Módulo de configuración del mapeo Antena -> Puerta de despacho.
 * Escribe directamente en la tabla `antennas` de Supabase.
 */
export const AntennaMapping = () => {
  const { antennas, readers, loading, error, reload, updateAntenna } =
    useAntennaMapping();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dockDoor, setDockDoor] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [wmsReaderId, setWmsReaderId] = useState("");
  const [txPower, setTxPower] = useState("");
  const [powerError, setPowerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const maxPowerFor = (row: AntennaRow) =>
    readers.find((r) => r.id === row.reader_id)?.max_tx_power_dbm ??
    DEFAULT_MAX_POWER;

  const startEdit = (row: AntennaRow) => {
    setEditingId(row.id);
    setDockDoor(row.dock_door ?? "");
    setZoneName(row.zone_name ?? "");
    setWmsReaderId(row.wms_reader_id ?? "");
    setTxPower(row.tx_power_dbm === null ? "" : String(row.tx_power_dbm));
    setPowerError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDockDoor("");
    setZoneName("");
    setWmsReaderId("");
    setTxPower("");
    setPowerError(null);
  };

  const saveEdit = async (row: AntennaRow) => {
    // Vacío = usar la potencia por defecto del backend (TX_POWER_DBM).
    const power = txPower.trim() === "" ? null : Number(txPower);
    const max = maxPowerFor(row);
    if (power !== null && (Number.isNaN(power) || power < 0 || power > max)) {
      setPowerError(`La potencia debe estar entre 0 y ${max} dBm`);
      return;
    }
    setSaving(true);
    const ok = await updateAntenna(row.id, {
      dock_door: dockDoor.trim() || null,
      zone_name: zoneName.trim() || null,
      wms_reader_id: wmsReaderId.trim() || null,
      tx_power_dbm: power
    });
    setSaving(false);
    if (ok) cancelEdit();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-sky-500" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
            Mapeo de antenas
          </h3>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200"
        >
          <RefreshCw className="h-3 w-3" />
          Recargar
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando mapeo...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Lector</th>
                <th className="px-3 py-2">Antena</th>
                <th className="px-3 py-2">Reader ID (WMS)</th>
                <th className="px-3 py-2">Puerta de despacho</th>
                <th className="px-3 py-2">Zona</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Potencia (dBm)</th>
                <th className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {antennas.map((row) => {
                const isEditing = editingId === row.id;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-200/70 dark:border-slate-700/60"
                  >
                    <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">
                      {row.readers?.name ?? `#${row.reader_id}`}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      Antena {row.antenna_port}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          value={wmsReaderId}
                          onChange={(e) => setWmsReaderId(e.target.value)}
                          className="w-44 rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600 dark:text-slate-100"
                          placeholder="ANTENA_PUERTA_1"
                        />
                      ) : (
                        <span className="font-mono text-amber-600 dark:text-amber-400">
                          {row.wms_reader_id ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          value={dockDoor}
                          onChange={(e) => setDockDoor(e.target.value)}
                          className="w-40 rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600 dark:text-slate-100"
                          placeholder="DOCK-A"
                        />
                      ) : (
                        <span className="font-mono text-sky-600 dark:text-sky-400">
                          {row.dock_door ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          value={zoneName}
                          onChange={(e) => setZoneName(e.target.value)}
                          className="w-40 rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600 dark:text-slate-100"
                          placeholder="Zona 1"
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">
                          {row.zone_name ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[row.connection_status] ?? STATUS_DOT.unknown}`}
                        />
                        {STATUS_LABEL[row.connection_status] ?? STATUS_LABEL.unknown}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <div>
                          <input
                            type="number"
                            min={0}
                            max={maxPowerFor(row)}
                            step={0.5}
                            value={txPower}
                            onChange={(e) => setTxPower(e.target.value)}
                            className="w-24 rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600 dark:text-slate-100"
                            placeholder="Defecto"
                            title={`0 a ${maxPowerFor(row)} dBm. Vacío = valor por defecto del backend`}
                          />
                          {powerError && (
                            <p className="mt-1 text-xs text-red-500">{powerError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-600 dark:text-slate-300">
                          <span className="font-mono">
                            {row.applied_tx_power_dbm ?? "—"}
                          </span>
                          {row.tx_power_dbm !== null &&
                            Number(row.tx_power_dbm) !==
                              Number(row.applied_tx_power_dbm) && (
                              <span
                                className="ml-2 text-xs text-amber-500"
                                title="El backend aplicará este valor en el lector en unos segundos"
                              >
                                → {row.tx_power_dbm} (aplicando)
                              </span>
                            )}
                          {row.tx_power_dbm === null && (
                            <span className="ml-2 text-xs text-slate-400">
                              (defecto)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => saveEdit(row)}
                            disabled={saving}
                            className="rounded-md bg-emerald-500 p-1.5 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                            title="Guardar"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-md bg-slate-300 p-1.5 text-slate-700 transition hover:bg-slate-400 dark:bg-slate-600 dark:text-slate-100"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(row)}
                          className="rounded-md border border-slate-200 bg-slate-100 p-1.5 text-slate-600 transition hover:text-sky-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {antennas.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    No hay antenas configuradas. Ejecuta el script SQL en
                    Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
