import { UserRole } from "@prisma/client";

export interface UserJwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedUser extends UserJwtPayload {}
