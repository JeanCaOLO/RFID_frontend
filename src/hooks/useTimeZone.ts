import { useEffect, useState } from "react";
import { DEFAULT_TIME_ZONE } from "../utils/formatters";

const STORAGE_KEY = "rfid-timezone";

const getInitialTimeZone = (): string => {
  if (typeof window === "undefined") {
    return DEFAULT_TIME_ZONE;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored.trim() !== "" ? stored : DEFAULT_TIME_ZONE;
};

/**
 * Zona horaria de visualización. Arranca en Costa Rica por defecto y recuerda
 * la última selección del usuario entre recargas.
 */
export const useTimeZone = () => {
  const [timeZone, setTimeZoneState] = useState<string>(getInitialTimeZone);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, timeZone);
  }, [timeZone]);

  return { timeZone, setTimeZone: setTimeZoneState };
};
