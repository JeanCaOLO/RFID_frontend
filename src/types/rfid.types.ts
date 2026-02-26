export type RFIDTagEvent = {
  epc: string;
  rssi: number;
  antenna: number;
  timestamp: string;
};

export type GroupedRFIDTag = {
  epc: string;
  rssi: number;
  antenna: number;
  firstSeen: string;
  lastSeen: string;
  readCount: number;
};
