export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RegisterProfileInput {
  display_name?: string;
  sex?: "man" | "woman" | "diverse" | "na";
  weight_kg?: number | null;
  fitness_level?: string | null;
  age?: number | null;
}

export interface RegisterDTO {
  email: string;
  username: string;
  password: string;
  profile?: RegisterProfileInput;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}

export interface UserSafe {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
}
