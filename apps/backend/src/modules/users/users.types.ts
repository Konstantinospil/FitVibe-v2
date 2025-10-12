export interface UserSafe {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
  profile?: any;
}

export interface UserMutable {
  locale?: string;
  bio?: string;
  username?: string;
}

export interface UpdateProfileNameDTO {
  username?: string;
  locale?: UserMutable;
  bio?: UserMutable;
}

export interface UpdateProfileBioDTO {
  username?: UserMutable;
  locale?: UserMutable;
  bio?: string;
}

export interface UpdateProfileDTO {
  username?: UserMutable;
  locale?: UserMutable;
  bio?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
