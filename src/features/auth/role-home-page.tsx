interface RoleHomePageProps {
  title: string;
}

export function RoleHomePage({ title }: RoleHomePageProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
    </main>
  );
}
