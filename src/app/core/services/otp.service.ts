import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface OtpGenerateDto {
  email: string;
  purpose: number; // ex: 1 for forgot-password
}

interface OtpVerifyDto {
  email: string;
  code: string;
  purpose: number;
}

@Injectable({
  providedIn: 'root'
})
export class OtpService {
  private baseUrl = 'https://localhost:7010/api/User'; // <-- changer selon ton API

  constructor(private http: HttpClient) {}

  // Générer et envoyer OTP
  generateOtp(dto: OtpGenerateDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/otp/generate`, dto);
  }

  // Vérifier OTP
  verifyOtp(dto: OtpVerifyDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/otp/verify`, dto);
  }
}
