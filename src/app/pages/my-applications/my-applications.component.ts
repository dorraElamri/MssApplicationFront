import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InstanceService } from '../../core/services/instance.service';
import { Instance } from '../../core/models/Instance.model';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent
  ],
  templateUrl: './my-applications.component.html',
})
export class MyApplicationsComponent implements OnInit {
  instances: Instance[] = [];
  filteredInstances: Instance[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  // Filtres
  searchTerm: string = '';
  showFilter = false;

  filterActive = false;
  filterInactive = false;
  filterDevelopment = false;
  filterStaging = false;
  filterProduction = false;

  // Filtre Connexion
  filterOnline: boolean = false;
  filterOffline: boolean = false;

  constructor(private instanceService: InstanceService) {}

  ngOnInit() {
    this.loadMyInstances();
  }

  loadMyInstances() {
    this.isLoading = true;
    this.errorMessage = null;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.errorMessage = "Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.";
      this.isLoading = false;
      return;
    }

    this.instanceService.getInstancesOfUser(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.instances = response.data;
          this.applyFilters(); // Important : appliquer les filtres après chargement
        } else {
          this.errorMessage = response.message || 'Aucune instance trouvée';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Impossible de charger vos instances.';
        this.isLoading = false;
      }
    });
  }

  // ====================== FILTRES ======================
  applyFilters() {
    let result = [...this.instances];

    // 1. Recherche texte
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.applicationName?.toLowerCase().includes(term) ||
        item.host?.toLowerCase().includes(term) ||
        (item.description?.toLowerCase().includes(term) ?? false)
      );
    }

    // 2. Filtre Statut Active / Inactive
    if (this.filterActive || this.filterInactive) {
      result = result.filter(item => {
        if (this.filterActive && this.filterInactive) return true;
        return (this.filterActive && item.isActive) || (this.filterInactive && !item.isActive);
      });
    }

    // 3. Filtre Environnement
    if (this.filterDevelopment || this.filterStaging || this.filterProduction) {
      result = result.filter(item => {
        const env = item.environment;
        return (this.filterDevelopment && env === 0) ||
               (this.filterStaging && env === 1) ||
               (this.filterProduction && env === 2);
      });
    }

    // 4. Filtre Connexion (Online / Offline) ← CORRIGÉ
    if (this.filterOnline || this.filterOffline) {
      result = result.filter(item => {
        const isOnline = this.getIsOnline(item);
        return (this.filterOnline && isOnline) || (this.filterOffline && !isOnline);
      });
    }

    this.filteredInstances = result;
  }

  // Helper pour déterminer si une instance est Online
   getIsOnline(item: Instance): boolean {
    if (!item.lastLogAt) return false;
    const lastLog = new Date(item.lastLogAt);
    const secondsSinceLastLog = (Date.now() - lastLog.getTime()) / 1000;
    return secondsSinceLastLog < 60; // moins de 60 secondes = Online
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterActive = false;
    this.filterInactive = false;
    this.filterOnline = false;
    this.filterOffline = false;
    this.filterDevelopment = false;
    this.filterStaging = false;
    this.filterProduction = false;
    this.showFilter = false;
    this.filteredInstances = [...this.instances];
  }

  getEnvironmentLabel(env: number): string {
    const labels: Record<number, string> = {
      0: 'Development',
      1: 'Staging',
      2: 'Production'
    };
    return labels[env] || 'Inconnu';
  }

  get activeFiltersCount(): number {
    return [
      this.filterActive, this.filterInactive,
      this.filterOnline, this.filterOffline,
      this.filterDevelopment, this.filterStaging, this.filterProduction
    ].filter(Boolean).length;
  }
}