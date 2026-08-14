import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { queryClient } from "@/lib/query-client";

describe("queryClient", () => {
  it("uses TanStack Query's standard in-memory client", () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });
});
