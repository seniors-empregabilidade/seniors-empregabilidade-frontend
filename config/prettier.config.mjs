import { fileURLToPath, URL } from "node:url";

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: fileURLToPath(
    new URL("../src/styles.css", import.meta.url),
  ),
};
