import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { OtpVerificationComponent } from "../../../shared/components/auth/otp-verification/otp-verification.component";


@Component({
  selector: 'app-otp-code',
  imports: [
    AuthPageLayoutComponent,
    OtpVerificationComponent
],
  templateUrl: './otp-code.component.html',
  styleUrl: './otp-code.component.css',
})
export class OtpCodeComponent {

}
