// src/app/core/models/instance.model.ts
export interface Instance {
  id: string;
  applicationName?: string | null;
  host: string;
  description?: string | null;

  // Sécurité
  apiKey: string;
  isActive: boolean;
  apiKeyCreatedAt: string;
  apiKeyLastUsedAt?: string | null;

  // Configuration
  logPath?: string | null;
  environment: number;   // 0=Dev, 1=Staging, 2=Prod

  // Audit
  createdAt: string;
  updatedAt?: string | null;

  // NOUVEAU : Créateur
  createdById?: string | null;
  createdByName?: string | null;
  

  // NOUVEAU : Statut en temps réel
  lastLogAt?: string | null;

  // Propriétés calculées (non mappées en base)
  isSendingLogs?: boolean;
  status?: 'Online' | 'Offline';
}