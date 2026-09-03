import type { Session } from "@/lib/schemas/login";

const roleHomePaths: Record<Session["role"], string> = {
  candidato: "/candidato",
  empresa: "/empresa",
};

export function getRoleHomePath(role: Session["role"]): string {
  return roleHomePaths[role];
}
