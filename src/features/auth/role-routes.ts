import type { UserType } from "./schema";

const roleHomePaths: Record<UserType, string> = {
  candidate: "/candidato",
  company: "/empresa",
  administrator: "/administrador",
};

export function getRoleHomePath(userType: UserType): string {
  return roleHomePaths[userType];
}
