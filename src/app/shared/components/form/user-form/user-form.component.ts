import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../label/label.component';
import { InputFieldComponent } from '../input/input-field.component';
import { UserService, ApiResponse } from '../../../../core/services/user.service';
import { ApplicationUser } from '../../../../core/models/application-user';

interface UserFormData {
  fullName: string;
  email: string;
  role: 'Admin' | 'User';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    LabelComponent,
    InputFieldComponent,
    RouterLink
  ],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() user?: ApplicationUser;

  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  fieldErrors: Partial<Record<keyof UserFormData, string>> = {};

  formData: UserFormData = {
    fullName: '',
    email: '',
    role: 'Admin'
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.mode = 'edit';
      this.loadUserAndRoles(userId);   // ← Appel combiné
    } else {
      this.mode = 'create';
      this.resetForm();
    }
  }

  // Nouvelle méthode : charge l'utilisateur + son rôle en parallèle
  private loadUserAndRoles(userId: string) {
    this.isSubmitting = true;

    forkJoin({
      user: this.userService.getUserById(userId),
      roles: this.userService.getUserRoles(userId)
    }).subscribe({
      next: ({ user: userRes, roles: rolesRes }) => {
        if (userRes.success && userRes.data) {
          this.user = userRes.data;

          // Récupération correcte du rôle depuis l'API getUserRoles
          const userRoles = rolesRes.success && rolesRes.data ? rolesRes.data : [];
          const isAdmin = userRoles.some(r => r.toLowerCase() === 'admin');

          this.formData = {
            fullName: userRes.data.fullName || '',
            email: userRes.data.email || '',
            role: isAdmin ? 'Admin' : 'User'
          };
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les données de l’utilisateur';
        this.isSubmitting = false;
      }
    });
  }

  private resetForm() {
    this.formData = { fullName: '', email: '', role: 'User' };
    this.fieldErrors = {};
    this.successMessage = null;
    this.errorMessage = null;
  }

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Modifier l’utilisateur' : 'Créer un nouvel utilisateur';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Enregistrer les modifications' : 'Créer l’utilisateur';
  }

  get infoText(): string {
    return this.isEditMode
      ? 'Modifiez les informations de l’utilisateur ci-dessous.'
      : 'Les identifiants de connexion seront envoyés automatiquement par email.';
  }

  validateField(field: keyof UserFormData) {
    this.fieldErrors[field] = '';

    switch (field) {
      case 'fullName':
        if (!this.formData.fullName.trim()) {
          this.fieldErrors.fullName = 'Le nom complet est requis';
        } else if (this.formData.fullName.trim().length < 2) {
          this.fieldErrors.fullName = 'Minimum 2 caractères';
        }
        break;

      case 'email':
        if (!this.formData.email.trim()) {
          this.fieldErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email.trim())) {
          this.fieldErrors.email = 'Format d’email invalide';
        }
        break;
    }
  }

  get hasFieldErrors(): boolean {
    return Object.values(this.fieldErrors).some(err => !!err);
  }

  // Méthode appelée quand on clique sur un bouton rôle
  selectRole(role: 'Admin' | 'User') {
    this.formData.role = role;
  }

  onSubmit(form: NgForm) {
    (Object.keys(this.formData) as (keyof UserFormData)[]).forEach(key => this.validateField(key));

    if (this.hasFieldErrors || form.invalid) return;

    this.isSubmitting = true;
    this.successMessage = null;
    this.errorMessage = null;

    const payload = {
      fullName: this.formData.fullName.trim(),
      email: this.formData.email.trim().toLowerCase(),
      role: this.formData.role
    };

    if (this.isEditMode && this.user?.id) {
      this.userService.updateUser(this.user.id, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = 'Utilisateur modifié avec succès !';
            setTimeout(() => this.router.navigate(['/usersList']), 1800);
          } else {
            this.errorMessage = res.message || 'Échec de la modification';
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la modification';
          this.isSubmitting = false;
        }
      });
    } else {
      this.userService.createUser(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage = 'Utilisateur créé avec succès !';
            setTimeout(() => this.router.navigate(['/usersList']), 1800);
          } else {
            this.errorMessage = res.message || 'Échec de la création';
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la création';
          this.isSubmitting = false;
        }
      });
    }
  }
}