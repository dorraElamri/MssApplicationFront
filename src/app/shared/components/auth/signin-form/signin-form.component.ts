// signin-form.component.ts
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    FormsModule,
    RouterModule
  ],
  templateUrl: './signin-form.component.html',
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // onSignIn() {
  //   if (!this.email || !this.password) {
  //     alert('Email et mot de passe requis');
  //     return;
  //   }

  //   this.loading = true;

  //   this.authService.login({
  //     email: this.email,
  //     password: this.password
  //   }).subscribe({
  //     next: (res) => {
  //       if (res.success && res.data) {
  //         // Stocker les tokens
  //         localStorage.setItem('access_token', res.data.accessToken);
  //         localStorage.setItem('refresh_token', res.data.refreshToken);

  //         // ✅ Correction : Récupération sécurisée de l'ID utilisateur
  //         const userId = res.data.userId;
  //         if (userId) {
  //           localStorage.setItem('userId', userId);
  //         } else {
  //           console.warn('Aucun userId reçu dans la réponse de login');
  //         }

  //         // Redirection selon le rôle (géré par AuthService)
  //         if (this.authService.isAdmin()) {
  //           this.router.navigate(['/']);           // ou '/admin/dashboard'
  //         } else {
  //           this.router.navigate(['/']);           // ou '/my-applications'
  //         }
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Login error:', err);
  //       alert(err.error?.message || 'Email ou mot de passe incorrect');
  //     },
  //     complete: () => {
  //       this.loading = false;
  //     }
  //   });
  // }


  onSignIn() {
  if (!this.email || !this.password) {
    alert('Email et mot de passe requis');
    return;
  }

  this.loading = true;

  this.authService.login({
    email: this.email,
    password: this.password
  }).subscribe({
    next: (res) => {
      if (res.success && res.data?.accessToken) {
        // On laisse AuthService gérer le token et l'utilisateur
        // Pas besoin de localStorage manuel ici (déjà fait dans AuthService)

        this.handleRedirectAfterLogin();
      }
    },
    error: (err) => {
      console.error(err);
      alert(err?.error?.message || 'Email ou mot de passe incorrect');
    },
    complete: () => this.loading = false
  });
}

private handleRedirectAfterLogin() {
  const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || null;

  if (returnUrl) {
    this.router.navigateByUrl(returnUrl);
  } else if (this.authService.isAdmin()) {
    this.router.navigate(['/']);           // Dashboard Admin
  } else {
    this.router.navigate(['/']); // Page utilisateur normal
  }
}

  goToSignUp() {
    this.router.navigate(['/signup']);
  }
}