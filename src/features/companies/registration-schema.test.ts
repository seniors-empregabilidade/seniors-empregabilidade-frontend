import { expect, it } from "vitest";

import { ApiError } from "@/lib/api-error";

import { registrationErrorMessage } from "./registration-errors";
import {
  companyRegistrationSchema,
  isValidCnpj,
  maskCnpj,
} from "./registration-schema";

it.each(["11222333000181", "11.222.333/0001-81", "11444777000161"])(
  "accepts a valid CNPJ %s",
  (value) => {
    expect(isValidCnpj(value)).toBe(true);
  },
);
it.each([
  "",
  "11111111111111",
  "11222333000182",
  "112223330001",
  "00000000000000",
])("rejects invalid CNPJ %s", (value) => {
  expect(isValidCnpj(value)).toBe(false);
});
it("formats CNPJ without changing digits", () => {
  expect(maskCnpj("11222333000181999")).toBe("11.222.333/0001-81");
});

const valid = {
  cnpj: "11222333000181",
  display_name: "Synthetic",
  corporate_email: "test@synthetic.invalid",
  password: "Synthetic!42",
  confirm_password: "Synthetic!42",
  linkedin_url: "",
  terms_accepted: true,
  address: {
    zip_code: "12345678",
    street: "Street",
    number: "1",
    complement: "",
    neighborhood: "District",
    city: "City",
    state: "RS",
  },
};
it.each([
  "https://linkedin.com/company/synthetic",
  "https://www.linkedin.com/company/synthetic",
  "",
])("accepts the company LinkedIn URL %s", (linkedin_url) => {
  expect(
    companyRegistrationSchema.safeParse({ ...valid, linkedin_url }).success,
  ).toBe(true);
});
it.each([
  "http://linkedin.com/company/test",
  "https://linkedin.com.evil.invalid/company/test",
  "https://linkedin.com/in/test",
  "https://user@linkedin.com/company/test",
  "invalid",
])("rejects invalid LinkedIn URL %s", (linkedin_url) => {
  expect(
    companyRegistrationSchema.safeParse({ ...valid, linkedin_url }).success,
  ).toBe(false);
});
it("maps unknown API failures to a safe Portuguese message", () => {
  expect(
    registrationErrorMessage(
      new ApiError({ message: "Private", code: "unknown" }),
    ),
  ).not.toContain("Private");
  expect(registrationErrorMessage(new Error("Private"))).not.toContain(
    "Private",
  );
});
