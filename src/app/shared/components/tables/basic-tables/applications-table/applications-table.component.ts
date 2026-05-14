import { FormsModule, NgModel } from '@angular/forms';
import { InstanceService } from './../../../../../core/services/instance.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { TableDropdownComponent } from '../../../common/table-dropdown/table-dropdown.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { RouterLink } from "@angular/router";
import { Instance } from '../../../../../core/models/Instance.model';

@Component({
  selector: 'app-applications-table',
  imports: [
    CommonModule,
    TableDropdownComponent,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    RouterLink,
     
  ],
  templateUrl: './applications-table.component.html',
})
export class ApplicationsTableComponent implements OnInit {
  instances: Instance[] = [];
  isLoading = true;
  errorMsg: string | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  filteredInstances: Instance[] = [];
  searchTerm: string = '';

  // Filtres existants
  filterActive: boolean = false;
  filterInactive: boolean = false;
  filterDevelopment: boolean = false;
  filterStaging: boolean = false;
  filterProduction: boolean = false;

  // NOUVEAU : Filtre par statut de connexion
  filterOnline: boolean = false;
  filterOffline: boolean = false;

  showFilter: boolean = false;

  constructor(private instanceService: InstanceService) {}

  ngOnInit(): void {
    this.loadInstances();
  }

  // Mise à jour du compteur de filtres actifs
  get activeFiltersCount(): number {
    return [
      this.filterActive,
      this.filterInactive,
      this.filterDevelopment,
      this.filterStaging,
      this.filterProduction,
      this.filterOnline,
      this.filterOffline
    ].filter(Boolean).length;
  }

  // Mise à jour de applyFilters avec le nouveau filtre Online/Offline
  applyFilters() {
    this.filteredInstances = this.instances.filter(item => {
      let matchStatus = true;
      let matchEnv = true;
      let matchConnection = true;

      // Filtre statut (Active / Inactive)
      if (this.filterActive || this.filterInactive) {
        matchStatus = (this.filterActive && item.isActive) || (this.filterInactive && !item.isActive);
      }

      // Filtre environnement
      if (this.filterDevelopment || this.filterStaging || this.filterProduction) {
        matchEnv =
          (this.filterDevelopment && item.environment === 0) ||
          (this.filterStaging && item.environment === 1) ||
          (this.filterProduction && item.environment === 2);
      }

      // NOUVEAU : Filtre par statut de connexion (Online / Offline)
      if (this.filterOnline || this.filterOffline) {
        const isOnline = this.getIsOnline(item);
        matchConnection = (this.filterOnline && isOnline) || (this.filterOffline && !isOnline);
      }

      return matchStatus && matchEnv && matchConnection;
    });

    this.currentPage = 1;
    this.showFilter = false;
  }

  // Helper pour déterminer si une instance est Online
  private getIsOnline(item: Instance): boolean {
    if (!item.lastLogAt) return false;
    const lastLog = new Date(item.lastLogAt);
    const secondsSinceLastLog = (Date.now() - lastLog.getTime()) / 1000;
    return secondsSinceLastLog < 60;
  }

  resetFilters() {
    this.filterActive = false;
    this.filterInactive = false;
    this.filterDevelopment = false;
    this.filterStaging = false;
    this.filterProduction = false;
    this.filterOnline = false;
    this.filterOffline = false;

    this.filteredInstances = [...this.instances];
    this.currentPage = 1;
    this.showFilter = false;
  }

  loadInstances(): void {
    this.isLoading = true;
    this.errorMsg = null;
    this.instanceService.getAllInstances().subscribe({
      next: (data) => {
        this.instances = data;
        this.filteredInstances = [...data];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = err.message || 'Impossible de charger les instances';
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.trim().toLowerCase();
    if (!this.searchTerm) {
      this.filteredInstances = [...this.instances];
      return;
    }
    this.filteredInstances = this.instances.filter(item => {
      return (
        (item.applicationName?.toLowerCase().includes(this.searchTerm) ?? false) ||
        item.host.toLowerCase().includes(this.searchTerm) ||
        this.getEnvironmentLabel(item.environment).toLowerCase().includes(this.searchTerm) ||
        (item.isActive ? 'active' : 'inactive').includes(this.searchTerm) ||
        (item.description?.toLowerCase().includes(this.searchTerm) ?? false)
      );
    });
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredInstances.length / this.itemsPerPage);
  }

  get currentItems(): Instance[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInstances.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Helpers affichage
  getEnvironmentLabel(value: number): string {
    const map: Record<number, string> = {
      0: 'Development',
      1: 'Staging',
      2: 'Production'
    };
    return map[value] ?? 'Inconnu';
  }

  getBadgeColor(isActive: boolean): 'success' | 'warning' | 'error' {
    return isActive ? 'success' : 'error';
  }

  // Statut de connexion (utilisé dans le template)
  getConnectionStatus(item: Instance): { label: string; color: 'success' | 'error' } {
    const isOnline = this.getIsOnline(item);
    return {
      label: isOnline ? 'Online' : 'Offline',
      color: isOnline ? 'success' : 'error'
    };
  }

  confirmAndDelete(item: Instance): void {
    const appName = item.applicationName || item.host || 'cette instance';
    if (!confirm(`Voulez-vous vraiment supprimer "${appName}" ?\n\nCette action est irréversible !`)) {
      return;
    }

    this.instanceService.DeleteInstance(item.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.instances = this.instances.filter(i => i.id !== item.id);
          alert(`"${appName}" a été supprimée avec succès.`);
        } else {
          alert("Échec de la suppression : " + (response.message || "Erreur inconnue"));
        }
      },
      error: (err) => {
        console.error("Erreur suppression instance", err);
        alert("Erreur lors de la suppression : " + (err.error?.message || err.message || "Erreur serveur"));
      }
    });
  }
}