import { Component, OnInit } from '@angular/core';
import { CommonModule  } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaginationComponent } from '../../../../shared/components/ui/pagination/pagination.component';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { UserService, ApiResponse } from '../../../../core/services/user.service';
import { InstanceService } from '../../../../core/services/instance.service';
import { ButtonComponent } from '../../../../shared/components/ui/button/button.component';
import { ApplicationUser } from '../../../../core/models/application-user';
import { NgModel , FormsModule } from '@angular/forms';
import { Instance } from '../../../../core/models/Instance.model';

@Component({
  selector: 'app-user-instance-card',
  imports: [CommonModule, RouterLink, ButtonComponent, DragDropModule, FormsModule, PaginationComponent],
  templateUrl: './user-instance-card.component.html',
})
export class UserInstanceCardComponent implements OnInit {
  user: ApplicationUser | null = null;
  userRoles: string[] = [];
  associatedInstances: Instance[] = [];
  availableInstances: Instance[] = [];

  // Une seule recherche pour les deux blocs
  globalSearch = '';

  // Pagination
  associatedPage = 1;
  availablePage = 1;
  pageSize = 6; // tu peux changer : 6, 9, 12...

  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private instanceService: InstanceService
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.errorMessage = "Aucun ID d'utilisateur fourni";
      this.isLoading = false;
      return;
    }
    this.loadUserData(userId);
  }

  private loadUserData(userId: string) {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (res: ApiResponse<ApplicationUser[]>) => {
        if (res.success && res.data) {
          const found = res.data.find(u => u.id === userId);
          if (found) {
            this.user = found;
            this.loadUserRoles(userId);
            this.loadUserInstances(userId);
            this.loadAllInstances();
          } else {
            this.errorMessage = "Utilisateur non trouvé";
            this.isLoading = false;
          }
        } else {
          this.errorMessage = res.message || 'Erreur chargement utilisateur';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = 'Erreur serveur : ' + (err.message || 'Impossible de charger');
        this.isLoading = false;
      }
    });
  }

  private loadUserRoles(userId: string) {
    this.userService.getUserRoles(userId).subscribe({
      next: (res: ApiResponse<string[]>) => {
        if (res.success) this.userRoles = res.data || [];
      },
      error: () => this.userRoles = []
    });
  }

  private loadUserInstances(userId: string) {
    this.instanceService.getInstancesOfUser(userId).subscribe({
      next: (res: ApiResponse<Instance[]>) => {
        if (res.success) {
          this.associatedInstances = res.data || [];
          this.updateAvailableInstances();
        } else {
          this.associatedInstances = [];
        }
        this.isLoading = false;
      },
      error: () => {
        this.associatedInstances = [];
        this.isLoading = false;
      }
    });
  }

  private loadAllInstances() {
    this.instanceService.getAllInstances().subscribe({
      next: (instances) => {
        this.availableInstances = instances.filter(
          inst => !this.associatedInstances.some(a => a.id === inst.id)
        );
      },
      error: () => this.availableInstances = []
    });
  }

  private updateAvailableInstances() {
    this.instanceService.getAllInstances().subscribe({
      next: (instances) => {
        this.availableInstances = instances.filter(
          inst => !this.associatedInstances.some(a => a.id === inst.id)
        );
      }
    });
  }

  // Filtre global (une seule recherche)
  get filteredInstances(): { associated: Instance[]; available: Instance[] } {
    const term = this.globalSearch.toLowerCase().trim();

    const filterFn = (inst: Instance) =>
      (inst.applicationName?.toLowerCase().includes(term) || '') ||
      inst.host.toLowerCase().includes(term);

    return {
      associated: this.associatedInstances.filter(filterFn),
      available: this.availableInstances.filter(filterFn)
    };
  }

  // Pagination associées
  get paginatedAssociated(): Instance[] {
    const start = (this.associatedPage - 1) * this.pageSize;
    return this.filteredInstances.associated.slice(start, start + this.pageSize);
  }

  get associatedTotalPages(): number {
    return Math.ceil(this.filteredInstances.associated.length / this.pageSize) || 1;
  }

  // Pagination disponibles
  get paginatedAvailable(): Instance[] {
    const start = (this.availablePage - 1) * this.pageSize;
    return this.filteredInstances.available.slice(start, start + this.pageSize);
  }

  get availableTotalPages(): number {
    return Math.ceil(this.filteredInstances.available.length / this.pageSize) || 1;
  }

  goToAssociatedPage(page: number) {
    if (page >= 1 && page <= this.associatedTotalPages) {
      this.associatedPage = page;
    }
  }

  goToAvailablePage(page: number) {
    if (page >= 1 && page <= this.availableTotalPages) {
      this.availablePage = page;
    }
  }

  drop(event: CdkDragDrop<Instance[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const instance = event.previousContainer.data[event.previousIndex];
    const isDroppingToAssociated = event.container.id === 'associatedList';

    if (isDroppingToAssociated) {
      this.assignInstance(instance.id);
    } else {
      this.removeInstance(instance.id);
    }

    // Déplacement visuel immédiat (optimistic UI)
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  assignInstance(instanceId: string) {
    if (!this.user) return;
    this.instanceService.assignUserToInstance(instanceId, this.user.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = "Instance associée !";
          setTimeout(() => this.successMessage = null, 3000);
          this.loadUserInstances(this.user!.id);
          this.loadAllInstances();
        } else {
          this.errorMessage = res.message || "Échec association";
        }
      },
      error: (err) => {
        this.errorMessage = "Échec association : " + err.message;
      }
    });
  }

  removeInstance(instanceId: string) {
    if (!this.user) return;
    this.instanceService.removeUserFromInstance(instanceId, this.user.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = "Instance retirée !";
          setTimeout(() => this.successMessage = null, 3000);
          this.loadUserInstances(this.user!.id);
          this.loadAllInstances();
        } else {
          this.errorMessage = res.message || "Échec retrait";
        }
      },
      error: (err) => {
        this.errorMessage = "Échec retrait : " + err.message;
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getEnvironmentLabel(env: number): string {
    const labels = ['Développement', 'Staging', 'Production'];
    return labels[env] || 'Inconnu';
  }
}