import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:4173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotOnRunFailure: true,
  },
  retries: {
    runMode: 1,
    openMode: 0,
  },
  viewportHeight: 720,
  viewportWidth: 1280,
});
