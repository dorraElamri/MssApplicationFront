import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { ResetPasswordComponent } from "../../../shared/components/auth/reset-password/reset-password.component";

@Component({
  selector: 'app-reset',
  imports: [
    AuthPageLayoutComponent,
    ResetPasswordComponent
],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.css',
})
export class ResetComponent {

}
