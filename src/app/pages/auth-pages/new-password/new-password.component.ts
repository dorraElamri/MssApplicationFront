import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { ChangePasswordComponent } from '../../../shared/components/auth/change-password/change-password.component'; // ✅ importer le composant



@Component({
  selector: 'app-new-password',
  imports: [
    AuthPageLayoutComponent,
    ChangePasswordComponent
  ],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css',
})
export class NewPasswordComponent {

}
