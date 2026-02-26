import { format } from "date-fns";

export const formatTime = (iso: string) => {
  return format(new Date(iso), "HH:mm:ss");
};

export const formatDateTime = (iso: string) => {
  return format(new Date(iso), "yyyy-MM-dd HH:mm:ss");
};

export const normalizeRssi = (rssi: number, min = -90, max = -20) => {
  if (Number.isNaN(rssi)) return 0;
  const clamped = Math.min(Math.max(rssi, min), max);
  return Math.round(((clamped - min) / (max - min)) * 100);
};
