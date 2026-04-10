export type Role = "user" | "admin";

export interface SafeUser {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  phoneNumber?: string;
  address?: string;
  goals?: string;
}
