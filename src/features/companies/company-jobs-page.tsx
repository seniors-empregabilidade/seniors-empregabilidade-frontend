import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  companyJobsQueryKey,
  companyJobsQueryOptions,
  updateCompanyJobStatus,
} from "./company-jobs-api";
import {
  companyJobsErrorMessage,
  STATUS_LABELS,
  WORK_MODE_LABELS,
} from "./company-jobs-messages";
import {
  CLOSED_STATUS,
  isOpen,
  OPEN_STATUS,
  type CompanyJob,
} from "./company-jobs-schema";

interface CompanyJobsPageProps {
  /**
   * Abre a edição da vaga (US-18-T03). Ainda não existe: enquanto não for
   * passado, o botão "Editar" fica desabilitado.
   */
  onEditJob?: (job: CompanyJob) => void;
}

export function CompanyJobsPage({ onEditJob }: CompanyJobsPageProps) {
  const {
    data: jobs,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(companyJobsQueryOptions);
  const queryClient = useQueryClient();
  const [jobToClose, setJobToClose] = useState<CompanyJob | null>(null);

  const statusMutation = useMutation({
    mutationFn: updateCompanyJobStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: companyJobsQueryKey }),
  });

  if (isPending) {
    return (
      <main className="min-h-full bg-muted p-4 md:p-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Minhas vagas
        </h1>
        <p role="status">Carregando suas vagas…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-full bg-muted p-4 md:p-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">
          Minhas vagas
        </h1>
        <p role="alert">{companyJobsErrorMessage(error)}</p>
        <Button type="button" className="mt-4" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </main>
    );
  }

  const openCount = jobs.filter(isOpen).length;

  return (
    <main className="min-h-full bg-muted p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Minhas vagas</h1>
        <p className="text-muted-foreground">
          {openCount === 1
            ? "1 vaga em aberto"
            : `${openCount} vagas em aberto`}
        </p>
      </div>

      {jobs.length === 0 ? (
        <p>Nenhuma vaga publicada.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {job.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {WORK_MODE_LABELS[job.work_mode] ?? job.work_mode} · até{" "}
                    {new Date(
                      `${job.closing_date}T00:00:00`,
                    ).toLocaleDateString("pt-BR")}
                  </p>
                  <Badge className="mt-2">
                    {STATUS_LABELS[job.status] ?? job.status}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditJob?.(job)}
                    disabled={!onEditJob}
                  >
                    Editar
                  </Button>

                  {isOpen(job) ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setJobToClose(job)}
                      disabled={statusMutation.isPending}
                    >
                      Encerrar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        statusMutation.mutate({
                          id: job.id,
                          status: OPEN_STATUS,
                        })
                      }
                      disabled={statusMutation.isPending}
                    >
                      Reabrir
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {statusMutation.isError ? (
        <p role="alert" className="mt-4">
          {companyJobsErrorMessage(statusMutation.error)}
        </p>
      ) : null}

      <Dialog
        open={jobToClose !== null}
        onOpenChange={(open) => {
          if (!open) {
            setJobToClose(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Encerrar vaga</DialogTitle>
          <DialogDescription>
            {jobToClose
              ? `A vaga "${jobToClose.title}" deixa de aparecer nas buscas dos candidatos. Você pode reabri-la depois.`
              : ""}
          </DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                if (jobToClose) {
                  statusMutation.mutate({
                    id: jobToClose.id,
                    status: CLOSED_STATUS,
                  });
                  setJobToClose(null);
                }
              }}
            >
              Encerrar vaga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
