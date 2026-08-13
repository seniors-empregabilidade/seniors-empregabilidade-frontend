import path from "node:path";

import js from "@eslint/js";
import query from "@tanstack/eslint-plugin-query";
import router from "@tanstack/eslint-plugin-router";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const projectRoot = path.resolve(import.meta.dirname, "..");

export default tseslint.config(
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: projectRoot,
      },
    },
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  {
    ...reactHooks.configs.flat["recommended-latest"],
    files: ["**/*.{ts,tsx}"],
  },
  {
    ...reactRefresh.configs.vite,
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowExportNames: ["Route", "buttonVariants"],
        },
      ],
    },
  },
  ...query.configs["flat/recommended"],
  ...router.configs["flat/recommended"],
  prettier,
);
