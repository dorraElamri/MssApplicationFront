import { Injectable } from '@angular/core';
import { HttpClient, HttpParams , HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Instance } from '../models/Instance.model';
import { LogEntryDto } from '../models/logs.model';
import { LogStatsRequestV2,  LogStatsResponseV2, InstanceOption} from '../models/ log-stats.models';

// Interfaces pour typer les réponses (basé sur ton ApiResponse<T>)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}



// DTO pour la pagination
export interface PagedLogsResponseDto {
  data: LogEntryDto[];     
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;     
}



export interface LogStatsRequestDto {
  fromDate?: string;        // ISO string ou Date
  toDate?: string;
  instanceId?: string;
  granularity?: 'hour' | 'day';   // par défaut "day"
}

export interface LogTimeSeriesDto {
  label: string;            // ex: "2026-04-05" ou "14:00"
  count: number;
}

export interface LogLevelDistributionDto {
  level: string;
  count: number;
  percentage: number;
}

export interface InstanceLogStatsDto {
  instanceId: string;
  instanceName: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
}

export interface LogStatsResponseDto {
  // KPIs
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  fatalCount: number;
  errorRate: number;           // pourcentage

  // Période
  fromDate: string;
  toDate: string;
  granularity: string;
  isGlobalView: boolean;

  // Graphiques
  logsOverTime: LogTimeSeriesDto[];
  errorsOverTime: LogTimeSeriesDto[];

  // Répartition par niveau (camembert)
  levelDistribution: LogLevelDistributionDto[];

  // Stats par instance (vue globale)
  perInstanceStats?: InstanceLogStatsDto[];
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private baseUrl = 'https://localhost:7010/api/logs'; // <-- changer selon ton API

  constructor(private http: HttpClient) {}

  /**
   * Récupère TOUS les logs d'une instance (non paginé)
   * @param instanceId Guid de l'instance
   */
  getLogsByInstanceId(instanceId: string): Observable<LogEntryDto[]> {
    return this.http.get<ApiResponse<LogEntryDto[]>>(`${this.baseUrl}/${instanceId}/logs`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la récupération des logs');
        }
        return response.data;
      }),
      catchError(err => {
        console.error('Erreur getLogsByInstanceId', err);
        return throwError(() => new Error(err.message || 'Impossible de charger les logs'));
      })
    );
  }

getLogsByInstanceIdPaged(
  instanceId: string,
  pageNumber: number = 1,
  pageSize: number = 20
): Observable<PagedLogsResponseDto> {
  let params = new HttpParams()
    .set('pageNumber', pageNumber.toString())
    .set('pageSize', pageSize.toString());

  return this.http.get<ApiResponse<PagedLogsResponseDto>>(
    `${this.baseUrl}/${instanceId}/logs/paged`,
    { params }
  ).pipe(
    map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération paginée');
      }
      return response.data;
    }),
    catchError(err => {
      console.error('Erreur pagination logs', err);
      return throwError(() => new Error(err.message || 'Impossible de charger les logs paginés'));
    })
  );
}

  // Optionnel : méthode pour rafraîchir après régénération ou autre
  refreshLogs(instanceId: string): Observable<LogEntryDto[]> {
    return this.getLogsByInstanceId(instanceId);
  }


  getLogById(logId: string): Observable<LogEntryDto> {
  return this.http.get<ApiResponse<LogEntryDto>>(`${this.baseUrl}/${logId}`).pipe(
    map(res => {
      if (!res.success) throw new Error(res.message);
      return res.data;
    })
  );
}


markAsProcessed(logId: string, processed: boolean): Observable<ApiResponse<any>> {
  return this.http.patch<ApiResponse<any>>(
    `${this.baseUrl}/${logId}/process?isProcessed=${processed}`,
    {}  // body vide car le paramètre est en query
  ).pipe(
    catchError(err => {
      console.error('Erreur markAsProcessed', err);
      return throwError(() => new Error(err.error?.message || 'Impossible de mettre à jour le statut'));
    })
  );
}
/**
 * Récupère les statistiques des logs
 * Par défaut : statistiques du jour pour les instances de l'utilisateur connecté
 */
getLogStats(request: LogStatsRequestDto = {}): Observable<LogStatsResponseDto> {
  let params = new HttpParams();

  // Si aucune date n'est fournie → on force aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  params = params.set('fromDate', request.fromDate || today);
  params = params.set('toDate', request.toDate || today);
  params = params.set('granularity', request.granularity || 'day');

  if (request.instanceId) {
    params = params.set('instanceId', request.instanceId);
  }

  return this.http.get<ApiResponse<LogStatsResponseDto>>(`${this.baseUrl}/stats`, { params }).pipe(
    map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }
      return response.data;
    }),
    catchError(err => {
      console.error('Erreur getLogStats', err);
      return throwError(() => new Error(err.error?.message || 'Impossible de charger les statistiques'));
    })
  );
}
  // Méthodes pratiques pour cas d'usage courants

  /** Statistiques globales sur une période */
  getGlobalLogStats(fromDate?: string, toDate?: string, granularity: 'hour' | 'day' = 'day'): Observable<LogStatsResponseDto> {
    return this.getLogStats({ fromDate, toDate, granularity });
  }

  /** Statistiques pour une instance spécifique */
  getInstanceLogStats(instanceId: string, fromDate?: string, toDate?: string, granularity: 'hour' | 'day' = 'day'): Observable<LogStatsResponseDto> {
    return this.getLogStats({ instanceId, fromDate, toDate, granularity });
  }

  getLogStatsWithTimeSeries(
  fromDate?: string,
  toDate?: string,
  instanceId?: string,
  granularity: 'day' | 'hour' = 'day'
): Observable<LogStatsResponseDto> {

  let params = new HttpParams()
    .set('granularity', granularity);

  if (fromDate) params = params.set('fromDate', fromDate);
  if (toDate) params = params.set('toDate', toDate);
  if (instanceId) params = params.set('instanceId', instanceId);

  return this.http.get<ApiResponse<LogStatsResponseDto>>(`${this.baseUrl}/stats`, { params }).pipe(
    map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }
      return response.data;
    }),
    catchError(err => {
      console.error('Erreur getLogStatsWithTimeSeries', err);
      return throwError(() => new Error(err.error?.message || 'Impossible de charger les statistiques temporelles'));
    })
  );
}



  getStatsV2(request: LogStatsRequestV2): Observable<LogStatsResponseV2> {
    return this.http
      .post<ApiResponse<LogStatsResponseV2>>(`${this.baseUrl}/stats/v2`, request)
      .pipe(
        map(res => {
          if (!res.success) throw new Error(res.message);
          return res.data;
        }),
        catchError(err => throwError(() => err))
      );
  }

}
