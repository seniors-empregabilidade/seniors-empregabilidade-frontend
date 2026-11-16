import { useQuery } from "@tanstack/react-query";

import { companyStatusQueryOptions } from "./company-status";

// Only a pending or rejected company sees a notice; an approved one sees nothing.
export function CompanyStatusNotice() {
  const status = useQuery(companyStatusQueryOptions);
  const data = status.data;
  if (!data || data.status === "approved") return null;

  const rejected = data.status === "rejected";

  return (
    <div className="bg-muted px-4 pt-4 md:px-8 md:pt-8">
      <div
        role="status"
        className={
          rejected
            ? "flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-lg text-foreground"
            : "flex flex-col gap-1 rounded-lg border border-border bg-background p-4 text-lg text-foreground"
        }
      >
        {rejected ? (
          <>
            <p className="font-semibold">Seu cadastro não foi aprovado.</p>
            {data.rejection_reason ? (
              <p className="break-words whitespace-pre-line">
                Motivo: {data.rejection_reason}
              </p>
            ) : null}
            <p>Se tiver dúvidas, fale com o suporte pelo botão do WhatsApp.</p>
          </>
        ) : (
          <p>
            Sua empresa ainda não foi aprovada. Assim que a aprovação sair, você
            poderá publicar vagas e editar o perfil.
          </p>
        )}
      </div>
    </div>
  );
}
