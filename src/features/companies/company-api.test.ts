import { beforeEach, expect, it, vi } from "vitest";

import {
  confirmCompanyEmail,
  getCompanyRecord,
  getPostalAddress,
  registerCompany,
  resendCompanyCode,
} from "./company-api";

const requests = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiClient: requests }));
beforeEach(() => {
  vi.resetAllMocks();
});

it("sends only the registration contract, without password confirmation", async () => {
  const created = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "test@company.invalid",
    status: "pending",
    email_confirmation_required: true,
  };
  requests.post.mockResolvedValue({ data: created });
  const result = await registerCompany({
    cnpj: "11.222.333/0001-81",
    display_name: "Synthetic",
    corporate_email: "TEST@company.invalid",
    linkedin_url: "",
    password: "Synthetic!42",
    confirm_password: "Synthetic!42",
    terms_accepted: true,
    address: {
      zip_code: "12345-678",
      street: "Street",
      number: "1",
      complement: "",
      neighborhood: "District",
      city: "City",
      state: "RS",
    },
  });
  expect(result).toEqual(created);
  expect(requests.post).toHaveBeenCalledWith("/companies", {
    cnpj: "11222333000181",
    display_name: "Synthetic",
    corporate_email: "test@company.invalid",
    linkedin_url: null,
    password: "Synthetic!42",
    terms_accepted: true,
    terms_version: "v1",
    address: {
      zip_code: "12345678",
      street: "Street",
      number: "1",
      complement: null,
      neighborhood: "District",
      city: "City",
      state: "RS",
    },
  });
});

it("validates registry identity and passes the cancellation signal", async () => {
  const record = {
    cnpj: "11222333000181",
    legal_name: "Synthetic",
    trade_name: null,
    primary_cnae: "6201501",
  };
  requests.get.mockResolvedValue({ data: record });
  const signal = new AbortController().signal;
  expect(await getCompanyRecord(record.cnpj, signal)).toEqual(record);
  expect(requests.get).toHaveBeenCalledWith(
    `/company-registry-records/${record.cnpj}`,
    { signal },
  );
  await expect(getCompanyRecord("11444777000161")).rejects.toThrow(
    "Unexpected registry record",
  );
});

it.each([
  { erro: true },
  { erro: "true" },
  {},
  {
    cep: "99999-999",
    logradouro: "",
    bairro: "",
    localidade: "Synthetic",
    uf: "RS",
  },
])("rejects unknown or mismatched postal responses", async (data) => {
  requests.get.mockResolvedValue({ data });
  await expect(getPostalAddress("12345678")).rejects.toMatchObject({
    code: "postal_code_not_found",
  });
});

it("accepts a postal address and forwards cancellation", async () => {
  const address = {
    cep: "12345-678",
    logradouro: "Street",
    bairro: "District",
    localidade: "City",
    uf: "RS",
  };
  const signal = new AbortController().signal;
  requests.get.mockResolvedValue({ data: address });
  expect(await getPostalAddress("12345678", signal)).toEqual(address);
  expect(requests.get).toHaveBeenCalledWith(
    "https://viacep.com.br/ws/12345678/json/",
    { signal },
  );
});

it("confirms and resends through the backend without an AWS secret", async () => {
  requests.post.mockResolvedValue({ status: 204 });
  await confirmCompanyEmail("test@company.invalid", "123456");
  await resendCompanyCode("test@company.invalid");
  expect(requests.post).toHaveBeenNthCalledWith(
    1,
    "/email-verification/confirm",
    { email: "test@company.invalid", code: "123456" },
  );
  expect(requests.post).toHaveBeenNthCalledWith(2, "/email-verification/send", {
    email: "test@company.invalid",
  });
});
