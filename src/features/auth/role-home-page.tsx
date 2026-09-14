interface RoleHomePageProps {
  title: string;
}

export function RoleHomePage({ title }: RoleHomePageProps) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
    </div>
  );
}
