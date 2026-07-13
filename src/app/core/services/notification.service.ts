// core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastService } from './toast.service';
import { HttpClient } from '@angular/common/http';
import { InstanceService } from './instance.service';

export interface InstanceInfo {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'Error' | 'Fatal';
  sourceInstanceId?: string;
  sourceInstanceName?: string;
  isOnline?: boolean;           // Sera rempli par enrichissement
  createdAt: Date;
  isRead: boolean;
  logEntryId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hubConnection!: HubConnection;

  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private baseUrl = 'https://localhost:7010';

  constructor(
    private toastService: ToastService,
    private http: HttpClient,
    private instanceService: InstanceService
  ) {}

  async startConnection(): Promise<void> {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('jwt');
    if (!token) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notifications`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.on('ReceiveNotification', (notif: NotificationDto) => {
      notif.createdAt = new Date(notif.createdAt);
      this.addNotification(notif);
      this.toastService.error(notif.title, notif.message, 8000);
      this.refreshUnreadCount();
    });

    try {
      await this.hubConnection.start();
      console.log('✅ SignalR Notifications Connected');
      await this.loadInitialNotifications();
      this.refreshUnreadCount();
    } catch (err) {
      console.error('❌ SignalR error', err);
    }
  }

  private addNotification(notification: NotificationDto) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
  }

  private async loadInitialNotifications() {
    try {
      const res = await this.http.get<any>(`${this.baseUrl}/api/notifications`).toPromise();
      if (res?.data) {
        let notifications = res.data.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));

        notifications = await this.enrichNotificationsWithInstanceInfo(notifications);
        this.notificationsSubject.next(notifications);
      }
    } catch (e) {
      console.warn('Impossible de charger les notifications initiales', e);
    }
  }

  /** 🔥 Méthode corrigée : Récupère le nom + statut online/offline */
  private async enrichNotificationsWithInstanceInfo(notifs: NotificationDto[]): Promise<NotificationDto[]> {
    const instanceIds = [...new Set(notifs.map(n => n.sourceInstanceId).filter(Boolean))];
    if (instanceIds.length === 0) return notifs;

    try {
      const allInstances = await this.instanceService.getAllInstances().toPromise() || [];
      const instanceMap = new Map<string, InstanceInfo>();

      allInstances.forEach(inst => {
        instanceMap.set(inst.id, {
          id: inst.id,
          name: inst.applicationName || inst.host || 'Unknown',
          isOnline: inst.isSendingLogs ?? false
        });
      });

      // Enrichissement complet
      return notifs.map(notif => {
        if (notif.sourceInstanceId && instanceMap.has(notif.sourceInstanceId)) {
          const info = instanceMap.get(notif.sourceInstanceId)!;
          return {
            ...notif,
            sourceInstanceName: info.name,
            isOnline: info.isOnline
          };
        }
        return notif;
      });
    } catch (err) {
      console.warn('Erreur enrichissement instances', err);
      return notifs;
    }
  }

  private async refreshUnreadCount() {
    try {
      const res = await this.http.get<any>(`${this.baseUrl}/api/notifications/unread-count`).toPromise();
      this.unreadCountSubject.next(res?.data ?? 0);
    } catch {}
  }

  async markAsRead(notification: NotificationDto): Promise<void> {
    if (notification.isRead) return;
    try {
      await this.http.put(`${this.baseUrl}/api/notifications/${notification.id}/read`, {}).toPromise();
      const current = this.notificationsSubject.value;
      const updated = current.map(n => n.id === notification.id ? { ...n, isRead: true } : n);
      this.notificationsSubject.next(updated);
      this.refreshUnreadCount();
    } catch (err) { console.error(err); }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.http.put(`${this.baseUrl}/api/notifications/read-all`, {}).toPromise();
      const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
      this.notificationsSubject.next(updated);
      this.unreadCountSubject.next(0);
    } catch {}
  }

  stopConnection() {
    this.hubConnection?.stop();
  }
}