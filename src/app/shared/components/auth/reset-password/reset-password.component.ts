import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import { OtpService } from '../../../../core/services/otp.service';



@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
    FormsModule ,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styles: [``
  ]
})
export class ResetPasswordComponent {
  email: string = '';
  loading: boolean = false;

  constructor(
    private otpService: OtpService ,
    private authService: AuthService,
    private router: Router
  ) {}


 onResetPassword() {
  if (!this.email || !this.email.includes('@')) {
    alert('Veuillez saisir un email valide');
    return;
  }

  this.loading = true;

  const body = {
    email: this.email,
    purpose: 1  // ✅ correspond à OtpPurpose.ForgotPassword
  };

  this.otpService.generateOtp(body)
    .subscribe({
      next: () => {
        this.loading = false;
        // Navigation vers la page OTP avec queryParams
        this.router.navigate(['/otp-code'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur OTP:', err);
        alert(err.error?.message || 'Impossible d’envoyer l’OTP');
      }
    });
}




}
