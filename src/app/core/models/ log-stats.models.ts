export type LogLevel = 'Information' | 'Warning' | 'Error' | 'Fatal' | 'Debug' | 'Trace' | 'Unknown';
export type Granularity = 'day' | 'hour';
export type AnomalySeverity = 'Low' | 'Medium' | 'High' | 'Critical';
 



// ─── Requête ─────────────────────────────────────────────────
export interface LogStatsRequestV2 {
  fromDate?: string;        // ISO string
  toDate?: string;
  granularity: Granularity;
  instanceId?: string;      // Guid
  instanceIds?: string[];
  onlyErrors?: boolean;
  includePreviousPeriod?: boolean;
}
 
// ─── Série temporelle ────────────────────────────────────────
export interface LogTimeSeries {
  label: string;
  count: number;
}
 
export interface DurationTimeSeries {
  label: string;
  avgDurationMs: number;
  p95DurationMs: number;
}
 
// ─── Répartition par niveau ──────────────────────────────────
export interface LogLevelDistribution {
  level: LogLevel;
  count: number;
  percentage: number;
}
 
// ─── Stats par instance ──────────────────────────────────────
export interface InstanceLogStats {
  instanceId: string;
  instanceName: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
}
 
// ─── Health des instances ────────────────────────────────────
export interface InstanceHealth {
  instanceId: string;
  instanceName: string;
  host: string;
  environment: string;
  status: 'Online' | 'Offline';
  lastLogAt?: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
  topException: string;
  isActive: boolean;
}
 
// ─── Services ────────────────────────────────────────────────
export interface ServiceStats {
  serviceName: string;
  logCount: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
  percentage: number;
}
 
// ─── Exceptions ──────────────────────────────────────────────
export interface ExceptionStats {
  exceptionType: string;
  count: number;
  percentage: number;
  lastOccurrence?: string;
  sampleMessage?: string;
}
 
// ─── Heatmap ─────────────────────────────────────────────────
export interface HeatmapCell {
  dayOfWeek: number;
  dayLabel: string;
  hour: number;
  count: number;
  intensity: number;
}
 
export interface DayOfWeekStats {
  dayOfWeek: number;
  dayLabel: string;
  count: number;
}
 
// ─── Durée des requêtes ──────────────────────────────────────
export interface DurationBucket {
  bucket: string;
  count: number;
  percentage: number;
}
 
export interface RequestDurationStats {
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  maxDurationMs: number;
  totalRequests: number;
  slowRequests: number;
  slowRequestRate: number;
  durationOverTime: DurationTimeSeries[];
  durationBuckets: DurationBucket[];
}
 
// ─── Top erreurs ─────────────────────────────────────────────
export interface TopErrorMessage {
  message: string;
  level: LogLevel;
  exceptionType?: string;
  count: number;
  percentage: number;
  lastOccurrence?: string;
  service?: string;
  sampleLogIds: string[];
}
 
// ─── Anomalies ───────────────────────────────────────────────
export interface Anomaly {
  type: string;
  severity: AnomalySeverity;
  description: string;
  timestamp: string;
  value: number;
  threshold: number;
  deltaPct: number;
}
 
// ─── Comparaison de périodes ─────────────────────────────────
export interface PeriodComparison {
  fromDate: string;
  toDate: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
  totalLogsDeltaPct: number;
  errorRateDeltaPct: number;
  avgDurationDeltaPct: number;
  logsOverTime: LogTimeSeries[];
  errorsOverTime: LogTimeSeries[];
}
 
// ─── Log récent ──────────────────────────────────────────────
export interface RecentLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service?: string;
  exceptionType?: string;
  endpoint?: string;
  durationMs?: number;
  instanceName: string;
}
 
// ─── Réponse principale ──────────────────────────────────────
export interface LogStatsResponseV2 {
  // KPIs base
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  fatalCount: number;
  errorRate: number;
 
  // KPIs enrichis
  avgDurationMs: number;
  p95DurationMs: number;
  slowRequestRate: number;
  topExceptionType?: string;
  activeInstancesCount: number;
  onlineInstancesCount: number;
  offlineInstancesCount: number;
 
  // Méta
  fromDate: string;
  toDate: string;
  granularity: Granularity;
  isGlobalView: boolean;
 
  // Graphiques base
  logsOverTime: LogTimeSeries[];
  errorsOverTime: LogTimeSeries[];
  levelDistribution: LogLevelDistribution[];
 
  // Graphiques enrichis
  topServices: ServiceStats[];
  exceptionDistribution: ExceptionStats[];
  activityHeatmap: HeatmapCell[];
  requestDurationStats?: RequestDurationStats;
  topErrorMessages: TopErrorMessage[];
  detectedAnomalies: Anomaly[];
  logsByDayOfWeek: DayOfWeekStats[];
 
  // Vues spéciales
  perInstanceStats?: InstanceLogStats[];
  instancesHealth?: InstanceHealth[];
  recentLogs: RecentLog[];
  previousPeriod?: PeriodComparison;
}
 
// ─── Wrapper API ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
 
// ─── Preset période ──────────────────────────────────────────
export interface DatePreset {
  label: string;
  value: string;
  fromDate: Date;
  toDate: Date;
}
 
// ─── Instance (pour le dropdown) ────────────────────────────
export interface InstanceOption {
  id: string;
  applicationName: string;
  host: string;
  environment: string;
  status: 'Online' | 'Offline';
  isActive: boolean;
}