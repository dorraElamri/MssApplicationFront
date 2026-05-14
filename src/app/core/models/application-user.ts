export interface ApplicationUser {
    id: string;
  userName: string;
  email: string;
  fullName?: string;
  refreshToken?: string;
  refreshTokenExpiryTime?: string;
  role ?: string[];

}


export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

