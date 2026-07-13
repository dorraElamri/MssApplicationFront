import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';


export interface AIAnalysisRequestDto {
  timestamp?: string;
  level: string;
  environment?: string;
  application?: string;
  service?: string;
  message: string;
  exceptionType?: string;
  exceptionMessage?: string;
  stackTrace?: string;
  endpoint?: string;
  durationMs?: number;
  traceId?: string;
  correlationId?: string;
  serverName?: string;
  serverIp?: string;
}

export interface AIAnalysisResponseDto {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  explanation: string;
  probableCause: string;
  solutions: string[];
  confidenceScore: number;
  requiresImmediateAttention: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private readonly apiUrl = 'https://localhost:7010/api/AI/analyze'; // Adaptez selon votre proxy ou base URL

  constructor(private http: HttpClient) {}

  analyzeLog(request: AIAnalysisRequestDto): Observable<AIAnalysisResponseDto> {
    return this.http.post<AIAnalysisResponseDto>(this.apiUrl, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue lors de l\'analyse IA';

    if (error.error?.Error) {
      errorMessage = `${error.error.Error} - ${error.error.Details || ''}`;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au backend. Vérifiez que le serveur .NET est démarré.';
    } else if (error.status === 400) {
      errorMessage = error.error?.title || 'Requête invalide';
    } else if (error.status === 500) {
      errorMessage = 'Erreur interne du serveur IA (Ollama)';
    }

    console.error('AI Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}