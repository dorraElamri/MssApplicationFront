import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ApplicationUser } from '../models/application-user';
import { Instance } from '../models/Instance.model';
import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  role?: string;
}


interface ChangePasswordDto {
  email: string;
  newPassword: string;
  confirmPassword: string;
  otpPurpose: number;
  otpCode: string;
}


export interface UpdateUserDto {
  fullName: string;
  email: string;
  role?: string;

}


@Injectable({ providedIn: 'root' })
export class UserService {
  private API_URL = 'https://localhost:7010/api/User';

  constructor(private http: HttpClient) {}

  // Créer un utilisateur
  createUser(dto: CreateUserDto): Observable<ApiResponse<ApplicationUser>> {
    return this.http.post<ApiResponse<ApplicationUser>>(this.API_URL, dto);
  }

  getCurrentUser(): Observable<ApiResponse<ApplicationUser>> {
    return this.http.get<ApiResponse<ApplicationUser>>(`${this.API_URL}/me`);
  }

   changePassword(dto: ChangePasswordDto): Observable<any> {
    return this.http.post(`${this.API_URL}/change-password`, dto);
  }

  getCurrentUserRoles(): Observable<ApiResponse<string[]>> {
  return this.http.get<ApiResponse<string[]>>(`${this.API_URL}/me/roles`);
}

getUserRoles(userId: string): Observable<ApiResponse<string[]>> {
  return this.http.get<ApiResponse<string[]>>(`${this.API_URL}/${userId}/roles`);
}

getAllUsers(): Observable<ApiResponse<ApplicationUser[]>> {
  return this.http.get<ApiResponse<ApplicationUser[]>>(`${this.API_URL}`);
}

deleteUser(userId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${userId}`).pipe(

      catchError(err => {
        console.error('Erreur suppression utilisateur', err);
        return throwError(() => new Error(err.error?.message || 'Impossible de supprimer l\'utilisateur'));
      })
    );
  }

  // Dans user.service.ts
getUserById(userId: string): Observable<ApiResponse<any>> {
  return this.http.get<ApiResponse<any>>(`${this.API_URL}/${userId}`).pipe(
    catchError(err => {
      console.error('Erreur getUserById', err);
      return throwError(() => new Error(err.error?.message || 'Impossible de charger l’utilisateur'));
    })
  );
}
 
  login(payload: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.API_URL}/login`,
      payload
    );

  }


updateUser(userId: string, dto: UpdateUserDto): Observable<ApiResponse<ApplicationUser>> {
  return this.http.put<ApiResponse<ApplicationUser>>(
    `${this.API_URL}/${userId}`,
    dto
  ).pipe(
    catchError(err => {
      console.error('Erreur lors de la mise à jour utilisateur', err);
      const errorMsg = err.error?.message || 'Impossible de modifier l’utilisateur';
      return throwError(() => new Error(errorMsg));
    })
  );
}


refreshToken(refreshToken: string) {
  return this.http.post<ApiResponse<AuthResponse>>(
    `${this.API_URL}/refresh`,
    { refreshToken }
  );
}

  
  
}
