import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { OtpService } from '../../../../core/services/otp.service';
@Component({
selector: 'app-otp-verification',
standalone: true,
imports: [CommonModule, FormsModule, RouterModule],
templateUrl: './otp-verification.component.html',
})
export class OtpVerificationComponent {
otp: string[] = ['', '', '', '', '', ''];
email = '';
loading = false;
purpose: number = 1;          // valeur par défaut (sécurité)

constructor(
private otpService: OtpService,
private router: Router,
private route: ActivatedRoute
) {}
ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.purpose = Number(params['purpose']) || 1;   // ← lecture + conversion

      // Sécurité : on accepte seulement 1 ou 2
      if (this.purpose !== 1 && this.purpose !== 2) {
        this.purpose = 1;
        console.warn('Purpose invalide reçu → fallback à 1');
      }

      if (!this.email) {
        console.warn('Aucun email reçu → possible redirection');
        // this.router.navigate(['/signup']); // ou autre page
      }
    });
  }
trackByIndex(index: number) {
return index;
}
// Saisie fluide
onModelChange(value: string, index: number) {
const digit = value.replace(/\D/g, '').charAt(0) || '';
this.otp[index] = digit;
if (digit && index < 5) {
const inputs = document.querySelectorAll<HTMLInputElement>('input');
inputs[index + 1]?.focus();
}
}
// Copier/coller OTP
onPaste(event: ClipboardEvent) {
event.preventDefault();
const paste = event.clipboardData?.getData('text') || '';
const digits = paste.replace(/\D/g, '').slice(0, 6);
digits.split('').forEach((d, i) => {
this.otp[i] = d;
});
const inputs = document.querySelectorAll<HTMLInputElement>('input');
inputs[Math.min(digits.length, 5)]?.focus();
}
// Vérification OTP
onVerifyOTP() {
    const code = this.otp.join('').trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      alert('Veuillez saisir un code OTP à 6 chiffres');
      return;
    }

    this.loading = true;

    this.otpService.verifyOtp({
      email: this.email,
      code: code,
      purpose: this.purpose   // ← valeur dynamique !
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('Réponse verify:', res);

        if (res.isSuccess || res.success || res.resultcode === 0) {
          alert(
            this.purpose === 2
              ? 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
              : 'Code correct ! Vous pouvez changer votre mot de passe.'
          );

          // Redirection selon le purpose
          if (this.purpose === 2) {
            this.router.navigate(['/signin']);
          } else if (this.purpose === 1) {
            this.router.navigate(['/new-password'], {
              queryParams: { email: this.email }
            });
          }
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur vérification OTP', err);
        alert(err.error?.message || 'Code OTP invalide ou expiré');
      }
    });
  }

  resendOTP() {
    if (!this.email) return;

    this.otpService.generateOtp({
      email: this.email,
      purpose: this.purpose   // ← réutilise la même valeur
    }).subscribe({
      next: () => alert('Nouveau code OTP envoyé'),
      error: () => alert('Erreur lors du renvoi du code')
    });
  }
}
