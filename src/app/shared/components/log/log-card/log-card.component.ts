import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ComponentCardComponent } from '../../common/component-card/component-card.component';
import { LogService } from '../../../../core/services/log.service';
import { AiService, AIAnalysisRequestDto, AIAnalysisResponseDto } from '../../../../core/services/ai.service'; // Ajuste le chemin
import { LogEntryDto } from '../../../../core/models/logs.model';
import { BadgeComponent } from '../../ui/badge/badge.component';

@Component({
  selector: 'app-log-card',
  imports: [CommonModule, ComponentCardComponent, RouterLink, BadgeComponent],
  templateUrl: './log-card.component.html',
})
export class LogCardComponent implements OnInit {

  log: LogEntryDto | null = null;
  isLoading = true;
  error: string | null = null;
  instanceId: string | null = null;

  // === IA Analysis ===
  aiAnalysis: AIAnalysisResponseDto | null = null;
  isAnalyzing = false;
  aiError: string | null = null;

  // Pour le toggle processed
  isUpdating = false;

  constructor(
    private route: ActivatedRoute,
    private logService: LogService,
    private aiService: AiService
  ) {}

  ngOnInit() {
    const logId = this.route.snapshot.paramMap.get('id');
    this.instanceId = this.route.snapshot.paramMap.get('instanceId') || 
                      this.route.snapshot.queryParamMap.get('instanceId') || null;

    if (!logId) {
      this.error = "Aucun ID de log fourni dans l’URL";
      this.isLoading = false;
      return;
    }

    this.loadLog(logId);
  }

  private loadLog(logId: string) {
    this.logService.getLogById(logId).subscribe({
      next: (data) => {
        this.log = data;
        if (!this.instanceId && data.instanceId) this.instanceId = data.instanceId;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Impossible de charger les détails du log";
        this.isLoading = false;
      }
    });
  }

  // ====================== AI ANALYSIS ======================
  analyzeWithAI() {
    if (!this.log) return;

    this.isAnalyzing = true;
    this.aiError = null;
    this.aiAnalysis = null;

    const request: AIAnalysisRequestDto = {
      timestamp: this.log.timestamp,
      level: this.log.level || 'INFO',
      environment: this.log.environment,
      application: this.log.application,
      service: this.log.service,
      message: this.log.message,
      exceptionType: this.log.exception?.type,
      exceptionMessage: this.log.exception?.message,
      stackTrace: this.log.exception?.stackTrace,
      endpoint: this.log.request?.endpoint,
      durationMs: this.log.request?.durationMs,
      traceId: this.log.traceId,
      correlationId: this.log.correlationId,
      serverName: this.log.sourceServer?.name,
      serverIp: this.log.sourceServer?.ip
    };

    this.aiService.analyzeLog(request).subscribe({
      next: (result) => {
        this.aiAnalysis = result;
        this.isAnalyzing = false;
      },
      error: (err) => {
        this.aiError = err.message;
        this.isAnalyzing = false;
      }
    });
  }
  // Toggle du statut isProcessed
  toggleProcessed() {
    if (!this.log || this.isUpdating) return;

    const newStatus = !this.isProcessed();
    this.isUpdating = true;

    this.logService.markAsProcessed(this.log.id, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          // Mise à jour locale immédiate
          this.log!.isProcessed = newStatus;
        } else {
          alert(response.message || "Échec de la mise à jour");
        }
      },
      error: (err) => {
        console.error(err);
        alert("Erreur lors de la mise à jour : " + (err.message || "Erreur serveur"));
      },
      complete: () => {
        this.isUpdating = false;
      }
    });
  }

  // Helpers
  isProcessed(): boolean {
    if (!this.log?.isProcessed) return false;
    return this.log.isProcessed === true ||
           this.log.isProcessed === 'true' ||
           this.log.isProcessed === 'True';
  }

  getProcessedLabel(): string {
    return this.isProcessed() ? 'Traité' : 'Non traité';
  }

  getProcessedColor(): 'success' | 'error' {
    return this.isProcessed() ? 'success' : 'error';
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '0001-01-01T00:00:00') return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short'
    });
  }

  getLevelBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      'Error': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300',
      'Warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300',
      'Info': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300',
      'Debug': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300'
    };
    return classes[level] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300';
  }

  hasException(): boolean {
    return !!(this.log?.exception?.type || this.log?.exception?.message || this.log?.exception?.stackTrace);
  }
}