import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSchema, fetchApplications } from "./applications-schema";
import type {
  SearchForm,
  Application,
  ApplicationStatus,
} from "./applications-schema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [appToQuit, setAppToQuit] = useState<string | null>(null);

  const {
    register,
    control,
    formState: { errors },
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: "" },
    mode: "onChange",
  });

  const searchValue = useWatch({
    control,
    name: "search",
    defaultValue: "",
  });

  const searchTerm = searchValue?.toLowerCase() || "";

  const {
    data: applications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetchApplications(),
  });

  const quitProcessMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      console.log("Saindo do processo:", id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      setAppToQuit(null);
    },
  });

  const filteredApplications = applications?.filter((app) =>
    app.company.toLowerCase().includes(searchTerm),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 bg-background p-6">
      <div>
        <h1 className="mb-6 text-2xl text-foreground">Candidaturas</h1>
        <div className="max-w-md space-y-1.5">
          <label htmlFor="search" className="text-base text-muted-foreground">
            Buscar por nome da empresa
          </label>
          <Input
            id="search"
            placeholder="Ex.: LogiBrás"
            {...register("search")}
            className={`h-11 rounded-md border-[1.5px] text-[18px] text-foreground transition-all focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              errors.search
                ? "border-[2px] border-destructive"
                : "border-[var(--input,#border)] focus-visible:border-primary"
            }`}
          />

          {errors.search?.message && (
            <p className="pt-1 text-base text-destructive">
              {errors.search.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <>
            <Skeleton className="h-36 w-full rounded-lg bg-accent" />
            <Skeleton className="h-36 w-full rounded-lg bg-accent" />
          </>
        )}

        {isError && (
          <div className="rounded-md border border-destructive bg-background p-4 text-base text-destructive">
            Ocorreu um erro ao carregar suas candidaturas. Tente novamente mais
            tarde.
          </div>
        )}

        {!isLoading && !isError && filteredApplications?.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            Nenhuma candidatura encontrada.
          </div>
        )}

        {filteredApplications?.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onQuitProcess={() => setAppToQuit(app.id)}
          />
        ))}
      </div>
      <AlertDialog open={!!appToQuit} onOpenChange={() => setAppToQuit(null)}>
        <AlertDialogContent className="rounded-xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Você tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Você será removido do processo
              seletivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-[1.5px] border-input bg-background text-foreground hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appToQuit && quitProcessMutation.mutate(appToQuit)}
              disabled={quitProcessMutation.isPending}
              className="rounded-md bg-[var(--destructive,#8C1D18)] text-white hover:opacity-90"
            >
              {quitProcessMutation.isPending ? "Saindo..." : "Sair do processo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
  onQuitProcess: () => void;
}

function ApplicationCard({ application, onQuitProcess }: ApplicationCardProps) {
  const closedStatus: ApplicationStatus = "CLOSED";
  const isClosed = application.status === closedStatus;

  return (
    <Card
      className={`overflow-hidden rounded-lg border border-border transition-colors ${isClosed ? "bg-muted" : "bg-background"}`}
    >
      <CardContent className="flex flex-col justify-between gap-6 p-[22px] md:flex-row md:gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-input bg-accent font-semibold text-foreground-2">
            {application.companyInitials}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">
              {application.role} · {application.company}
            </h3>
            <p className="text-base text-muted-foreground">
              {isClosed ? (
                <>
                  Encerrada em {application.closedDate} · você não foi
                  selecionado
                </>
              ) : (
                <>
                  Enviada em {application.appliedDate} ·{" "}
                  {application.daysInProcess} dias em processo
                </>
              )}
            </p>
            <div className="pt-2 text-base text-foreground-2">
              {isClosed ? (
                <p>
                  {application.closedReason} Há{" "}
                  <strong className="text-foreground">
                    {application.similarJobs} vagas parecidas
                  </strong>{" "}
                  abertas agora.
                </p>
              ) : (
                <p>
                  Em análise. A {application.company} costuma responder em até{" "}
                  {application.expectedResponseDays} dias.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-w-[200px] flex-col justify-start gap-2">
          {isClosed ? (
            <Button className="w-full rounded-md border-0 bg-primary hover:bg-primary-hover active:bg-primary">
              Ver vagas parecidas
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full rounded-md border-[1.5px] border-input bg-background text-foreground hover:bg-accent"
              >
                Ver a vaga
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-md border-[1.5px] border-input bg-background text-foreground hover:bg-accent"
                onClick={onQuitProcess}
              >
                Sair do processo
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
