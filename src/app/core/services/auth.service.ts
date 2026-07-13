// // src/app/core/services/auth.service.ts
// import { Injectable } from '@angular/core';
// import { BehaviorSubject, tap } from 'rxjs';
// import { UserService } from './user.service';
// import { LoginRequest } from '../models/login-request.model';
// import { ApiResponse } from '../models/api-response.model';
// import { AuthResponse } from '../models/auth-response.model';
// import { jwtDecode } from 'jwt-decode';

// export type UserRole = 'Admin' | 'User';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {

//   private currentRole = new BehaviorSubject<UserRole>('User');
//   currentRole$ = this.currentRole.asObservable();

//   constructor(private userService: UserService) {}

//   login(payload: LoginRequest) {
//     return this.userService.login(payload).pipe(
//       tap((res: ApiResponse<AuthResponse>) => {
//         if (res.success && res.data) {
//           this.setRoleFromAuthResponse(res.data);
//         }
//       })
//     );
//   }

//   private setRoleFromAuthResponse(authResponse: AuthResponse) {
//     let roles: string[] = [];

//     // Gestion des deux cas possibles : string ou string[]
//     if (typeof authResponse.role === 'string') {
//       roles = [authResponse.role];
//     } else if (Array.isArray(authResponse.role)) {
//       roles = authResponse.role;
//     }

//     if (roles.length === 0) {
//       console.warn('Aucun rôle reçu dans AuthResponse');
//       this.setRole('User');
//       return;
//     }

//     // Vérification robuste
//     const isAdmin = roles.some(r => 
//       r?.toLowerCase() === 'admin' || r === 'Admin'
//     );

//     const role: UserRole = isAdmin ? 'Admin' : 'User';

//     console.log('Rôle détecté après login →', role, '| Roles reçus:', roles);
   

//     this.setRole(role);
//   }

//   setRole(role: UserRole) {
//     this.currentRole.next(role);
//     localStorage.setItem('userRole', role);
//   }

//   loadRoleFromStorage() {
//     const savedRole = localStorage.getItem('userRole') as UserRole;
//     if (savedRole) {
//       this.currentRole.next(savedRole);
//     }
//   }

//   isAdmin(): boolean {
//     const isAdmin = this.currentRole.value === 'Admin';
//    // console.log('[isAdmin] Current Role:', this.currentRole.value, '→', isAdmin);
//     return isAdmin;
//   }

//   logout() {
//     this.currentRole.next('User');
//     localStorage.removeItem('userRole');
//   }


//   loadRoleFromToken() {
//   const token = localStorage.getItem('access_token');

//   if (!token) return;

//   try {
//     const decoded: any = jwtDecode(token);

//     const roles = decoded.role || decoded.roles || [];

//     let role: UserRole = 'User';

//     if (Array.isArray(roles)) {
//       role = roles.some((r: string) => r.toLowerCase() === 'admin')
//         ? 'Admin'
//         : 'User';
//     } else if (typeof roles === 'string') {
//       role = roles.toLowerCase() === 'admin' ? 'Admin' : 'User';
//     }

//     this.currentRole.next(role);

//     console.log('Rôle restauré depuis token →', role);

//   } catch (e) {
//     console.error('Erreur décodage token', e);
//   }
// }
// }

import { Injectable } from '@angular/core';
import { BehaviorSubject, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { UserService } from './user.service';
import { AuthResponse } from '../models/auth-response.model';
import { LoginRequest } from '../models/login-request.model';
import { ApiResponse } from '../models/api-response.model';
import { Router } from '@angular/router';

export type UserRole = 'ADMIN' | 'USER';

export interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentRole = new BehaviorSubject<UserRole>('USER');
  currentRole$ = this.currentRole.asObservable();

  // Nouveau : Subject pour l'utilisateur complet
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private userService: UserService , private router: Router) {
    this.loadUserFromToken(); // ← Changé
  }

  // ================= LOGIN =================
  login(payload: LoginRequest) {
    return this.userService.login(payload).pipe(
      tap((res: ApiResponse<AuthResponse>) => {
        if (res.success && res.data?.accessToken) {
          localStorage.setItem('access_token', res.data.accessToken);
          localStorage.setItem('refresh_token', res.data.refreshToken);
          this.setUserFromToken(res.data.accessToken); // ← Mise à jour
        }
      })
    );
  }

  // ================= CHARGEMENT UTILISATEUR DEPUIS TOKEN =================
  private loadUserFromToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.setUserFromToken(token);
    } else {
      this.currentUserSubject.next(null);
    }
  }

  private setUserFromToken(token: string) {
    try {
      const decoded: any = jwtDecode(token);

      const userId = decoded.sub || decoded.userId || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

      if (!userId) {
        console.warn('ID utilisateur non trouvé dans le token');
        this.currentUserSubject.next(null);
        return;
      }

      const roles = this.extractRoles(decoded);
      const isAdmin = roles.some(r => r.toLowerCase() === 'admin');
      const role: UserRole = isAdmin ? 'ADMIN' : 'USER';

      const user: CurrentUser = {
        id: userId,
        name: decoded.name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email'],
        role
      };

      this.currentUserSubject.next(user);
      this.currentRole.next(role);

    } catch (e) {
      console.error('Erreur lors du décodage du token', e);
      this.currentUserSubject.next(null);
      this.currentRole.next('USER');
    }
  }

  private extractRoles(decoded: any): string[] {
    let roles: any = decoded.role || decoded.roles || 
                     decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    if (!roles) return [];
    return Array.isArray(roles) ? roles : [roles];
  }

  // ================= HELPERS =================
  
  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  isAdmin(): boolean {
    return this.currentRole.value === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

 logout() {
  localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

  this.currentUserSubject.next(null);
  this.currentRole.next('USER');

  

  // 🔥 REDIRECTION
  this.router.navigate(['/signin']);
}



refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    return throwError(() => new Error('No refresh token'));
  }

  return this.userService.refreshToken(refreshToken).pipe(
    tap((res: ApiResponse<AuthResponse>) => {
      if (res.success && res.data) {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);

        this.setUserFromToken(res.data.accessToken);
      }
    })
  );
}
}