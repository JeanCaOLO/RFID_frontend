import { format } from "date-fns";

export const formatTime = (isoString: string, timeZone?: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone:
        timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (e) {
    return "--:--:--";
  }
};

export const formatDateTime = (iso: string) => {
  return format(new Date(iso), "yyyy-MM-dd HH:mm:ss");
};

export const normalizeRssi = (rssi: number, min = -90, max = -20) => {
  if (Number.isNaN(rssi)) return 0;
  const clamped = Math.min(Math.max(rssi, min), max);
  return Math.round(((clamped - min) / (max - min)) * 100);
};
