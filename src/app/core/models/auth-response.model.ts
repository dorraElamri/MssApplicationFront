export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  role: string[];
}
