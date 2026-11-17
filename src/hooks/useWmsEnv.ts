import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AppSettingsRow, WmsEnv } from "../types/rfid.types";

/**
 * Ambiente del WMS (QA / producción) que usa el backend.
 *
 * El frontend escribe `app_settings.wms_env`; el backend lo aplica en unos
 * segundos y responde con `wms_env_applied`. Mientras no coincidan, el cambio
 * está pendiente.
 */
export const useWmsEnv = (userEmail: string) => {
  const [settings, setSettings] = useState<AppSettingsRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setSettings(data as AppSettingsRow | null);
      });

    const channel = supabase
      .channel("app_settings_stream")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => setSettings(payload.new as AppSettingsRow)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setEnv = useCallback(
    async (env: WmsEnv) => {
      setSaving(true);
      const { data, error: err } = await supabase
        .from("app_settings")
        .update({
          wms_env: env,
          updated_at: new Date().toISOString(),
          updated_by: userEmail
        })
        .eq("id", 1)
        .select()
        .maybeSingle();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      setError(null);
      if (data) setSettings(data as AppSettingsRow);
    },
    [userEmail]
  );

  const env = settings?.wms_env ?? null;
  const pending = !!settings && settings.wms_env !== settings.wms_env_applied;

  return { settings, env, pending, saving, error, setEnv };
};
