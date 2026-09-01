export type RFIDTagEvent = {
  epc: string;
  rssi: number;
  antenna: number;
  readerName: string;
  dockDoor: string | null;
  expectedDockDoor: string | null;
  timestamp: string;
  isValid: boolean;
  reason?: string;
};

export type GroupedRFIDTag = {
  epc: string;
  rssi: number;
  antenna: number;
  readerName: string;
  dockDoor: string | null;
  expectedDockDoor: string | null;
  firstSeen: string;
  lastSeen: string;
  readCount: number;
  isValid: boolean;
};

// Fila cruda de la tabla `tag_reads` en Supabase
export type TagReadRow = {
  id: number;
  epc: string;
  reader_name: string;
  antenna_port: number;
  rssi: number | null;
  dock_door: string | null;
  expected_dock_door: string | null;
  is_valid: boolean;
  reason: string | null;
  read_at: string;
};

// Fila de la tabla `antennas` (con join a readers)
export type AntennaRow = {
  id: number;
  reader_id: number;
  antenna_port: number;
  dock_door: string | null;
  zone_name: string | null;
  is_active: boolean;
  readers?: { name: string } | null;
};

export type ReaderRow = {
  id: number;
  name: string;
  host: string | null;
  port: number | null;
  is_active: boolean;
};
