import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSchema, fetchApplications } from "./applications-schema";

import type {
  Application,
  ApplicationStatus,
  SearchForm,
} from "./applications-schema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
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

  const searchTerm = searchValue?.trim() ?? "";

  const {
    data: applications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications", searchTerm],
    queryFn: ({ signal }) =>
      fetchApplications({
        ...(searchTerm ? { companyName: searchTerm } : {}),
        signal,
      }),
  });

  const quitProcessMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await apiClient.post(`/applications/${applicationId}/withdraw`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["applications"],
      });

      setAppToQuit(null);
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-8 bg-background p-6">
      <div>
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Candidaturas
        </h1>
        <div className="max-w-md space-y-1.5">
          <label htmlFor="search" className="text-base text-muted-foreground">
            Buscar por nome da empresa
          </label>
          <Input
            id="search"
            placeholder="Ex.: LogiBrás"
            {...register("search")}
            aria-invalid={!!errors.search}
            aria-describedby={errors.search ? "search-error" : undefined}
          />

          {errors.search?.message && (
            <p
              id="search-error"
              role="alert"
              className="pt-1 text-base text-destructive"
            >
              {errors.search.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div role="status" aria-label="Carregando candidaturas">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="mt-4 h-36 w-full rounded-lg" />
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive bg-background p-4 text-base text-destructive"
          >
            Ocorreu um erro ao carregar suas candidaturas. Tente novamente mais
            tarde.
          </div>
        )}

        {!isLoading && !isError && applications?.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            Nenhuma candidatura encontrada.
          </div>
        )}

        {applications?.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onQuitProcess={() => setAppToQuit(application.id)}
            isQuitPending={quitProcessMutation.isPending}
          />
        ))}
      </div>
      <AlertDialog
        open={!!appToQuit}
        onOpenChange={(open) => {
          if (!open) {
            setAppToQuit(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-xl border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-foreground">
              Você tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Você será removido do processo
              seletivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (appToQuit) {
                  quitProcessMutation.mutate(appToQuit);
                }
              }}
              disabled={quitProcessMutation.isPending}
            >
              {quitProcessMutation.isPending ? "Saindo..." : "Sair do processo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

interface ApplicationCardProps {
  application: Application;
  onQuitProcess: () => void;
  isQuitPending: boolean;
}

function ApplicationCard({
  application,
  onQuitProcess,
  isQuitPending,
}: ApplicationCardProps) {
  const isClosed =
    application.status === "hired" ||
    application.status === "not_selected" ||
    application.status === "withdrawn" ||
    application.status === "expired";

  return (
    <Card
      className={`overflow-hidden rounded-lg border border-border transition-colors ${isClosed ? "bg-muted" : "bg-background"}`}
    >
      <CardContent className="flex flex-col justify-between gap-6 p-6 md:flex-row md:gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-input bg-accent text-base font-semibold text-foreground-2">
            {getCompanyInitials(application.company_name)}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {application.job_title} · {application.company_name}
            </h2>
            <p className="text-base text-muted-foreground">
              {getApplicationStatusLabel(application.status)}
            </p>

            <div className="pt-2 text-base text-foreground">
              <p>{getApplicationDescription(application)}</p>
            </div>

            {application.similar_jobs.length > 0 && (
              <p className="pt-2 text-base text-foreground">
                Há{" "}
                <strong>
                  {application.similar_jobs.length}{" "}
                  {application.similar_jobs.length === 1
                    ? "vaga parecida"
                    : "vagas parecidas"}
                </strong>{" "}
                abertas agora.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-[200px] flex-col justify-start gap-2">
          {isClosed ? (
            <Button disabled className="w-full">
              Ver vagas parecidas
            </Button>
          ) : (
            <>
              <Button variant="outline" disabled className="w-full">
                Ver a vaga
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onQuitProcess}
                disabled={isQuitPending}
              >
                {isQuitPending ? "Saindo..." : "Sair do processo"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function getCompanyInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/);

  if (words.length === 0 || !words[0]) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  const firstInitial = words[0][0] ?? "";
  const secondInitial = words[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
}

function getApplicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "applied":
      return "Candidatura enviada";

    case "under_review":
      return "Em análise";

    case "in_selection_process":
      return "Em processo seletivo";

    case "hired":
      return "Você foi selecionado";

    case "not_selected":
      return "Você não foi selecionado";

    case "withdrawn":
      return "Você saiu do processo seletivo";

    case "expired":
      return "Candidatura expirada";
  }
}

function getApplicationDescription(application: Application): string {
  const submittedDate = formatDate(application.submitted_at);

  switch (application.status) {
    case "applied":
      return `Enviada em ${submittedDate} · ${application.days_in_process} dias em processo.`;

    case "under_review":
      return `Enviada em ${submittedDate} · ${application.days_in_process} dias em processo.`;

    case "in_selection_process":
      return `Enviada em ${submittedDate} · ${application.days_in_process} dias em processo.`;

    case "hired":
      return `Enviada em ${submittedDate}. A empresa selecionou você para a oportunidade.`;

    case "not_selected":
      return `Enviada em ${submittedDate}. A empresa seguiu com outro candidato.`;

    case "withdrawn":
      return `Enviada em ${submittedDate}. Você optou por sair deste processo seletivo.`;

    case "expired":
      return `Enviada em ${submittedDate}. Esta candidatura não está mais ativa.`;
  }
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(new Date(date));
}
