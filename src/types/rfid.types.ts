export type RFIDTagEvent = {
  epc: string;
  pallet: string | null;
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
  pallet: string | null;
  rssi: number;
  antenna: number;
  readerName: string;
  dockDoor: string | null;
  expectedDockDoor: string | null;
  reason?: string;
  firstSeen: string;
  lastSeen: string;
  readCount: number;
  isValid: boolean;
};

// Fila cruda de la tabla `tag_reads` en Supabase
export type TagReadRow = {
  id: number;
  epc: string;
  pallet: string | null;
  reader_name: string;
  antenna_port: number;
  rssi: number | null;
  dock_door: string | null;
  expected_dock_door: string | null;
  wms_reader_id: string | null;
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
  wms_reader_id: string | null;
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

// Fila de la tabla `truck_load` (Carga Camión)
export type TruckLoadRow = {
  id: number;
  pallet: string;
  placa: string;
  epc: string | null;
  dock_door: string | null;
  status: "loaded" | "closing" | "closed" | "error";
  close_error: string | null;
  loaded_at: string;
  closed_at: string | null;
};

// Pallets de una placa agrupados para el módulo Carga Camión
export type TruckLoadGroup = {
  placa: string;
  pallets: TruckLoadRow[];
  loadedCount: number;
  closedCount: number;
  allClosed: boolean;
};
