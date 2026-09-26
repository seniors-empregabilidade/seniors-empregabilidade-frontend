import {
  createRootRoute,
  Outlet,
  useLocation,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { SiteHeader } from "@/components/site-header";
import { ApplicationErrorPage, NotFoundPage } from "@/error-pages";

const roleAreaRoots = ["/candidato", "/empresa", "/administrador"];

export function RootLayout() {
  const { pathname } = useLocation();
  // Matches the role root itself and any of its child routes (e.g.
  // /candidato/perfil), which also render inside RoleShell.
  const isRoleArea = roleAreaRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );

  return (
    <>
      {isRoleArea ? null : (
        <SiteHeader variant={pathname === "/" ? "landing" : "app"} />
      )}
      <Outlet />
      {import.meta.env.DEV ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
    </>
  );
}

function RootErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <ApplicationErrorPage
      errorMessage={
        import.meta.env.DEV && error instanceof Error
          ? error.message
          : undefined
      }
      onRetry={() => void router.invalidate()}
    />
  );
}

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorPage,
  notFoundComponent: NotFoundPage,
});
