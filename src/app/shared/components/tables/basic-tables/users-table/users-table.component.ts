import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService, ApiResponse } from '../../../../../core/services/user.service';
import { ButtonComponent } from '../../../../../shared/components/ui/button/button.component';
import { PaginationComponent } from '../../../../../shared/components/ui/pagination/pagination.component';
import { ApplicationUser } from '../../../../../core/models/application-user';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './users-table.component.html',
  styles: [`
    .delete-modal-card {
      animation: modal-in 0.30s cubic-bezier(0.34, 1.46, 0.64, 1) both;
    }
    @keyframes modal-in {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @media (prefers-reduced-motion: reduce) {
      .delete-modal-card { animation: none; }
    }
  `]
})
export class UsersTableComponent implements OnInit {
  users: (ApplicationUser & { roles?: string[] })[] = [];
  filteredUsers: (ApplicationUser & { roles?: string[] })[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  // Recherche texte
  searchTerm = '';

  // Filtre par rôle
  selectedRole: 'all' | 'Admin' | 'User' = 'all'; // 'all' par défaut

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  showRoleFilter = false;

  // Delete modal
  showDeleteModal = false;
  userToDelete: (ApplicationUser & { roles?: string[] }) | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = null;

    this.userService.getAllUsers().subscribe({
      next: (response: ApiResponse<ApplicationUser[]>) => {
        if (response.success) {
          const rawUsers = response.data || [];
          this.users = rawUsers.map(user => ({ ...user, roles: [] }));
          this.filteredUsers = [...this.users];
          this.loadRolesForAllUsers();
          this.updatePagination();
        } else {
          this.errorMessage = response.message || 'Erreur lors du chargement des utilisateurs';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur serveur : ' + (err.message || 'Impossible de charger les utilisateurs');
        this.isLoading = false;
      }
    });
  }

  private loadRolesForAllUsers() {
    if (this.users.length === 0) return;

    interface RoleResponse { userId: string; roles: string[]; }

    const roleRequests = this.users.map(user =>
      this.userService.getUserRoles(user.id).pipe(
        map((res: ApiResponse<string[]>) => ({
          userId: user.id,
          roles: res.success ? (res.data || []) : []
        }))
      )
    );

    forkJoin(roleRequests).subscribe({
      next: (results: RoleResponse[]) => {
        results.forEach(result => {
          const user = this.users.find(u => u.id === result.userId);
          if (user) user.roles = result.roles;
        });
        this.applyFilters(); // Appliquer filtres après chargement rôles
      },
      error: (err) => {
        console.error('Erreur chargement rôles', err);
        this.errorMessage = 'Erreur lors du chargement des rôles';
      }
    });
  }
  

// Méthode pour reset le filtre rôle
resetRoleFilter() {
  this.selectedRole = 'all';
  this.applyFilters();
  this.showRoleFilter = false;
}


applyFilters() {
  let filtered = [...this.users];

  // Filtre texte
  const term = this.searchTerm.toLowerCase().trim();
  if (term) {
    filtered = filtered.filter(user =>
      user.fullName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.userName?.toLowerCase().includes(term) ||
      user.roles?.some(r => r.toLowerCase().includes(term))
    );
  }

  // Filtre rôle
  if (this.selectedRole !== 'all') {
    filtered = filtered.filter(user =>
      user.roles?.includes(this.selectedRole)
    );
  }

  this.filteredUsers = filtered;
  this.currentPage = 1;
  this.updatePagination();
}

  get paginatedUsers(): (ApplicationUser & { roles?: string[] })[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openDeleteModal(user: ApplicationUser & { roles?: string[] }): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
    const user = this.userToDelete;
    this.showDeleteModal = false;
    this.userToDelete = null;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.applyFilters();
      },
      error: (err) => alert('Erreur lors de la suppression : ' + err.message)
    });
  }
}