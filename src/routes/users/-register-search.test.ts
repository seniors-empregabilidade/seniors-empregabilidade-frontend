import { expect, it } from "vitest";

import { registerSearchSchema } from "./-register-search";

it.each([
  [{}, "candidato"],
  [{ tipo: "candidato" }, "candidato"],
  [{ tipo: "empresa" }, "empresa"],
])("keeps a known tipo and defaults when absent: %j", (search, expected) => {
  expect(registerSearchSchema.parse(search).tipo).toBe(expected);
});

it.each([
  { tipo: "banana" },
  { tipo: "" },
  { tipo: "EMPRESA" },
  { tipo: 7 },
  { tipo: null },
])(
  "falls back to the candidate tab instead of breaking the page: %j",
  (search) => {
    expect(registerSearchSchema.parse(search).tipo).toBe("candidato");
  },
);
