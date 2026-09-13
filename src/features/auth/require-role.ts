import { redirect } from "@tanstack/react-router";

import { queryClient } from "@/lib/query-client";
import { clearSession, readAccessToken } from "@/lib/session-storage";

import { currentUserQueryKey, currentUserQueryOptions } from "./current-user";
import { getRoleHomePath } from "./role-routes";
import type { CurrentUser, UserType } from "./schema";

/**
 * Allow only the expected role into a route, from the server's answer.
 *
 * The stored token is never trusted for the role: `GET /auth/me` re-reads it
 * from the database, so a tampered store cannot promote anyone. The backend
 * guards answer 401/403 regardless; this only keeps the browser from showing an
 * environment the account cannot use.
 */
export async function requireRole(expected: UserType): Promise<CurrentUser> {
  if (!readAccessToken()) {
    throw redirect({ href: "/login" });
  }

  let user: CurrentUser;

  try {
    user = await queryClient.ensureQueryData(currentUserQueryOptions);
  } catch {
    // Expired, revoked or refused: keeping the token would only repeat the
    // failure on the next route.
    clearSession();
    queryClient.removeQueries({ queryKey: currentUserQueryKey });
    throw redirect({ href: "/login" });
  }

  if (user.user_type !== expected) {
    // Typing another environment's URL lands on the caller's own environment
    // instead of a dead end.
    throw redirect({ href: getRoleHomePath(user.user_type) });
  }

  return user;
}
