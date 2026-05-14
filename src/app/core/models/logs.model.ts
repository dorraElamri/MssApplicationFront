// log.model.ts

import { Instance } from "./Instance.model";

// Entité principale : LogEntry
export interface LogEntry {
  id: string;                        // Guid → string
  timestamp: string;                 // DateTimeOffset → ISO string (ex: "2025-03-02T14:30:00.000Z")
  level: string;
  environment?: string | null;
  application?: string | null;
  service?: string | null;
  message: string;

  instanceId: string;                // Guid → string
  // instance: Instance;             // Navigation property - à inclure seulement si tu charges l'instance liée

  sourceServer: SourceServer;
  request: RequestInfo;
  exception: ExceptionInfo;

  traceId?: string | null;
  correlationId?: string | null;
  createdAt: string; 
  isProcessed : string ;                
}

// Sous-objets

export interface SourceServer {
  name?: string | null;
  ip?: string | null;
}

export interface RequestInfo {
  method?: string | null;
  endpoint?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
}

export interface ExceptionInfo {
  type?: string | null;
  message?: string | null;
  stackTrace?: string | null;
}

// Optionnel : version paginée (si tu utilises GetLogsByInstanceIdPagedAsync)
export interface PagedLogsResponse {
  items: LogEntry[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}


export interface LogEntryDto {
  id: string;
  timestamp: string;
  level: string;
  environment?: string;
  application?: string;
  service?: string;
  message: string;
  sourceServer: { name?: string; ip?: string };
  request: { method?: string; endpoint?: string; requestId?: string; durationMs?: number };
  exception: { type?: string; message?: string; stackTrace?: string };
  traceId?: string;
  instanceId?: string;
  instance : Instance;
  correlationId?: string;
  createdAt: string;
  isProcessed? : boolean | string; // Accepte true/false ou "true"/"True"           

}