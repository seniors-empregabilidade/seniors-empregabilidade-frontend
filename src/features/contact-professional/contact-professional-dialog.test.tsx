import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ContactProfessionalDialog } from "./contact-professional-dialog";

const postMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: postMock },
}));

const RESPONSE = {
  id: "contact-1",
  job_id: "job-1",
  candidate_id: "cand-1",
  created_at: "2026-11-04T20:00:00Z",
  email_status: "pending",
};

beforeAll(() => {
  // O jsdom não implementa showModal/close do <dialog>.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  postMock.mockReset();
  postMock.mockResolvedValue({ data: RESPONSE });
});

function renderDialog(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ContactProfessionalDialog
        jobId="job-1"
        jobTitle="Atendente de loja"
        candidateId="cand-1"
        professionalName="Marcos Silveira"
        onClose={onClose}
      />
    </QueryClientProvider>,
  );

  return { onClose };
}

describe("ContactProfessionalDialog", () => {
  it("mostra o profissional e a vaga relacionada", () => {
    renderDialog();

    expect(screen.getByText("Marcos Silveira")).toBeInTheDocument();
    expect(screen.getByText("Atendente de loja")).toBeInTheDocument();
  });

  it("não deixa enviar mensagem vazia", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Mensagem"), "   ");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Escreva uma mensagem",
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("envia só ids e mensagem, sem e-mail, e confirma o envio", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByLabelText("Mensagem"),
      "  Olá, temos interesse.  ",
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Mensagem enviada",
    );
    expect(postMock).toHaveBeenCalledWith("/contacts", {
      job_id: "job-1",
      candidate_id: "cand-1",
      message: "Olá, temos interesse.",
    });
  });

  it("mostra erro específico e mantém o texto para nova tentativa", async () => {
    postMock.mockRejectedValueOnce({ response: { status: 409 } });
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Mensagem"), "Olá");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "não pode receber contatos",
    );
    expect(screen.getByLabelText("Mensagem")).toHaveValue("Olá");

    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("mostra erro genérico quando a falha é desconhecida", async () => {
    postMock.mockRejectedValueOnce(new Error("rede"));
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Mensagem"), "Olá");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível enviar a mensagem",
    );
  });

  it("avisa o pai ao cancelar", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});
