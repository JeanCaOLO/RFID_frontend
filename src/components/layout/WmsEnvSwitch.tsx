import { AlertTriangle, Database, Loader2 } from "lucide-react";
import { useWmsEnv } from "../../hooks/useWmsEnv";
import type { WmsEnv } from "../../types/rfid.types";

const OPTIONS: { id: WmsEnv; label: string; active: string }[] = [
  { id: "qa", label: "QA", active: "bg-sky-500 text-white" },
  { id: "prod", label: "Producción", active: "bg-red-600 text-white" }
];

/**
 * Botón QA / Producción: elige contra qué WMS valida el backend las lecturas
 * y cierra las cargas camión. Pasar a producción pide confirmación.
 */
export const WmsEnvSwitch = ({ userEmail }: { userEmail: string }) => {
  const { settings, env, pending, saving, error, setEnv } = useWmsEnv(userEmail);

  const choose = (next: WmsEnv) => {
    if (next === env || saving) return;
    if (
      next === "prod" &&
      !window.confirm(
        "¿Cambiar al WMS de PRODUCCIÓN?\n\n" +
          "Las lecturas y los cierres de carga camión se registrarán en el WMS real."
      )
    ) {
      return;
    }
    setEnv(next);
  };

  const backendError = settings?.wms_env_error ?? null;
  const unavailable = !settings;

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
        title={
          unavailable
            ? error
              ? `No se pudo leer el ambiente del WMS: ${error}`
              : "Cargando ambiente del WMS…"
            : settings.updated_by
            ? `Último cambio: ${settings.updated_by}`
            : undefined
        }
      >
        <Database className="h-3.5 w-3.5" />
        WMS
      </span>
      <div
        className={`inline-flex rounded-full border p-0.5 ${
          env === "prod"
            ? "border-red-500/60 bg-red-500/10"
            : "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60"
        }`}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={unavailable || saving}
            onClick={() => choose(opt.id)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              env === opt.id
                ? opt.active
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {backendError ? (
        <span title={backendError} className="text-red-500">
          <AlertTriangle className="h-4 w-4" />
        </span>
      ) : pending || saving ? (
        <span
          title="Esperando que el backend aplique el cambio…"
          className="text-slate-400"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : null}
    </div>
  );
};
