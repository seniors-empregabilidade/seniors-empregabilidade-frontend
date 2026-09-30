import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cleanup,
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import { EditProfileModal } from "./edit-profile-modal";
import type { ProfessionalProfile } from "./professional-profile-schema";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

const profileQueryKey = ["candidates", "professional-profile"];

function render(element: ReactElement, client = new QueryClient()) {
  return renderComponent(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("EditProfileModal", () => {
  describe("experience", () => {
    it("persists a new experience and shows it in the list", async () => {
      const user = userEvent.setup();
      const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: {
          id: "exp-1",
          role: "Analista",
          company_name: "Empresa X",
          start_date: "2020-01-01",
          end_date: null,
          description: null,
        },
      });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.click(
        screen.getByRole("button", { name: /adicionar experiência/i }),
      );
      await user.type(screen.getByLabelText(/^cargo$/i), "  Analista ");
      await user.type(screen.getByLabelText(/^empresa$/i), "Empresa X");
      fireEvent.change(screen.getByLabelText(/^início$/i), {
        target: { value: "2020-01-01" },
      });
      await user.click(screen.getByRole("button", { name: /concluir/i }));

      expect(await screen.findByText("Analista · Empresa X")).toBeVisible();
      expect(post).toHaveBeenCalledWith("/professionals/me/experiences", {
        role: "Analista",
        company_name: "Empresa X",
        start_date: "2020-01-01",
        end_date: null,
        description: null,
      });
    });

    it("cancels a new (empty) experience without leaving a blank card behind", async () => {
      const user = userEvent.setup();
      const post = vi.spyOn(apiClient, "post");
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
      expect(post).not.toHaveBeenCalled();
    });

    it("edits and removes an experience through its own endpoint", async () => {
      const user = userEvent.setup();
      const existing = {
        id: "exp-9",
        role: "Gerente",
        company_name: "Log Brasil",
        start_date: "2012-01-01",
        end_date: "2023-01-01",
        description: null,
      };
      const patch = vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
        data: { ...existing, role: "Diretor" },
      });
      const remove = vi
        .spyOn(apiClient, "delete")
        .mockResolvedValueOnce({ data: undefined });

      render(
        <EditProfileModal
          open
          onOpenChange={vi.fn()}
          profile={{ ...baseProfile, experiences: [existing] }}
        />,
      );

      await user.click(screen.getByRole("button", { name: /^editar$/i }));
      const role = screen.getByLabelText(/^cargo$/i);
      await user.clear(role);
      await user.type(role, "Diretor");
      await user.click(screen.getByRole("button", { name: /concluir/i }));

      expect(await screen.findByText("Diretor · Log Brasil")).toBeVisible();
      expect(patch).toHaveBeenCalledWith(
        "/professionals/me/experiences/exp-9",
        expect.objectContaining({ role: "Diretor" }),
      );

      await user.click(screen.getByRole("button", { name: /^remover$/i }));

      expect(
        await screen.findByText("Nenhuma experiência cadastrada ainda."),
      ).toBeVisible();
      expect(remove).toHaveBeenCalledWith(
        "/professionals/me/experiences/exp-9",
      );
    });

    it("explains a period the backend rejects", async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(
        new ApiError({
          message: "The end date cannot be before the start date.",
          status: 422,
          code: "invalid_experience_period",
        }),
      );

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.click(
        screen.getByRole("button", { name: /adicionar experiência/i }),
      );
      await user.type(screen.getByLabelText(/^cargo$/i), "Analista");
      await user.type(screen.getByLabelText(/^empresa$/i), "Empresa X");
      fireEvent.change(screen.getByLabelText(/^início$/i), {
        target: { value: "2020-01-01" },
      });
      await user.click(screen.getByRole("button", { name: /concluir/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "A data de fim não pode ser anterior à data de início.",
      );
    });
  });

  describe("education", () => {
    it("persists a new education through the education endpoint", async () => {
      const user = userEvent.setup();
      const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: {
          id: "edu-1",
          institution: "FGV",
          degree: "MBA",
          field: null,
          start_date: null,
          end_date: null,
        },
      });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.click(
        screen.getByRole("button", { name: /adicionar formação/i }),
      );
      await user.type(screen.getByLabelText(/^instituição$/i), "FGV");
      await user.type(screen.getByLabelText(/curso\/grau/i), "MBA");
      await user.click(screen.getByRole("button", { name: /concluir/i }));

      expect(await screen.findByText("MBA")).toBeVisible();
      expect(post).toHaveBeenCalledWith("/professionals/me/education", {
        institution: "FGV",
        degree: "MBA",
        field: null,
        start_date: null,
        end_date: null,
      });
    });
  });

  describe("skills", () => {
    it("removes a skill through the skills endpoint", async () => {
      const user = userEvent.setup();
      const remove = vi
        .spyOn(apiClient, "delete")
        .mockResolvedValueOnce({ data: undefined });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.click(
        screen.getByRole("button", { name: /remover habilidade liderança/i }),
      );

      await waitFor(() =>
        expect(screen.queryByText("Liderança")).not.toBeInTheDocument(),
      );
      expect(remove).toHaveBeenCalledWith("/professionals/me/skills/s1");
    });

    it("keeps a skill whose removal fails and says why", async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(
        new ApiError({ message: "Network Error" }),
      );

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.click(
        screen.getByRole("button", { name: /remover habilidade liderança/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Não foi possível salvar a alteração. Tente novamente.",
      );
      expect(screen.getByText("Liderança")).toBeVisible();
    });

    it("searches the catalog and adds the chosen skill by its id", async () => {
      const user = userEvent.setup();
      const get = vi.spyOn(apiClient, "get").mockResolvedValue({
        data: [
          { id: "s1", name: "Liderança", type: "soft" },
          { id: "s2", name: "Negociação", type: "soft" },
          { id: "s3", name: "Negócios internacionais", type: "hard" },
        ],
      });
      const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: { id: "s2", name: "Negociação", type: "soft" },
      });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.type(screen.getByLabelText(/adicionar habilidade/i), "neg");

      const suggestions = await screen.findByRole("list", {
        name: /sugestões de habilidades/i,
      });
      expect(get).toHaveBeenCalledWith(
        "/skills",
        expect.objectContaining({
          params: expect.objectContaining({ search: "neg" }) as unknown,
        }),
      );
      // A skill already in the profile is not offered again.
      expect(
        within(suggestions).queryByRole("button", { name: "Liderança" }),
      ).not.toBeInTheDocument();

      await user.click(
        within(suggestions).getByRole("button", { name: "Negociação" }),
      );

      expect(
        await screen.findByRole("button", {
          name: /remover habilidade negociação/i,
        }),
      ).toBeVisible();
      expect(post).toHaveBeenCalledWith("/professionals/me/skills", {
        skill_id: "s2",
      });
      expect(screen.getByLabelText(/adicionar habilidade/i)).toHaveValue("");
    });

    it("adds the exact catalog match when Enter is pressed", async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: [
          { id: "s2", name: "Negociação", type: "soft" },
          { id: "s3", name: "Negociação avançada", type: "soft" },
        ],
      });
      const post = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        data: { id: "s2", name: "Negociação", type: "soft" },
      });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      const input = screen.getByLabelText(/adicionar habilidade/i);
      await user.type(input, "negociacao");
      await screen.findByRole("list", { name: /sugestões de habilidades/i });
      await user.type(input, "{Enter}");

      await waitFor(() =>
        expect(post).toHaveBeenCalledWith("/professionals/me/skills", {
          skill_id: "s2",
        }),
      );
    });

    it("does not add a skill the profile already has", async () => {
      const user = userEvent.setup();
      const post = vi.spyOn(apiClient, "post");
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.type(
        screen.getByLabelText(/adicionar habilidade/i),
        "lideranca{Enter}",
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Esta habilidade já está no seu perfil.",
      );
      expect(post).not.toHaveBeenCalled();
    });

    it("says when the catalog has no matching skill", async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: [] });

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.type(screen.getByLabelText(/adicionar habilidade/i), "xyz");

      expect(
        await screen.findByText("Nenhuma habilidade encontrada no catálogo."),
      ).toBeVisible();
    });

    it("says when the catalog search fails", async () => {
      const user = userEvent.setup();
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError({ message: "Network Error" }),
      );

      render(
        <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      );

      await user.type(screen.getByLabelText(/adicionar habilidade/i), "xyz");

      expect(
        await screen.findByText(
          "Não foi possível buscar as habilidades. Tente novamente.",
        ),
      ).toBeVisible();
    });
  });

  it("shows the photo upload as unavailable", () => {
    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
    );

    expect(screen.getByRole("button", { name: /enviar foto/i })).toBeDisabled();
    expect(
      screen.getByText("O envio de foto ainda não está disponível."),
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

  it("replaces the cached profile with the saved one", async () => {
    const user = userEvent.setup();
    const client = new QueryClient();
    const saved = { ...baseProfile, full_name: "Marcos S. Silveira" };
    vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ data: saved });

    render(
      <EditProfileModal open onOpenChange={vi.fn()} profile={baseProfile} />,
      client,
    );

    await user.click(
      screen.getByRole("button", { name: /salvar alterações/i }),
    );

    await screen.findByRole("status");
    expect(client.getQueryData(profileQueryKey)).toEqual(saved);
  });

  it("explains a save failure without closing the modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    vi.spyOn(apiClient, "patch").mockRejectedValueOnce(
      new ApiError({
        message: "Validation failed.",
        status: 422,
        code: "validation_error",
      }),
    );

    render(
      <EditProfileModal
        open
        onOpenChange={onOpenChange}
        profile={baseProfile}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /salvar alterações/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Alguns dados não foram aceitos. Revise os campos e tente novamente.",
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("refreshes the stored profile when the modal closes", async () => {
    const user = userEvent.setup();
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const onOpenChange = vi.fn();

    render(
      <EditProfileModal
        open
        onOpenChange={onOpenChange}
        profile={baseProfile}
      />,
      client,
    );

    await user.click(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: profileQueryKey });
  });
});
