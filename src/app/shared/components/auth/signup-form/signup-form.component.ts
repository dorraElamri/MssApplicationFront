import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, CreateUserDto, ApiResponse } from '../../../../core/services/user.service';
import { OtpService } from '../../../../core/services/otp.service';           // ← À ajouter
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [
    LabelComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './signup-form.component.html',
})
export class SignupFormComponent {
  showPassword = false;
  isChecked = false;
  name = '';
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private userService: UserService,
    private otpService: OtpService,          // ← Injection nécessaire
    private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignUp() {
    this.errorMessage = '';
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Tous les champs sont obligatoires';
      return;
    }

    this.loading = true;

    const dto: CreateUserDto = {
      fullName: this.name.trim(),
      email: this.email.trim(),
    };

    this.userService.createUser(dto).subscribe({
     next: (res: ApiResponse<any>) => {
  if (res.success ) {   // ← plus robuste

    this.otpService.generateOtp({
      email: this.email.trim(),
      purpose: 2   // EmailVerification
    }).subscribe({
      next: () => {
        this.loading = false;
        // On passe DEUX query params : email + purpose
        this.router.navigate(['/otp-code'], {
          queryParams: { 
            email: this.email.trim(),
            purpose: 2
          }
        });
      },
      error: (otpErr) => {
        this.loading = false;
        console.error('Erreur génération OTP après signup', otpErr);
        this.errorMessage = 'Compte créé mais échec envoi code de vérification.';
      }
    });
        } else {
          this.loading = false;
          this.errorMessage = res.message || 'Échec de la création du compte';
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Erreur inscription complète :', err);

        if (err.status === 400 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else if (err.error?.errors) {
          // Erreurs de validation .NET (ModelState)
          this.errorMessage = Object.values(err.error.errors).flat().join(' • ');
        } else {
          this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l\'inscription';
        }
      }
    });
  }
}