import { afterEach, describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";
import { stubApiRoutes, type ApiStub } from "../../../tests/api-stub";

import {
  fetchSupportContact,
  supportWhatsAppUrl,
  type SupportContact,
} from "./support-contact";

const contact: SupportContact = {
  whatsapp_number: "5551999990000",
  initial_message: "Olá! Preciso de ajuda.",
};

let stub: ApiStub | undefined;

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

describe("fetchSupportContact", () => {
  it("reads the public contact", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": { status: 200, data: contact },
    });

    await expect(fetchSupportContact()).resolves.toEqual(contact);
    expect(stub.requests[0]?.authorization).toBeNull();
  });

  it("treats a missing contact as nothing to show", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": {
        status: 404,
        data: {
          title: "Not Found",
          status: 404,
          code: "support_contact_not_configured",
        },
      },
    });

    await expect(fetchSupportContact()).resolves.toBeNull();
  });

  it("rejects an unexpected payload", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": {
        status: 200,
        data: { whatsapp_number: "não-é-número", initial_message: "Olá" },
      },
    });

    await expect(fetchSupportContact()).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects a failed request", async () => {
    stub = stubApiRoutes({
      "GET /support/contact": { status: 0 },
    });

    await expect(fetchSupportContact()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("supportWhatsAppUrl", () => {
  it("builds a wa.me link with the configured message", () => {
    const url = new URL(supportWhatsAppUrl(contact));

    expect(url.origin + url.pathname).toBe("https://wa.me/5551999990000");
    expect(url.searchParams.get("text")).toBe(contact.initial_message);
  });
});
