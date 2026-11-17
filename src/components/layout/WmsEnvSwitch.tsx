import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Loader2 } from "lucide-react";
import { useWmsEnv } from "../../hooks/useWmsEnv";
import type { WmsEnv } from "../../types/rfid.types";

// Si el backend no confirma el cambio en este tiempo, se avisa en vez de girar.
const CONFIRM_TIMEOUT_MS = 20_000;

// Versión del backend que espera esta pantalla (BACKEND_VERSION en main.py).
// Subirla junto con la del backend cuando un cambio necesite ambos.
const EXPECTED_BACKEND_VERSION = "2026-11-17.2";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const ENV_LABEL: Record<WmsEnv, string> = { qa: "QA", prod: "Producción" };

const OPTIONS: { id: WmsEnv; active: string }[] = [
  { id: "qa", active: "bg-sky-500 text-white shadow" },
  { id: "prod", active: "bg-red-600 text-white shadow" }
];

/**
 * Panel QA / Producción: elige contra qué WMS valida el backend las lecturas
 * y cierra las cargas camión. Pasar a producción pide confirmación.
 */
export const WmsEnvSwitch = ({ userEmail }: { userEmail: string }) => {
  const { settings, env, pending, saving, error, setEnv } = useWmsEnv(userEmail);
  const [now, setNow] = useState(() => Date.now());

  // Reloj solo mientras hay un cambio pendiente, para detectar que venció.
  useEffect(() => {
    if (!pending) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 2_000);
    return () => window.clearInterval(timer);
  }, [pending]);

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

  const requestedAt = settings ? new Date(settings.updated_at).getTime() : 0;
  const overdue = pending && now - requestedAt > CONFIRM_TIMEOUT_MS;

  let status: { tone: string; icon: JSX.Element; text: string };
  if (!settings) {
    status = {
      tone: "text-slate-400",
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: error
        ? `No se pudo leer la configuración: ${error}`
        : "Cargando configuración…"
    };
  } else if (settings.wms_env_error) {
    status = {
      tone: "text-red-400",
      icon: <AlertTriangle className="h-4 w-4" />,
      text: `El backend no pudo cambiar: ${settings.wms_env_error}`
    };
  } else if (overdue) {
    status = {
      tone: "text-amber-400",
      icon: <AlertTriangle className="h-4 w-4" />,
      text: settings.wms_env_applied
        ? `El backend no confirmó el cambio y sigue en ${ENV_LABEL[settings.wms_env_applied]}. Revisa que esté corriendo.`
        : "El backend no ha confirmado el ambiente. Revisa que esté corriendo con la versión nueva."
    };
  } else if (pending || saving) {
    status = {
      tone: "text-slate-400",
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: "Aplicando el cambio en el backend…"
    };
  } else {
    status = {
      tone: "text-emerald-400",
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: `El backend está usando el WMS de ${ENV_LABEL[settings.wms_env]}.`
    };
  }

  // Qué backend está corriendo: versión, equipo y si se copió completo.
  let backend: { tone: string; text: string } | null = null;
  if (settings) {
    const version = settings.backend_version;
    if (settings.backend_problem) {
      backend = { tone: "text-red-400", text: settings.backend_problem };
    } else if (!version) {
      backend = {
        tone: "text-amber-400",
        text:
          `El backend no ha reportado su versión: corre una versión anterior a ` +
          `${EXPECTED_BACKEND_VERSION} (copiar los archivos nuevos al NAS y ` +
          `reconstruir) o falta ejecutar migration_backend_info.sql.`
      };
    } else if (version !== EXPECTED_BACKEND_VERSION) {
      backend = {
        tone: "text-amber-400",
        text: `El backend corre la versión ${version}; esta pantalla espera la ${EXPECTED_BACKEND_VERSION}. Copia los archivos nuevos al NAS.`
      };
    } else {
      backend = {
        tone: "text-slate-400",
        text:
          `Backend ${version} en ${settings.backend_host ?? "equipo desconocido"}` +
          (settings.backend_started_at
            ? ` · iniciado ${formatDateTime(settings.backend_started_at)}`
            : "")
      };
    }
  }

  return (
    <section
      className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-800 ${
        env === "prod"
          ? "border-red-500/60"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-sky-300">
              Ambiente del WMS
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Contra qué WMS valida el backend las lecturas y cierra las cargas
            camión.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900/60">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={!settings || saving}
              onClick={() => choose(opt.id)}
              className={`rounded-full px-5 py-1.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                env === opt.id
                  ? opt.active
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {ENV_LABEL[opt.id]}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-4 flex items-center gap-2 text-sm ${status.tone}`}>
        {status.icon}
        <span>{status.text}</span>
        {settings?.updated_by && (
          <span className="ml-auto text-xs text-slate-500">
            Último cambio: {settings.updated_by}
          </span>
        )}
      </div>

      {backend && (
        <p className={`mt-2 border-t border-slate-200 pt-2 text-xs dark:border-slate-700 ${backend.tone}`}>
          {backend.text}
        </p>
      )}
    </section>
  );
};
