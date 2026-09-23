import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { RFIDTagEvent, TagReadRow } from "../types/rfid.types";

export type DateRangePreset = "24h" | "7d" | "30d" | "all";

const mapRow = (row: TagReadRow): RFIDTagEvent => ({
  epc: row.epc,
  pallet: row.pallet ?? null,
  rssi: Number(row.rssi ?? 0),
  antenna: Number(row.antenna_port ?? 0),
  readerName: row.reader_name,
  dockDoor: row.dock_door,
  expectedDockDoor: row.expected_dock_door,
  timestamp: row.read_at,
  isValid: row.is_valid,
  reason: row.reason ?? undefined
});

const presetToSince = (preset: DateRangePreset): string | null => {
  const now = Date.now();
  switch (preset) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "all":
    default:
      return null;
  }
};

export type ReportSummary = {
  totalReads: number;
  uniqueTags: number;
  validReads: number;
  errorReads: number;
  errorRate: number; // 0-100
};

export type DoorErrorRow = {
  door: string;
  total: number;
  errors: number;
  errorRate: number;
};

export type ReaderPerfRow = {
  key: string;
  readerName: string;
  antenna: number;
  total: number;
  errors: number;
  errorRate: number;
};

export type TrendPoint = {
  label: string;
  ok: number;
  error: number;
};

export const useReports = (preset: DateRangePreset) => {
  const [rows, setRows] = useState<RFIDTagEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("tag_reads")
      .select("*")
      .order("read_at", { ascending: false })
      .limit(5000);

    const since = presetToSince(preset);
    if (since) {
      query = query.gte("read_at", since);
    }

    const { data, error: qError } = await query;
    if (qError) {
      setError(qError.message);
      setRows([]);
    } else {
      setRows((data as TagReadRow[]).map(mapRow));
    }
    setLoading(false);
  }, [preset]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo<ReportSummary>(() => {
    const totalReads = rows.length;
    const errorReads = rows.filter((r) => !r.isValid).length;
    const validReads = totalReads - errorReads;
    const uniqueTags = new Set(rows.map((r) => r.epc)).size;
    const errorRate = totalReads ? (errorReads / totalReads) * 100 : 0;
    return { totalReads, uniqueTags, validReads, errorReads, errorRate };
  }, [rows]);

  const doorErrors = useMemo<DoorErrorRow[]>(() => {
    const map = new Map<string, { total: number; errors: number }>();
    rows.forEach((r) => {
      const door = r.dockDoor ?? "Sin puerta";
      const entry = map.get(door) ?? { total: 0, errors: 0 };
      entry.total += 1;
      if (!r.isValid) entry.errors += 1;
      map.set(door, entry);
    });
    return Array.from(map.entries())
      .map(([door, { total, errors }]) => ({
        door,
        total,
        errors,
        errorRate: total ? (errors / total) * 100 : 0
      }))
      .sort((a, b) => b.errors - a.errors);
  }, [rows]);

  const readerPerformance = useMemo<ReaderPerfRow[]>(() => {
    const map = new Map<string, { total: number; errors: number }>();
    rows.forEach((r) => {
      const key = `${r.readerName}||${r.antenna}`;
      const entry = map.get(key) ?? { total: 0, errors: 0 };
      entry.total += 1;
      if (!r.isValid) entry.errors += 1;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .map(([key, { total, errors }]) => {
        const [readerName, antenna] = key.split("||");
        return {
          key,
          readerName,
          antenna: Number(antenna),
          total,
          errors,
          errorRate: total ? (errors / total) * 100 : 0
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  const trend = useMemo<TrendPoint[]>(() => {
    // Agrupa por hora si el rango es 24h, si no por día.
    const byDay = preset !== "24h";
    const buckets = new Map<string, { ok: number; error: number }>();

    rows.forEach((r) => {
      const d = new Date(r.timestamp);
      const label = byDay
        ? d.toISOString().slice(0, 10) // YYYY-MM-DD
        : `${String(d.getHours()).padStart(2, "0")}:00`;
      const entry = buckets.get(label) ?? { ok: 0, error: 0 };
      if (r.isValid) entry.ok += 1;
      else entry.error += 1;
      buckets.set(label, entry);
    });

    return Array.from(buckets.entries())
      .map(([label, { ok, error }]) => ({ label, ok, error }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, preset]);

  const errorDetails = useMemo(
    () => rows.filter((r) => !r.isValid),
    [rows]
  );

  return {
    loading,
    error,
    rows,
    summary,
    doorErrors,
    readerPerformance,
    trend,
    errorDetails,
    reload: load
  };
};
