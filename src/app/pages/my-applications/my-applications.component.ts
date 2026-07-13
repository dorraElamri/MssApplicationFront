import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InstanceService } from '../../core/services/instance.service';
import { AuthService } from '../../core/services/auth.service';
import { Instance } from '../../core/models/Instance.model';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageBreadcrumbComponent
  ],
  templateUrl: './my-applications.component.html',
})
export class MyApplicationsComponent implements OnInit {
  instances: Instance[] = [];
  filteredInstances: Instance[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  searchTerm = '';
  showFilter = false;

  filterActive = false;
  filterInactive = false;
  filterDevelopment = false;
  filterStaging = false;
  filterProduction = false;
  filterOnline = false;
  filterOffline = false;

  constructor(
    private instanceService: InstanceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadMyInstances();
  }

  loadMyInstances() {
    this.isLoading = true;
    this.errorMessage = null;

    // ── FIX: read userId from the decoded JWT token, not from localStorage ──
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage = "Impossible d'identifier l'utilisateur. Veuillez vous reconnecter.";
      this.isLoading = false;
      return;
    }

    this.instanceService.getInstancesOfUser(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.instances = response.data;
          this.applyFilters();
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

  applyFilters() {
    let result = [...this.instances];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.applicationName?.toLowerCase().includes(term) ||
        item.host?.toLowerCase().includes(term) ||
        (item.description?.toLowerCase().includes(term) ?? false)
      );
    }

    if (this.filterActive || this.filterInactive) {
      result = result.filter(item =>
        (this.filterActive && item.isActive) || (this.filterInactive && !item.isActive)
      );
    }

    if (this.filterDevelopment || this.filterStaging || this.filterProduction) {
      result = result.filter(item =>
        (this.filterDevelopment && item.environment === 0) ||
        (this.filterStaging && item.environment === 1) ||
        (this.filterProduction && item.environment === 2)
      );
    }

    if (this.filterOnline || this.filterOffline) {
      result = result.filter(item => {
        const online = this.getIsOnline(item);
        return (this.filterOnline && online) || (this.filterOffline && !online);
      });
    }

    this.filteredInstances = result;
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

  getIsOnline(item: Instance): boolean {
    if (!item.lastLogAt) return false;
    return (Date.now() - new Date(item.lastLogAt).getTime()) / 1000 < 60;
  }

  getEnvironmentLabel(env: number): string {
    return ({ 0: 'Development', 1: 'Staging', 2: 'Production' } as Record<number, string>)[env] || 'Inconnu';
  }

  getEnvironmentAccent(env: number): string {
    return ({ 0: '#3b82f6', 1: '#f59e0b', 2: '#10b981' } as Record<number, string>)[env] || '#8788ff';
  }

  getAvatarStyle(item: Instance): string {
    const colors: Record<number, string> = {
      0: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      1: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      2: 'linear-gradient(135deg, #10b981, #0891b2)',
    };
    return `background: ${colors[item.environment] ?? 'linear-gradient(135deg, #8788ff, #787AEA)'}`;
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  get onlineCount(): number {
    return this.instances.filter(i => this.getIsOnline(i)).length;
  }

  get activeFiltersCount(): number {
    return [
      this.filterActive, this.filterInactive,
      this.filterOnline, this.filterOffline,
      this.filterDevelopment, this.filterStaging, this.filterProduction
    ].filter(Boolean).length;
  }
}
