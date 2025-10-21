export type UserStatus = "pending_verification" | "active" | "archived" | "pending_deletion";

export interface UserContact {
  id: string;
  type: "email" | "phone";
  value: string;
  isPrimary: boolean;
  isRecovery: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface UserAvatar {
  url: string;
  mimeType: string | null;
  bytes: number | null;
  updatedAt: string | null;
}

export interface UserSafe {
  id: string;
  username: string;
  displayName: string;
  locale: string;
  preferredLang: string;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  primaryEmail: string | null;
  phoneNumber: string | null;
  avatar: UserAvatar | null;
}

export interface UserDetail extends UserSafe {
  contacts: UserContact[];
}

export interface UpdateProfileDTO {
  username?: string;
  displayName?: string;
  locale?: string;
  preferredLang?: string;
}

export interface CreateUserDTO {
  username: string;
  displayName: string;
  email: string;
  password: string;
  role: string;
  locale?: string;
  preferredLang?: string;
  status?: UserStatus;
}

export interface ContactUpsertDTO {
  type: "email" | "phone";
  value: string;
  isPrimary?: boolean;
  isRecovery?: boolean;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
