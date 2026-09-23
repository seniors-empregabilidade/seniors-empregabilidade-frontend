import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cleanup,
  fireEvent,
  render as renderComponent,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import { EditProfileModal } from "./edit-profile-modal";
import type { ProfessionalProfile } from "./professional-profile-schema";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const baseProfile: ProfessionalProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Marcos Silveira",
  age: 58,
  email: "marcos@example.com",
  phone: "11988887777",
  city: "São Paulo",
  state: "SP",
  photo_url: null,
  summary: "Profissional de operações e logística.",
  experiences: [],
  education: [],
  skills: [{ id: "s1", name: "Liderança", type: "soft" }],
};

function render(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderComponent(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("EditProfileModal", () => {
  it("adds a new experience inline and shows it in the list", async () => {
    const user = userEvent.setup();
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    await user.click(
      screen.getByRole("button", { name: /adicionar experiência/i }),
    );

    await user.type(screen.getByLabelText(/^cargo$/i), "Analista");
    await user.type(screen.getByLabelText(/^empresa$/i), "Empresa X");
    await user.click(screen.getByRole("button", { name: /concluir/i }));

    expect(screen.getByText("Analista · Empresa X")).toBeVisible();
  });

  it("cancels a new (empty) experience without leaving a blank card behind", async () => {
    const user = userEvent.setup();
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    await user.click(
      screen.getByRole("button", { name: /adicionar experiência/i }),
    );
    await user.click(
      screen.getAllByRole("button", { name: /^cancelar$/i })[0]!,
    );

    expect(
      screen.getByText("Nenhuma experiência cadastrada ainda."),
    ).toBeVisible();
  });

  it("removes an existing skill", async () => {
    const user = userEvent.setup();
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    expect(screen.getByText("Liderança")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /remover habilidade liderança/i }),
    );

    expect(screen.queryByText("Liderança")).not.toBeInTheDocument();
  });

  it("adds a new skill by typing and pressing Enter", async () => {
    const user = userEvent.setup();
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    const input = screen.getByLabelText(/adicionar habilidade/i);
    await user.type(input, "Negociação{Enter}");

    expect(screen.getByText("Negociação")).toBeVisible();
    expect(input).toHaveValue("");
  });

  it("rejects an oversized photo file with a visible error", async () => {
    const user = userEvent.setup();
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "foto.png", {
      type: "image/png",
    });
    const fileInput = screen.getByLabelText(/selecionar foto de perfil/i);

    await user.upload(fileInput, bigFile);

    expect(
      await screen.findByText("O arquivo não pode passar de 5 MB."),
    ).toBeVisible();
  });

  it("rejects a non JPG/PNG file", async () => {
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    const badFile = new File(["not-an-image"], "arquivo.pdf", {
      type: "application/pdf",
    });
    const fileInput = screen.getByLabelText(/selecionar foto de perfil/i);

    // fireEvent (não userEvent.upload) porque o user-event respeita o
    // `accept` do input e não dispara a mudança pra um tipo incompatível —
    // mas nossa validação em JS precisa funcionar mesmo se alguém
    // contornar o filtro do sistema operacional (ex.: "Todos os arquivos").
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(
      await screen.findByText("Envie um arquivo JPG ou PNG."),
    ).toBeVisible();
  });

  it("only sends the 5 backend-supported fields when saving", async () => {
    const user = userEvent.setup();
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      data: baseProfile,
    });

    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    await user.click(
      screen.getByRole("button", { name: /adicionar experiência/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /salvar alterações/i }),
    );

    expect(patch).toHaveBeenCalledWith("/professionals/me", {
      full_name: baseProfile.full_name,
      phone: baseProfile.phone,
      city: baseProfile.city,
      state: baseProfile.state,
      summary: baseProfile.summary,
    });
  });

  it("shows an explicit success message after saving", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ data: baseProfile });

    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    await user.click(
      screen.getByRole("button", { name: /salvar alterações/i }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Perfil atualizado com sucesso.",
    );
  });
});
