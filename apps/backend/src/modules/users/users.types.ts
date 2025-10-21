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

export interface UserDataExportBundle {
  meta: {
    schemaVersion: string;
    exportedAt: string;
    recordCounts: Record<string, number>;
  };
  user: Record<string, unknown>;
  profile: Record<string, unknown> | null;
  contacts: Record<string, unknown>[];
  metrics: Record<string, unknown>[];
  social: {
    followers: Record<string, unknown>[];
    following: Record<string, unknown>[];
  };
  exercises: {
    personal: Record<string, unknown>[];
    plans: Record<string, unknown>[];
  };
  sessions: {
    items: Record<string, unknown>[];
    exercises: Record<string, unknown>[];
    sets: Record<string, unknown>[];
  };
  points: {
    total: number;
    history: Record<string, unknown>[];
  };
  badges: Record<string, unknown>[];
  media: Record<string, unknown>[];
  stateHistory: Record<string, unknown>[];
}
