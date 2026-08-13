export default {
  "*.{js,mjs,cjs,ts,tsx}": [
    "eslint --config config/eslint.config.js --fix --max-warnings=0 --no-warn-ignored",
    "prettier --config config/prettier.config.mjs --write",
  ],
  "*.{css,html,json,md,yaml,yml}":
    "prettier --config config/prettier.config.mjs --write",
};
