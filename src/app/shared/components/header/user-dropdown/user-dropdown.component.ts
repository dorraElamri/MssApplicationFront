import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { ApplicationUser } from '../../../../core/models/application-user';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})



export class UserDropdownComponent implements OnInit {

  isOpen = false;
  user: ApplicationUser | null = null;

  get initials(): string {
    const name = this.user?.fullName || this.user?.userName || this.user?.email || '';
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

constructor(
  private userService: UserService,
  private authService: AuthService,
  private router: Router
) {}

  ngOnInit() {
  this.userService.getCurrentUser().subscribe({
    next: (res) => {
      this.user = res.data; // <-- ici on prend uniquement l'utilisateur
    },
    error: () => {
      this.user = null;
    }
  });
}


  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }



  onLogout() {
    if (confirm('Voulez-vous vous déconnecter ?')) {
    this.authService.logout();
  } // 🔥 supprime token + user + role


}
}