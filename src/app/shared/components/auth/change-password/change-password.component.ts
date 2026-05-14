import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';




@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule , LabelComponent, InputFieldComponent ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'] // si tu en as un
})
export class ChangePasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  otpCode = '';
  email = '';
  otpPurpose = 1; // 1 = ForgotPassword

  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Récupérer l'email depuis les query params (passé par otp-verification)
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        console.warn('Aucun email reçu en paramètre');
        // Option : rediriger vers forgot-password si email absent
        // this.router.navigate(['/forgot-password']);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email manquant. Veuillez recommencer la procédure.';
      return;
    }


    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;

    const payload = {
      email: this.email,
      newPassword: this.password,
      confirmPassword: this.confirmPassword,
      otpPurpose: this.otpPurpose,
      otpCode: this.otpCode.trim()
    };

    this.userService.changePassword(payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        alert('Mot de passe modifié avec succès !');
        // Ou mieux : utiliser un toast / notification service
        this.router.navigate(['/signin']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Erreur changement mot de passe', err);
        this.errorMessage = err.error?.message 
          || err.error?.error 
          || 'Une erreur est survenue lors de la modification du mot de passe';
      }
    });
  }
}