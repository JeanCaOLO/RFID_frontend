// Zona horaria por defecto de la aplicación (Costa Rica).
// El usuario puede cambiarla desde el selector del Header.
export const DEFAULT_TIME_ZONE = "America/Costa_Rica";

export const formatTime = (isoString: string, timeZone?: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: timeZone ?? DEFAULT_TIME_ZONE
    });
  } catch (e) {
    return "--:--:--";
  }
};

// Fecha y hora completas, respetando la zona horaria seleccionada.
export const formatDateTime = (iso: string, timeZone?: string) => {
  try {
    const date = new Date(iso);
    const parts = date
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timeZone ?? DEFAULT_TIME_ZONE
      })
      // "sv-SE" da formato "YYYY-MM-DD HH:mm:ss"
      .replace(",", "");
    return parts;
  } catch (e) {
    return iso;
  }
};

export const normalizeRssi = (rssi: number, min = -90, max = -20) => {
  if (Number.isNaN(rssi)) return 0;
  const clamped = Math.min(Math.max(rssi, min), max);
  return Math.round(((clamped - min) / (max - min)) * 100);
};
