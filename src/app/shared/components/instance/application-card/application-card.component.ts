import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiResponse, InstanceService } from '../../../../core/services/instance.service';
import { FormsModule } from '@angular/forms';
import { Instance } from '../../../../core/models/Instance.model';

@Component({
  selector: 'app-application-card',
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './application-card.component.html',
})
export class ApplicationCardComponent implements OnInit {
  @Input() instance!: Instance | null;

  newApiKey: string | null = null;
  isRegenerating = false;
  successMessage: string | null = null;

  constructor(private instanceService: InstanceService) {}

  ngOnInit() {
  console.log('=== DEBUG Instance ===');
  console.log('status reçu :', this.instance?.status);
  console.log('lastLogAt reçu :', this.instance?.lastLogAt);
  console.log('isSendingLogs reçu :', this.instance?.isSendingLogs);
  
  if (this.instance) {
    this.instance = this.instanceService.enrichInstance(this.instance);
    console.log('Après enrichissement → status :', this.instance.status);
  }
}

  // ====================== HELPERS ======================
  getEnvironmentLabel(env: number): string {
    const labels: Record<number, string> = {
      0: 'Development',
      1: 'Staging',
      2: 'Production'
    };
    return labels[env] ?? 'Inconnu';
  }

  getEnvironmentColorClass(env: number): string {
    const colors: Record<number, string> = {
      0: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      2: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
    };
    return colors[env] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  getInitialLetter(name?: string | null): string {
    if (!name || name.trim() === '') return 'A';
    return name.trim().charAt(0).toUpperCase();
  }

  // Méthode principale pour le statut de connexion
  getConnectionStatus() {
    // On fait confiance au status enrichi par le service
    if (this.instance?.status === 'Online') {
      return { label: 'Online', color: 'success' as const };
    }
    if (this.instance?.status === 'Offline') {
      return { label: 'Offline', color: 'error' as const };
    }

    // Fallback très strict (ne devrait presque jamais arriver)
    return { label: 'Offline', color: 'error' as const };
  }

  getIsOnline(): boolean {
    return this.getConnectionStatus().label === 'Online';
  }

  // regenerateApiKey reste inchangé
  regenerateApiKey() {
    if (!this.instance?.id) {
      alert("Impossible de régénérer : ID manquant");
      return;
    }
    if (!confirm("Êtes-vous sûr de vouloir régénérer la clé API ?\n\nL'ancienne clé deviendra immédiatement invalide !")) {
      return;
    }

    this.isRegenerating = true;
    this.newApiKey = null;
    this.successMessage = null;

    this.instanceService.regenerateApiKey(this.instance.id).subscribe({
      next: (response: ApiResponse<{ apiKey?: string }>) => {
        if (response.success) {
          this.successMessage = response.message || "Clé API régénérée avec succès ! La page va se recharger...";
          if (response.data?.apiKey) {
            this.newApiKey = response.data.apiKey;
            if (this.instance) {
              this.instance.apiKey = response.data.apiKey;
              this.instance.apiKeyCreatedAt = new Date().toISOString();
            }
          }
          setTimeout(() => window.location.reload(), 1000);
        } else {
          alert(response.message || "Échec de la régénération de la clé API");
        }
      },
      error: (err) => {
        console.error("Erreur régénération API Key", err);
        alert("Erreur serveur : " + (err.error?.message || err.message || "Inconnue"));
      },
      complete: () => {
        this.isRegenerating = false;
      }
    });
  }
}