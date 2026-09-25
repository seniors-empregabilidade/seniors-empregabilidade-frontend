import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

import { fetchCompanyJobs, updateCompanyJobStatus } from "./company-jobs-api";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const job = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Analista de Operações",
  work_mode: "remote",
  closing_date: "2026-12-31",
  status: "published",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("company jobs api", () => {
  it("returns the parsed jobs", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [job] });

    await expect(fetchCompanyJobs()).resolves.toEqual([job]);
  });

  it("rejects a response that does not match the contract", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ data: [{ id: "1" }] });

    await expect(fetchCompanyJobs()).rejects.toBeInstanceOf(ApiError);
  });

  it("sends the new status to the job endpoint", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: { ...job, status: "paused" },
    });

    await updateCompanyJobStatus({ id: job.id, status: "paused" });

    expect(patch).toHaveBeenCalledWith(`/jobs/${job.id}/status`, {
      status: "paused",
    });
  });
});
