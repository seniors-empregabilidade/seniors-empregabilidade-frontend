import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cleanup,
  render as renderComponent,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

import { ProfileView } from "./profile-view";

vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn() } }));

const validProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  full_name: "Marcos Silveira",
  age: 58,
  email: "marcos@example.com",
  city: "São Paulo",
  state: "SP",
  photo_url: null,
  summary: "Profissional de operações e logística.",
  experiences: [
    {
      id: "1",
      role: "Gerente de Operações",
      company: "Log Brasil",
      start_date: "2012-01-01",
      end_date: "2023-01-01",
      description: "Equipe de 40 pessoas em 3 centros de distribuição.",
    },
  ],
  education: [
    {
      id: "1",
      course: "MBA em Gestão Empresarial",
      institution: "FGV",
      year: 2011,
    },
  ],
  skills: ["Liderança", "Logística"],
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

describe("ProfileView", () => {
  it("shows the profile once it loads", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: validProfile });

    render(<ProfileView onEditProfile={vi.fn()} />);

    expect(await screen.findByText("Marcos Silveira")).toBeVisible();
    expect(screen.getByText(/58 anos/)).toBeVisible();
    expect(screen.getByText("Gerente de Operações · Log Brasil")).toBeVisible();
    expect(screen.getByText("MBA em Gestão Empresarial")).toBeVisible();
    expect(screen.getByText("Liderança")).toBeVisible();
  });

  it("shows empty states for sections with no data", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: { ...validProfile, experiences: [], education: [], skills: [] },
    });

    render(<ProfileView onEditProfile={vi.fn()} />);

    await screen.findByText("Marcos Silveira");
    expect(
      screen.getByText("Nenhuma experiência cadastrada ainda."),
    ).toBeVisible();
    expect(
      screen.getByText("Nenhuma formação cadastrada ainda."),
    ).toBeVisible();
    expect(
      screen.getByText("Nenhuma habilidade cadastrada ainda."),
    ).toBeVisible();
  });
  it("shows an error state with a retry action when the request fails", async () => {
    const user = userEvent.setup();
    const get = vi
      .spyOn(apiClient, "get")
      .mockRejectedValueOnce(new Error("Not Found"))
      .mockRejectedValueOnce(new Error("Not Found"))
      .mockResolvedValueOnce({ data: validProfile });

    render(<ProfileView onEditProfile={vi.fn()} />);

    expect(
      await screen.findByText("Not Found", {}, { timeout: 3000 }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(await screen.findByText("Marcos Silveira")).toBeVisible();
    expect(get).toHaveBeenCalledTimes(3);
  });

  it("calls onEditProfile when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEditProfile = vi.fn();
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: validProfile });

    render(<ProfileView onEditProfile={onEditProfile} />);

    await screen.findByText("Marcos Silveira");
    await user.click(screen.getByRole("button", { name: /editar perfil/i }));

    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });
});
