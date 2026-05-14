import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Instance } from '../models/Instance.model';

// src/app/core/models/api-response.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;           // ou string | undefined si tu veux être plus permissif
  data: T;
  errors?: any;              // optionnel
  resultCode?: number;       // optionnel
}

export interface CreateInstanceDto {
  applicationName?: string | null;
  host: string;               // obligatoire
  logPath?: string | null;
  description?: string | null;
  environment: number;        // 0,1,2
}


export interface UpdateInstanceDto {
  applicationName?: string | null;
  host: string;               // obligatoire
  logPath?: string | null;
  description?: string | null;
  environment: number;  
    isActive: boolean;                
}



@Injectable({
  providedIn: 'root'
})
export class InstanceService {

  
   private apiUrl = 'https://localhost:7010/api/instances';

  constructor(private http: HttpClient) {}

  createInstance(dto: CreateInstanceDto): Observable<ApiResponse<Instance>> {
    return this.http.post<ApiResponse<Instance>>(this.apiUrl, dto).pipe(
      catchError(this.handleError)
    );
  }





getInstanceById(id: string): Observable<Instance> {
    return this.http.get<ApiResponse<Instance>>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Instance non trouvée');
        }
        return this.enrichInstance(response.data);
      }),
      catchError(this.handleError)
    );
  }

  getAllInstances(): Observable<Instance[]> {
    return this.http.get<ApiResponse<Instance[]>>(this.apiUrl).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Réponse invalide');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }



  updateInstance(id: string, dto: UpdateInstanceDto): Observable<ApiResponse<Instance>> {
  return this.http.put<ApiResponse<Instance>>(`${this.apiUrl}/${id}`, dto).pipe(
    catchError(this.handleError)
  );
}




regenerateApiKey(id: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/${id}/regenerate-apikey`, {}).pipe(
    catchError(this.handleError)
  );
}

DeleteInstance(id: string): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
    catchError(this.handleError)
  );  
}

getInstancesOfUser(userId: string): Observable<ApiResponse<Instance[]>> {
    return this.http.get<ApiResponse<Instance[]>>(`${this.apiUrl}/${userId}/Instances`).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Aucune instance trouvée');
        }
        // Enrichir toutes les instances retournées
        return {
          ...response,
          data: this.enrichInstances(response.data)
        };
      }),
      catchError(this.handleError)
    );
  }



assignUserToInstance(instanceId: string, userId: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${instanceId}/users`, { userId })
      .pipe(catchError(this.handleError));
  }


removeUserFromInstance(instanceId: string, userId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${instanceId}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

enrichInstance(instance: Instance): Instance {
    const lastLog = instance.lastLogAt ? new Date(instance.lastLogAt) : null;
    const isSendingLogs = lastLog
      ? (Date.now() - lastLog.getTime()) / 1000 < 60
      : false;

    return {
      ...instance,
      isSendingLogs,
      status: isSendingLogs ? 'Online' : 'Offline'
    };
  }

  private enrichInstances(instances: Instance[]): Instance[] {
    return instances.map(inst => this.enrichInstance(inst));
  }



  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Erreur inconnue';

    if (error.status === 401 || error.status === 403) {
      message = 'Accès refusé – droits insuffisants (admin requis)';
    } else if (error.status === 0) {
      message = 'Impossible de contacter le serveur';
    } else if (error.error?.message) {
      message = error.error.message;
    } else {
      message = `Erreur ${error.status}`;
    }

    console.error(message, error);
    return throwError(() => new Error(message));
  }

}