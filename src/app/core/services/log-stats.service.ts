// ============================================================
//  log-stats.service.ts  — CORRIGÉ
//  FIX : res.success (minuscule camelCase) au lieu de res.Success
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

import {
  LogStatsRequestV2,
  LogStatsResponseV2,
  InstanceOption
} from '../models/ log-stats.models';

// ─── Interface alignée sur la sérialisation JSON ASP.NET (camelCase) ─
interface ApiResponseRaw<T> {
  success: boolean;   // ← minuscule : ASP.NET sérialise en camelCase par défaut
  message: string;
  data: T;
  errors: any;
  resultCode: number;
}

@Injectable({ providedIn: 'root' })
export class LogStatsService {
  private readonly http         = inject(HttpClient);
  private readonly baseUrl      = `https://localhost:7010/api/logs`;
  private readonly instancesUrl = `https://localhost:7010/api/instances`;



private hubConnection?: signalR.HubConnection;

  private dashboardRefreshSubject = new Subject<void>();

  dashboardRefresh$ =
    this.dashboardRefreshSubject.asObservable();

  startConnection(): void {

    this.hubConnection =
      new signalR.HubConnectionBuilder()
        .withUrl(
          'https://localhost:7010/hubs/notifications', // à adapter
          {
            withCredentials: true
          }
        )
        .withAutomaticReconnect()
        .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR connecté');
      })
      .catch(err => {
        console.error(err);
      });

    this.registerEvents();
  }

  private registerEvents(): void {

    this.hubConnection?.on(
      'DashboardRefresh',
      () => {

        console.log('DashboardRefresh reçu');

        this.dashboardRefreshSubject.next();
      }
    );
  }





  // ── Stats V2 ─────────────────────────────────────────────
  getStatsV2(request: LogStatsRequestV2): Observable<LogStatsResponseV2> {
    return this.http
      .post<ApiResponseRaw<LogStatsResponseV2>>(`${this.baseUrl}/stats/v2`, request)
      .pipe(
        map(res => {
          if (!res.success) throw new Error(res.message ?? 'Erreur API');
          return res.data;
        }),
        catchError(err => throwError(() => err))
      );
  }

  // ── Instances disponibles ─────────────────────────────────
  getInstances(): Observable<InstanceOption[]> {
    return this.http
      .get<ApiResponseRaw<InstanceOption[]>>(this.instancesUrl)
      .pipe(
        map(res => (res.success ? res.data : [])),
        catchError(() => throwError(() => new Error('Erreur chargement instances')))
      );
  }

 

  // ── Export CSV ────────────────────────────────────────────
  exportCsv(request: LogStatsRequestV2): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/stats/export/csv`,
      request,
      { responseType: 'blob' }
    );
  }
}