// user-info-card.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../../services/modal.service';
import { UserService } from '../../../../core/services/user.service'; // ton service existant
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';

import { ApiResponse } from '../../../../core/models/api-response.model';         // ajuste le chemin
import { ApplicationUser } from '../../../../core/models/application-user'; // ajuste le chemin

@Component({
  selector: 'app-user-info-card',
  standalone: true,
  imports: [
    FormsModule,
    
  ],
  templateUrl: './user-info-card.component.html',
  styles: []
})
export class UserInfoCardComponent implements OnInit {

  constructor(
    public modal: ModalService,
    private userService: UserService
  ) {}

  isOpen = false;

  openModal()  { this.isOpen = true;  }
  closeModal() { this.isOpen = false; }

  // Objet qui alimente le template
  user: any = {
    firstName: '',
    lastName: '',
    email: '',
   
  };

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (res: ApiResponse<ApplicationUser>) => {
        if (res.success && res.data) {
          const u = res.data;

          const nameParts = (u.fullName || u.userName || ' ').trim().split(/\s+/);
          const first = nameParts[0] || '';
          const last  = nameParts.slice(1).join(' ') || '';

          this.user = {
            firstName: first,
            lastName: last,
            email: u.email || '',
                      // pas dans ton modèle → à ajouter si besoin
            role: 'Chargement...', 
           
          };

          // Récupération des rôles (endpoint ajouté précédemment)
          this.userService.getCurrentUserRoles().subscribe({
            next: (roleRes: ApiResponse<string[]>) => {
              if (roleRes.success && roleRes.data?.length) {
                this.user.role = roleRes.data.join(', ');
              } else {
                this.user.role = 'Aucun rôle assigné';
              }
            },
            error: () => {
              this.user.role = 'Erreur lors du chargement des rôles';
            }
          });
        }
      },
      error: (err) => {
        console.error('Échec chargement profil', err);
        this.user.role = 'Erreur de chargement';
      }
    });
  }

  handleSave() {
    console.log('Données à sauvegarder :', this.user);

    // TODO : implémenter l'appel API de mise à jour si nécessaire
    // Exemple : this.userService.updateProfile(this.user).subscribe(...)

    this.closeModal();
  }
}